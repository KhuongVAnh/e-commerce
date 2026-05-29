import { randomBytes } from "crypto";
import { OrderStatus, PaymentMethod, PaymentStatus, TransactionStatus } from "@prisma/client";
import { prisma } from "../config/prisma";
import { HttpError } from "../utils/http";
import { buildCheckoutPreview } from "./checkoutPreview";
import { createVNPayCheckoutSession } from "./paymentService";
import { decrementProductsStock, getProductsByIds, getShopById, getShopIdBySellerId, incrementProductsStock, getSellerIdByShopId } from "./catalogClient";
import { publishEvent } from "../config/kafka";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type CreateOrderInput = {
    shopId: bigint;
    cartItemIds: bigint[];
    paymentMethod: PaymentMethod;
    idempotencyKey?: string;
    receiverName: string;
    receiverPhone: string;
    receiverAddress: string;
    note?: string;
    ipAddr?: string;
};

type CreateOrderResult = {
    orderId: bigint;
    orderCode: string;
    orderStatus: OrderStatus;
    paymentStatus: PaymentStatus;
    totalAmount: number;
    paymentUrl?: string;
    paymentUrlExpiresAt?: Date;
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

async function findExistingOrderByIdempotencyKey(
    customerId: bigint,
    idempotencyKey?: string,
): Promise<CreateOrderResult | null> {
    if (!idempotencyKey) {
        return null;
    }

    // Đây là fast path cho retry từ FE: nếu request trước đã tạo đơn thành công,
    // trả lại đúng đơn đó để người dùng không bị tạo nhiều order vì double-click hoặc network retry.
    const order = await prisma.order.findFirst({
        where: {
            customerId,
            idempotencyKey,
        },
        include: {
            payments: {
                orderBy: { createdAt: "desc" },
                take: 1,
            },
        },
    });

    if (!order) {
        return null;
    }

    const payment = order.payments[0];
    return {
        orderId: order.id,
        orderCode: order.orderCode,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        totalAmount: Number(order.totalAmount),
        paymentUrl: payment?.checkoutUrl ?? undefined,
        paymentUrlExpiresAt: payment?.checkoutUrlExpiresAt ?? undefined,
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
): Promise<CreateOrderResult> {
    const { shopId, cartItemIds, paymentMethod, idempotencyKey, receiverName, receiverPhone, receiverAddress, note, ipAddr } = input;

    // Kiểm tra idempotency trước mọi side effect, đặc biệt trước khi gọi Catalog trừ stock.
    // Nếu key đã được xử lý, response cũ là kết quả đúng nhất và không làm thay đổi tồn kho lần nữa.
    const existingOrder = await findExistingOrderByIdempotencyKey(customerId, idempotencyKey);
    if (existingOrder) {
        return existingOrder;
    }

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

    // Bước 3: Trừ tồn kho bên Catalog Service (giữ chỗ).
    // Đây là side effect ngoài DB của Commerce, nên nếu transaction tạo order bên dưới lỗi thì phải gọi bù lại stock.
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
                    idempotencyKey,
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
        // Vì stock đã được giữ chỗ ở Catalog trước khi order được ghi vào Commerce,
        // mọi lỗi sau điểm đó phải hoàn stock để tránh mất hàng ảo.
        try {
            await incrementProductsStock(stockItems);
        } catch (rollbackError) {
            console.error("[commerce_service] Failed to rollback stock after order creation error:", rollbackError);
        }

        // Hai request cùng idempotencyKey có thể cùng qua fast path khi chưa có order.
        // Unique constraint trong DB sẽ cho một request thắng; request thua trả lại order của request thắng.
        const existingOrder = await findExistingOrderByIdempotencyKey(customerId, idempotencyKey);
        if (existingOrder && typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
            return existingOrder;
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

    // Hủy đơn cũng phải là conditional update. Nếu hai request cancel chạy song song,
    // chỉ request đổi trạng thái từ cancellable -> CANCELLED mới được hoàn kho.
    const updatedCount = await prisma.order.updateMany({
        where: {
            id: order.id,
            customerId,
            orderStatus: { in: cancellableStatuses },
        },
        data: { orderStatus: OrderStatus.CANCELLED },
    });

    if (updatedCount.count === 0) {
        // Trường hợp request khác đã hủy trước đó: trả về trạng thái mới nhất và không hoàn kho thêm lần nữa.
        const latestOrder = await prisma.order.findUnique({
            where: { id: order.id },
            include: { items: true },
        });

        if (latestOrder?.orderStatus === OrderStatus.CANCELLED) {
            return latestOrder;
        }

        throw new HttpError(400, "Không thể hủy đơn hàng ở trạng thái này", { code: "CANCEL_NOT_ALLOWED" });
    }

    const updatedOrder = await prisma.order.findUniqueOrThrow({
        where: { id: order.id },
        include: { items: true },
    });

    try {
        // Catalog là service ngoài transaction DB của Commerce; gọi hoàn kho sau khi đã claim quyền hủy.
        // Nếu hoàn kho lỗi, rollback orderStatus để hệ thống không ghi nhận đã hủy khi stock chưa được trả.
        await incrementProductsStock(
            updatedOrder.items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
            })),
        );
    } catch (error) {
        await prisma.order.update({
            where: { id: order.id },
            data: { orderStatus: order.orderStatus },
        }).catch((rollbackError) => {
            console.error("[commerce_service] Failed to rollback order status after stock restore error:", rollbackError);
        });

        throw error;
    }

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
                items: {
                    orderBy: { id: "asc" },
                    select: {
                        id: true,
                        productId: true,
                        productNameSnapshot: true,
                        quantity: true,
                    },
                },
            },
        }),
    ]);

    const productIds = Array.from(
        new Set(orders.flatMap((order) => order.items.map((item) => item.productId.toString()))),
    ).map((id) => BigInt(id));

    const products = await getProductsByIds(productIds).catch((error) => {
        console.error("[commerce_service] Failed to enrich customer orders with products:", error);
        return [];
    });

    const productById = new Map(products.map((product) => [product.id.toString(), product]));
    const uniqueShopIds = Array.from(new Set(orders.map((order) => order.shopId.toString()))).map((id) => BigInt(id));
    const shops = await Promise.all(uniqueShopIds.map((shopId) => getShopById(shopId)));
    const shopById = new Map<string, NonNullable<(typeof shops)[number]>>();
    for (const shop of shops) {
        if (shop?.id) {
            shopById.set(shop.id.toString(), shop);
        }
    }

    return {
        total,
        orders: orders.map((order) => {
            const items = order.items.map((item) => {
                const product = productById.get(item.productId.toString());
                return {
                    id: item.id,
                    productId: item.productId,
                    productNameSnapshot: item.productNameSnapshot,
                    quantity: item.quantity,
                    thumbnailUrl: product?.thumbnailUrl ?? null,
                };
            });
            const firstThumbnail = items.find((item) => item.thumbnailUrl)?.thumbnailUrl ?? null;
            const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
            const shop = shopById.get(order.shopId.toString());

            return {
                ...order,
                items,
                itemCount: items.length,
                totalItems,
                thumbnailUrl: firstThumbnail,
                shopName: shop?.name ?? null,
                shopLogoUrl: shop?.logoUrl ?? null,
            };
        }),
    };
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

    const products = await getProductsByIds(order.items.map((item) => item.productId)).catch((error) => {
        console.error("[commerce_service] Failed to enrich customer order detail with products:", error);
        return [];
    });
    const productById = new Map(products.map((product) => [product.id.toString(), product]));

    return {
        ...order,
        items: order.items.map((item) => ({
            ...item,
            thumbnailUrl: productById.get(item.productId.toString())?.thumbnailUrl ?? null,
        })),
    };
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

    const products = await getProductsByIds(order.items.map((item) => item.productId)).catch((error) => {
        console.error("[commerce_service] Failed to enrich seller order detail with products:", error);
        return [];
    });
    const productById = new Map(products.map((product) => [product.id.toString(), product]));

    return {
        ...order,
        items: order.items.map((item) => ({
            ...item,
            thumbnailUrl: productById.get(item.productId.toString())?.thumbnailUrl ?? null,
        })),
    };
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
