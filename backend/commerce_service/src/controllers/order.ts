import { NextFunction, Request, Response } from "express";
import { OrderStatus, PaymentMethod } from "@prisma/client";
import {
    createOrder,
    refreshOrderPaymentUrlIfNeeded,
    cancelOrder,
    getCustomerOrderDetail,
    getSellerOrderDetail,
    listCustomerOrders,
    listSellerOrders,
    resolveShopIdForSeller,
    sellerUpdateOrderStatus,
} from "../services/orderService";
import { HttpError, sendSuccess } from "../utils/http";
import { parseRequiredBigInt, serializeBigInt } from "../utils/validation";
import { checkPaymentFromOrderCode } from "../services/paymentService";
import { buildPaginationMeta, parsePaginationQuery } from "../utils/pagination";

// ─────────────────────────────────────────────────────────────
// Helpers validation
// ─────────────────────────────────────────────────────────────

/**
 * Parse và validate paymentMethod từ request body.
 * Chỉ chấp nhận giá trị thuộc enum PaymentMethod của Prisma.
 */
function parsePaymentMethod(value: unknown): PaymentMethod {
    if (value !== PaymentMethod.COD && value !== PaymentMethod.VNPAY) {
        throw new HttpError(400, "paymentMethod không hợp lệ", {
            code: "VALIDATION_ERROR",
            fieldErrors: [
                {
                    field: "paymentMethod",
                    message: `paymentMethod phải là một trong: ${Object.values(PaymentMethod).join(", ")}`,
                },
            ],
        });
    }
    return value;
}

function parseOrderStatus(value: unknown, field: string): OrderStatus {
    if (typeof value !== "string" || value.trim() === "") {
        throw new HttpError(400, `${field} không hợp lệ`, {
            code: "VALIDATION_ERROR",
            fieldErrors: [{ field, message: `${field} không hợp lệ` }],
        });
    }

    const normalized = value.trim() as OrderStatus;
    const values = Object.values(OrderStatus);
    if (!values.includes(normalized)) {
        throw new HttpError(400, `${field} không hợp lệ`, {
            code: "VALIDATION_ERROR",
            fieldErrors: [
                {
                    field,
                    message: `${field} phải là một trong: ${values.join(", ")}`,
                },
            ],
        });
    }

    return normalized;
}

function parseOptionalOrderStatus(value: unknown): OrderStatus | undefined {
    if (value === undefined || value === null || value === "") {
        return undefined;
    }
    return parseOrderStatus(value, "status");
}

// ─────────────────────────────────────────────────────────────
// Customer controllers
// ─────────────────────────────────────────────────────────────

/**
 * Controller tạo đơn hàng từ giỏ hàng theo 1 shop.
 *
 * Body: {
 *   shopId: string,
 *   cartItemIds: string[],
 *   paymentMethod: "COD" | "VNPAY",
 *   receiverName: string,
 *   receiverPhone: string,
 *   receiverAddress: string,
 *   note?: string
 * }
 */
export async function createOrderController(
    req: Request,
    res: Response,
    _next: NextFunction,
) {
    const customerId = parseRequiredBigInt(req.authUser!.userId, "userId");
    let ipAddr = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1";
    if (Array.isArray(ipAddr)) {
        ipAddr = ipAddr[0];
    }

    const shopId = parseRequiredBigInt(req.body.shopId, "shopId");

    // Parse danh sách cartItemIds từ array string -> array bigint
    const cartItemIds: bigint[] = Array.isArray(req.body.cartItemIds)
        ? req.body.cartItemIds.map((id: unknown) => parseRequiredBigInt(id, "cartItemIds[n]"))
        : [];

    if (cartItemIds.length === 0) {
        throw new HttpError(400, "cartItemIds không được để trống", {
            code: "VALIDATION_ERROR",
            fieldErrors: [{ field: "cartItemIds", message: "Phải có ít nhất 1 item để tạo đơn" }],
        });
    }

    const paymentMethod = parsePaymentMethod(req.body.paymentMethod);

    // Validate các trường thông tin người nhận bắt buộc
    const requiredFields = ["receiverName", "receiverPhone", "receiverAddress"] as const;
    for (const field of requiredFields) {
        if (!req.body[field] || typeof req.body[field] !== "string" || req.body[field].trim() === "") {
            throw new HttpError(400, `${field} là bắt buộc`, {
                code: "VALIDATION_ERROR",
                fieldErrors: [{ field, message: `${field} không được để trống` }],
            });
        }
    }

    // tạo đơn hàng và trả về thông tin đơn hàng mới tạo (bao gồm link thanh toán nếu có)
    const result = await createOrder(customerId, {
        shopId,
        cartItemIds,
        paymentMethod,
        receiverName: req.body.receiverName.trim(),
        receiverPhone: req.body.receiverPhone.trim(),
        receiverAddress: req.body.receiverAddress.trim(),
        note: req.body.note?.trim(),
        ipAddr: ipAddr as string,
    });

    const warnings =
        paymentMethod === PaymentMethod.VNPAY
            ? ["Vui lòng truy cập paymentUrl để hoàn tất thanh toán VNPay"]
            : [];

    return sendSuccess(res, {
        requestId: res.locals.requestId,
        statusCode: 201,
        message: "Đặt hàng thành công",
        data: {
            ...serializeBigInt(result),
        },
        warnings,
    });
}

export async function getOrderPaymentUrlController(
    req: Request,
    res: Response,
    _next: NextFunction,
) {
    const customerId = parseRequiredBigInt(req.authUser!.userId, "userId");
    const orderCode = String(req.params.orderCode || "").trim();

    if (!orderCode) {
        throw new HttpError(400, "orderCode không được để trống", {
            code: "VALIDATION_ERROR",
            fieldErrors: [{ field: "orderCode", message: "orderCode không được để trống" }],
        });
    }

    let ipAddr = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1";
    if (Array.isArray(ipAddr)) {
        ipAddr = ipAddr[0];
    }

    // lấy link cũ còn hiệu lực hoặc tạo link mới nếu link cũ đã hết hạn hoặc bị lỗi
    const result = await refreshOrderPaymentUrlIfNeeded(customerId, orderCode, ipAddr as string);

    return sendSuccess(res, {
        requestId: res.locals.requestId,
        message: "Lấy link thanh toán thành công",
        data: serializeBigInt(result),
    });
}

export async function cancelOrderController(
    req: Request,
    res: Response,
    _next: NextFunction,
) {
    const customerId = parseRequiredBigInt(req.authUser!.userId, "userId");
    const orderCode = String(req.params.orderCode || "").trim();

    if (!orderCode) {
        throw new HttpError(400, "orderCode không được để trống", { code: "VALIDATION_ERROR" });
    }

    const result = await cancelOrder(customerId, orderCode);

    return sendSuccess(res, {
        requestId: res.locals.requestId,
        message: "Hủy đơn hàng thành công",
        data: serializeBigInt(result),
    });
}

/**
 * Endpoint FE gọi để lấy kết quả thanh toán VNPay theo mã đơn hàng.
 * - DB là source of truth
 */
export async function checkResultPaymentController(req: Request, res: Response) {
    const orderCode = String(req.params.orderCode ?? "").trim();

    const { order, payment, isPaid, isFailed, isPending } = await checkPaymentFromOrderCode(orderCode);

    return sendSuccess(res, {
        requestId: res.locals.requestId,
        message: isPaid
            ? "Thanh toán thành công"
            : isFailed
                ? "Thanh toán thất bại"
                : "Thanh toán đang được xử lý",

        data: {
            order: {
                id: order.id,
                orderCode: order.orderCode,
                orderStatus: order.orderStatus,
                paymentStatus: order.paymentStatus,
            },

            payment: payment
                ? {
                    id: payment.id,
                    amount: payment.amount,
                    status: payment.status,
                    transactionRef: payment.transactionRef,
                    paidAt: payment.updatedAt,
                }
                : null,

            result: {
                isPaid,
                isFailed,
                isPending,
            },
        },
    });
}

// ─────────────────────────────────────────────────────────────
// Customer: history / detail
// ─────────────────────────────────────────────────────────────

/**
 * GET /orders/my – Lịch sử đơn hàng của customer
 * Query: page?, limit?, status?
 */
export async function getMyOrdersController(req: Request, res: Response) {
    const customerId = parseRequiredBigInt(req.authUser!.userId, "userId");
    const { page, limit } = parsePaginationQuery({
        page: req.query.page,
        limit: req.query.limit,
    });

    const status = parseOptionalOrderStatus(req.query.status);

    const result = await listCustomerOrders(customerId, { page, limit, status });
    const pagination = buildPaginationMeta({ page, limit, total: result.total });

    return sendSuccess(res, {
        requestId: res.locals.requestId,
        message: "Lấy lịch sử đơn hàng thành công",
        data: {
            orders: serializeBigInt(result.orders),
        },
        pagination,
    });
}

/**
 * GET /orders/:id – Chi tiết đơn hàng của customer
 */
export async function getMyOrderDetailController(req: Request, res: Response) {
    const customerId = parseRequiredBigInt(req.authUser!.userId, "userId");
    const orderId = parseRequiredBigInt(req.params.id, "id");

    const order = await getCustomerOrderDetail(customerId, orderId);

    return sendSuccess(res, {
        requestId: res.locals.requestId,
        message: "Lấy chi tiết đơn hàng thành công",
        data: {
            order: serializeBigInt(order),
        },
    });
}

// ─────────────────────────────────────────────────────────────
// Seller: list / update status
// ─────────────────────────────────────────────────────────────

/**
 * GET /seller/orders – Seller xem đơn hàng của shop mình
 * Query: page?, limit?, status?
 */
export async function sellerGetOrdersController(req: Request, res: Response) {
    const { page, limit } = parsePaginationQuery({
        page: req.query.page,
        limit: req.query.limit,
    });
    const status = parseOptionalOrderStatus(req.query.status);

    const shopId = await resolveShopIdForSeller({
        userId: req.authUser!.userId,
        shopId: req.authUser?.shopId,
    });

    const result = await listSellerOrders(shopId, { page, limit, status });
    const pagination = buildPaginationMeta({ page, limit, total: result.total });

    return sendSuccess(res, {
        requestId: res.locals.requestId,
        message: "Lấy danh sách đơn hàng của shop thành công",
        data: {
            orders: serializeBigInt(result.orders),
        },
        pagination,
    });
}

/**
 * GET /seller/orders/:id – Seller xem chi tiết đơn hàng của shop mình
 */
export async function sellerGetOrderDetailController(req: Request, res: Response) {
    const orderId = parseRequiredBigInt(req.params.id, "id");

    const shopId = await resolveShopIdForSeller({
        userId: req.authUser!.userId,
        shopId: req.authUser?.shopId,
    });

    const order = await getSellerOrderDetail(shopId, orderId);

    return sendSuccess(res, {
        requestId: res.locals.requestId,
        message: "Lấy chi tiết đơn hàng của shop thành công",
        data: {
            order: serializeBigInt(order),
        },
    });
}

/**
 * PATCH /seller/orders/:id/status – Cập nhật trạng thái đơn hàng
 * Body: { status: OrderStatus }
 */
export async function sellerUpdateOrderStatusController(req: Request, res: Response) {
    const orderId = parseRequiredBigInt(req.params.id, "id");
    const nextStatus = parseOrderStatus(req.body.status, "status");

    const shopId = await resolveShopIdForSeller({
        userId: req.authUser!.userId,
        shopId: req.authUser?.shopId,
    });

    const updated = await sellerUpdateOrderStatus(shopId, orderId, nextStatus);

    return sendSuccess(res, {
        requestId: res.locals.requestId,
        message: "Cập nhật trạng thái đơn hàng thành công",
        data: {
            order: serializeBigInt(updated),
        },
    });
}
