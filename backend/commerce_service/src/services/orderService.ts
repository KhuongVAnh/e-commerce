import { randomBytes } from "crypto";
import { OrderStatus, PaymentMethod, PaymentStatus, TransactionStatus } from "@prisma/client";
import { prisma } from "../config/prisma";
import { HttpError } from "../utils/http";
import { buildCheckoutPreview } from "./checkoutPreview";
import { createVNPayCheckoutSession } from "./paymentService";
import { decrementProductsStock, incrementProductsStock } from "./catalogClient";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type CreateOrderInput = {
    shopId: bigint;
    cartItemIds: bigint[];
    paymentMethod: PaymentMethod;
    receiverName: string;
    receiverPhone: string;
    receiverAddress: string;
    note?: string;
    ipAddr?: string;
};

export type RefreshPaymentUrlResult = {
    orderId: bigint;
    orderCode: string;
    paymentUrl: string;
    expiresAt: Date;
};

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

/**
 * Sinh mã đơn hàng dạng: ORD-<timestamp>-<4 byte hex ngẫu nhiên>
 */
function generateOrderCode(): string {
    const timestamp = Date.now();
    const suffix = randomBytes(4).toString("hex");
    return `ORD-${timestamp}-${suffix}`;
}

/**
 * Xác định orderStatus và paymentStatus ban đầu dựa trên paymentMethod.
 */
function resolveInitialStatuses(paymentMethod: PaymentMethod): {
    orderStatus: OrderStatus;
    paymentStatus: PaymentStatus;
} {
    if (paymentMethod === PaymentMethod.COD) {
        return {
            orderStatus: OrderStatus.CONFIRMED,
            paymentStatus: PaymentStatus.COD_PENDING,
        };
    }

    return {
        orderStatus: OrderStatus.AWAITING_PAYMENT,
        paymentStatus: PaymentStatus.PENDING,
    };
}

// ─────────────────────────────────────────────────────────────
// Service functions
// ─────────────────────────────────────────────────────────────

/**
 * Tạo đơn hàng từ giỏ hàng theo 1 shop.
 */
export async function createOrder(
    customerId: bigint,
    input: CreateOrderInput,
): Promise<{ orderId: bigint; orderCode: string; orderStatus: OrderStatus; paymentStatus: PaymentStatus; totalAmount: number; paymentUrl?: string; paymentUrlExpiresAt?: Date }> {
    const { shopId, cartItemIds, paymentMethod, receiverName, receiverPhone, receiverAddress, note, ipAddr } = input;

    // Bước 1: Xây dựng preview để tính toán tổng tiền và validate các cart item
    const preview = await buildCheckoutPreview(customerId, shopId, cartItemIds);

    if (!preview.canCheckout) {
        const invalidItems = preview.items
            .filter((item) => !item.valid)
            .map((item) => ({
                productId: item.productId.toString(),
                reason: item.invalidReason ?? "Không hợp lệ",
            }));

        throw new HttpError(400, "Không thể tạo đơn hàng do một số sản phẩm không hợp lệ", {
            code: "CHECKOUT_NOT_ALLOWED",
            details: invalidItems.map((i) => `productId ${i.productId}: ${i.reason}`),
        });
    }

    // Bước 2: Tạo đơn hàng, order items, xóa cart items và tạo payment record trong transaction
    const { orderStatus, paymentStatus } = resolveInitialStatuses(paymentMethod);

    const orderCode = generateOrderCode();
    const totalAmount = preview.pricing.grandTotal;
    const shippingFee = preview.pricing.shippingFee;
    // Nếu là VNPay thì tạo payment session để lấy checkoutUrl ngay từ đầu, còn COD thì không cần
    const paymentSession = paymentMethod === PaymentMethod.VNPAY && ipAddr
        ? createVNPayCheckoutSession({
            orderCode,
            amount: totalAmount,
            ipAddr,
        })
        : undefined;

    // Bước 3: Trừ tồn kho bên Catalog Service (Giữ chỗ)
    await decrementProductsStock(
        preview.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
        })),
    );

    const result = await prisma.$transaction(async (tx) => {
        const order = await tx.order.create({
            data: {
                orderCode,
                customerId,
                shopId,
                totalAmount,
                shippingFee,
                paymentMethod,
                paymentStatus,
                orderStatus,
                receiverName,
                receiverPhone,
                receiverAddress,
                note: note ?? null,
            },
        });

        const orderItemsData = preview.items.map((item) => ({
            orderId: order.id,
            productId: item.productId,
            productNameSnapshot: item.productName!,
            priceSnapshot: item.unitPrice!,
            quantity: item.quantity,
            subtotal: item.subtotal!,
        }));

        await tx.orderItem.createMany({ data: orderItemsData });

        await tx.cartItem.deleteMany({
            where: { id: { in: cartItemIds } },
        });

        await tx.payment.create({
            data: {
                orderId: order.id,
                method: paymentMethod,
                amount: totalAmount,
                status: TransactionStatus.PENDING,
                checkoutUrl: paymentSession?.paymentUrl,
                checkoutUrlCreatedAt: paymentSession?.createdAt,
                checkoutUrlExpiresAt: paymentSession?.expiresAt,
            },
        });

        return { order };
    });

    return {
        orderId: result.order.id,
        orderCode: result.order.orderCode,
        orderStatus: result.order.orderStatus,
        paymentStatus: result.order.paymentStatus,
        totalAmount: Number(result.order.totalAmount),
        paymentUrl: paymentSession?.paymentUrl,
        paymentUrlExpiresAt: paymentSession?.expiresAt,
    };
}

// làm mới link thanh toán VNPay (trường hợp link cũ hết hạn hoặc bị lỗi)
export async function refreshOrderPaymentUrlIfNeeded(
    customerId: bigint,
    orderCode: string,
    ipAddr: string,
): Promise<RefreshPaymentUrlResult> {
    const order = await prisma.order.findFirst({
        where: {
            orderCode,
            customerId,
        },
        include: {
            payments: true,
        },
    });

    if (!order) {
        throw new HttpError(404, "Không tìm thấy đơn hàng", {
            code: "ORDER_NOT_FOUND",
        });
    }

    if (order.paymentMethod !== PaymentMethod.VNPAY) {
        throw new HttpError(400, "Đơn hàng này không dùng VNPay", {
            code: "INVALID_PAYMENT_METHOD",
        });
    }

    if (order.paymentStatus === PaymentStatus.PAID || order.orderStatus === OrderStatus.CANCELLED) {
        throw new HttpError(409, "Đơn hàng không còn ở trạng thái chờ thanh toán", {
            code: "PAYMENT_NOT_RESUMABLE",
        });
    }

    const payment = order.payments[0];
    if (!payment) {
        throw new HttpError(500, "Không tìm thấy bản ghi thanh toán của đơn hàng", {
            code: "PAYMENT_RECORD_MISSING",
        });
    }

    const now = new Date();
    // trường hợp link cũ vẫn còn hiệu lực và chưa được sử dụng thì trả lại link cũ, không tạo link mới
    if (payment.checkoutUrl && payment.checkoutUrlExpiresAt && payment.checkoutUrlExpiresAt > now && payment.status === TransactionStatus.PENDING) {
        return {
            orderId: order.id,
            orderCode: order.orderCode,
            paymentUrl: payment.checkoutUrl,
            expiresAt: payment.checkoutUrlExpiresAt,
        };
    }

    // tạo phiên checkout mới: url và thời gian hiệu lực mới
    const paymentSession = createVNPayCheckoutSession({
        orderCode: order.orderCode,
        amount: Number(order.totalAmount),
        ipAddr,
    });

    await prisma.payment.update({
        where: { id: payment.id },
        data: {
            status: TransactionStatus.PENDING,
            transactionRef: null,
            providerResponse: null,
            checkoutUrl: paymentSession.paymentUrl,
            checkoutUrlCreatedAt: paymentSession.createdAt,
            checkoutUrlExpiresAt: paymentSession.expiresAt,
        },
    });

    return {
        orderId: order.id,
        orderCode: order.orderCode,
        paymentUrl: paymentSession.paymentUrl,
        expiresAt: paymentSession.expiresAt,
    };
}

/**
 * Hủy đơn hàng và hoàn tồn kho
 */
export async function cancelOrder(customerId: bigint, orderCode: string) {
    const order = await prisma.order.findUnique({
        where: { orderCode, customerId },
        include: { items: true },
    });

    if (!order) {
        throw new HttpError(404, "Không tìm thấy đơn hàng", { code: "ORDER_NOT_FOUND" });
    }

    if (order.orderStatus === OrderStatus.CANCELLED) {
        return order;
    }

    // Chỉ cho phép hủy khi chưa giao hàng
    const cancellableStatuses: OrderStatus[] = [OrderStatus.PENDING, OrderStatus.AWAITING_PAYMENT, OrderStatus.CONFIRMED];
    if (!cancellableStatuses.includes(order.orderStatus)) {
        throw new HttpError(400, "Không thể hủy đơn hàng ở trạng thái này", { code: "CANCEL_NOT_ALLOWED" });
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
        const updated = await tx.order.update({
            where: { id: order.id },
            data: { orderStatus: OrderStatus.CANCELLED },
        });

        // Hoàn tồn kho
        await incrementProductsStock(
            order.items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
            })),
        );

        return updated;
    });

    return updatedOrder;
}
