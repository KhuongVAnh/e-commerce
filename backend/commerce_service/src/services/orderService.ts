import { randomBytes } from "crypto";
import { OrderStatus, PaymentMethod, PaymentStatus, TransactionStatus } from "@prisma/client";
import { prisma } from "../config/prisma";
import { HttpError } from "../utils/http";
import { buildCheckoutPreview } from "./checkoutPreview";
import { createVNPayCheckoutSession } from "./paymentService";
import { decrementProductsStock, getShopIdBySellerId, incrementProductsStock, getSellerIdByShopId } from "./catalogClient";
import { publishEvent } from "../config/kafka";

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

export type ListOrdersInput = {
    status?: OrderStatus;
    page: number;
    limit: number;
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
    const stockItems = preview.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
    }));

    await decrementProductsStock(stockItems);

    let result: { order: { id: bigint; orderCode: string; orderStatus: OrderStatus; paymentStatus: PaymentStatus; totalAmount: unknown } };
    try {
        result = await prisma.$transaction(async (tx) => {
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
    } catch (error) {
        try {
            await incrementProductsStock(stockItems);
        } catch (rollbackError) {
            console.error("[commerce_service] Failed to rollback stock after order creation error:", rollbackError);
        }

        throw error;
    }

    // Publish order.created event to Kafka (async)
    getSellerIdByShopId(shopId)
        .then((sellerId) => {
            publishEvent("order.created", {
                orderId: result.order.id.toString(),
                orderCode: result.order.orderCode,
                customerId: customerId.toString(),
                shopId: shopId.toString(),
                totalAmount: Number(result.order.totalAmount),
                receiverName,
                sellerId: sellerId ?? undefined,
            });
        })
        .catch((err) => {
            console.error("[commerce_service] Failed to publish order.created event:", err);
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

    // Publish order.status.updated event to Kafka (async)
    getSellerIdByShopId(updatedOrder.shopId)
        .then((sellerId) => {
            publishEvent("order.status.updated", {
                orderId: updatedOrder.id.toString(),
                orderCode: updatedOrder.orderCode,
                customerId: updatedOrder.customerId.toString(),
                shopId: updatedOrder.shopId.toString(),
                status: updatedOrder.orderStatus,
                sellerId: sellerId ?? undefined,
            });
        })
        .catch((err) => {
            console.error("[commerce_service] Failed to publish order.status.updated event for cancelOrder:", err);
        });

    return updatedOrder;
}

// ─────────────────────────────────────────────────────────────
// New APIs: customer history/detail + seller view/update
// (Bổ sung để phục vụ các endpoint mới, không thay đổi logic gốc)
// ─────────────────────────────────────────────────────────────

export async function listCustomerOrders(customerId: bigint, input: ListOrdersInput) {
    const { status, page, limit } = input;

    const where = {
        customerId,
        ...(status ? { orderStatus: status } : {}),
    };

    const [total, orders] = await Promise.all([
        prisma.order.count({ where }),
        prisma.order.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * limit,
            take: limit,
            select: {
                id: true,
                orderCode: true,
                shopId: true,
                totalAmount: true,
                shippingFee: true,
                paymentMethod: true,
                paymentStatus: true,
                orderStatus: true,
                createdAt: true,
                updatedAt: true,
            },
        }),
    ]);

    return { total, orders };
}

export async function getCustomerOrderDetail(customerId: bigint, orderId: bigint) {
    const order = await prisma.order.findFirst({
        where: {
            id: orderId,
            customerId,
        },
        include: {
            items: {
                orderBy: { id: "asc" },
            },
        },
    });

    if (!order) {
        throw new HttpError(404, "Không tìm thấy đơn hàng", {
            code: "ORDER_NOT_FOUND",
        });
    }

    return order;
}

export async function resolveShopIdForSeller(input: { shopId?: string; userId: string }): Promise<bigint> {
    if (input.shopId && input.shopId.trim()) {
        try {
            return BigInt(input.shopId);
        } catch {
            // fallthrough
        }
    }

    const shopId = await getShopIdBySellerId(input.userId);
    if (!shopId) {
        throw new HttpError(404, "Không tìm thấy shop của seller", {
            code: "SHOP_NOT_FOUND",
            hint: "Seller cần tạo shop trước khi thao tác đơn hàng",
        });
    }

    return BigInt(shopId);
}

export async function listSellerOrders(shopId: bigint, input: ListOrdersInput) {
    const { status, page, limit } = input;

    const where = {
        shopId,
        ...(status ? { orderStatus: status } : {}),
    };

    const [total, orders] = await Promise.all([
        prisma.order.count({ where }),
        prisma.order.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * limit,
            take: limit,
            select: {
                id: true,
                orderCode: true,
                customerId: true,
                totalAmount: true,
                shippingFee: true,
                paymentMethod: true,
                paymentStatus: true,
                orderStatus: true,
                receiverName: true,
                receiverPhone: true,
                receiverAddress: true,
                note: true,
                createdAt: true,
                updatedAt: true,
            },
        }),
    ]);

    return { total, orders };
}

export async function getSellerOrderDetail(shopId: bigint, orderId: bigint) {
    const order = await prisma.order.findFirst({
        where: {
            id: orderId,
            shopId,
        },
        include: {
            items: {
                orderBy: { id: "asc" },
            },
            payments: {
                orderBy: { createdAt: "desc" },
            },
        },
    });

    if (!order) {
        throw new HttpError(404, "Không tìm thấy đơn hàng", {
            code: "ORDER_NOT_FOUND",
        });
    }

    return order;
}

const SELLER_ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
    [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
    [OrderStatus.AWAITING_PAYMENT]: [OrderStatus.CANCELLED],
    [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
    [OrderStatus.PROCESSING]: [OrderStatus.SHIPPING, OrderStatus.CANCELLED],
    [OrderStatus.SHIPPING]: [OrderStatus.DELIVERED],
    [OrderStatus.DELIVERED]: [],
    [OrderStatus.CANCELLED]: [],
};

function assertValidSellerStatusTransition(current: OrderStatus, next: OrderStatus): void {
    if (current === next) {
        return;
    }

    const allowed = SELLER_ALLOWED_TRANSITIONS[current] ?? [];
    if (!allowed.includes(next)) {
        throw new HttpError(400, "Chuyển trạng thái đơn hàng không hợp lệ", {
            code: "INVALID_STATUS_TRANSITION",
            details: [`from=${current}`, `to=${next}`],
        });
    }
}

export async function sellerUpdateOrderStatus(shopId: bigint, orderId: bigint, nextStatus: OrderStatus) {
    const order = await prisma.order.findFirst({
        where: {
            id: orderId,
            shopId,
        },
        select: {
            id: true,
            orderCode: true,
            orderStatus: true,
            customerId: true,
            shopId: true,
        },
    });

    if (!order) {
        throw new HttpError(404, "Không tìm thấy đơn hàng", {
            code: "ORDER_NOT_FOUND",
        });
    }

    assertValidSellerStatusTransition(order.orderStatus, nextStatus);

    const updated = await prisma.order.update({
        where: { id: order.id },
        data: { orderStatus: nextStatus },
        select: {
            id: true,
            orderCode: true,
            orderStatus: true,
            updatedAt: true,
        },
    });

    // Publish order.status.updated event to Kafka (async)
    publishEvent("order.status.updated", {
        orderId: updated.id.toString(),
        orderCode: updated.orderCode,
        customerId: order.customerId.toString(),
        shopId: order.shopId.toString(),
        status: updated.orderStatus,
        sellerId: shopId.toString(),
    }).catch((err) => {
        console.error("[commerce_service] Failed to publish order.status.updated event for sellerUpdateOrderStatus:", err);
    });

    return updated;
}
