import { NextFunction, Request, Response } from "express";
import { PaymentMethod } from "@prisma/client";
import {
    createOrder,
    refreshOrderPaymentUrlIfNeeded,
    cancelOrder,
} from "../services/orderService";
import { HttpError, sendSuccess } from "../utils/http";
import { parseRequiredBigInt, serializeBigInt } from "../utils/validation";

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
