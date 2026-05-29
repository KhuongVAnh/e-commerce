import { Request, Response } from "express";
import {
    processIpn,
    verifyIpnSignature,
    checkPaymentFromOrderCode,
    getPaymentByOrderForUser,
} from "../services/paymentService";
import { sendSuccess, sendError } from "../utils/http";
import { parseRequiredBigInt, serializeBigInt } from "../utils/validation";

// ─────────────────────────────────────────────────────────────
// Controllers cho VNPay Payment
// ─────────────────────────────────────────────────────────────

/**
 * Controller xử lý IPN từ VNPay.
 * Gọi ngầm từ VNPay Server sang Server của hệ thống.
 * Trả về đúng format quy định để VNPay xác nhận đã nhận IPN.
 */
export async function vnpayIpnController(req: Request, res: Response) {
    const vnpParams = Object.fromEntries(
        Object.entries(req.query).map(([key, value]) => [
            key,
            Array.isArray(value) ? String(value[0] ?? "") : String(value ?? ""),
        ])
    );
    try {
        const result = await processIpn(vnpParams);
        // Luôn phải trả về HTTP status 200 chp vnpay, nội dung là mã RspCode và Message
        // vpn dùng mã RspCode để xác định xem IPN đã được xử lý thành công hay chưa, nếu không phải "00" thì sẽ có cơ chế retry lại sau
        // Nếu có lỗi trong quá trình xử lý IPN, cũng phải trả về 200 với RspCode khác "00" để VNPay biết đã nhận được IPN nhưng có lỗi khi xử lý
        // code hiện tại chưa xử lý trường hợp RspCode khác 00
        return res.status(200).json({ RspCode: result.code, Message: result.message });
    } catch (error) {
        console.error("[commerce_service] VNPay IPN Error:", error);
        return res.status(200).json({ RspCode: "99", Message: "Unknown error" });
    }
}

/**
 * Endpoint khi FE nhận Return URL từ VNPay, forward query string lên backend để đổi lấy kết quả cuối.
 * Xác thực chữ ký để đảm bảo request hợp lệ.
 */
export async function checkResultVNPAYController(req: Request, res: Response) {
    const vnpParams = Object.fromEntries(
        Object.entries(req.query).map(([key, value]) => [
            key,
            Array.isArray(value) ? String(value[0] ?? "") : String(value ?? ""),
        ])
    );

    // 1. Xác thực chữ ký từ VNPay
    const isValid = verifyIpnSignature(vnpParams);
    if (!isValid) {
        return sendError(res, {
            requestId: res.locals.requestId,
            statusCode: 400,
            message: "Sai chữ ký bảo mật từ VNPay",
            error: {
                code: "INVALID_SIGNATURE",
            },
        });
    }

    const orderCode = vnpParams["vnp_TxnRef"]?.trim();

    // Return URL cũng là dữ liệu VNPay đã ký. Dùng nó làm fallback để cập nhật DB
    // trong trường hợp IPN URL chưa public hoặc VNPay gọi IPN chậm.
    await processIpn(vnpParams);

    const { order, payment, isPaid, isFailed, isPending } = await checkPaymentFromOrderCode(orderCode);

    return sendSuccess(res, {
        requestId: res.locals.requestId,
        message: isPaid
            ? "Thanh toán thành công"
            : isFailed
                ? "Thanh toán thất bại"
                : "Thanh toán đang được xử lý",

        data: serializeBigInt({
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
        }),
    });
}

export async function getPaymentByOrderController(req: Request, res: Response) {
    const orderId = parseRequiredBigInt(req.params.orderId, "orderId");
    const data = await getPaymentByOrderForUser(orderId, {
        userId: req.authUser!.userId,
        role: req.authUser!.role,
        shopId: req.authUser?.shopId,
    });

    return sendSuccess(res, {
        requestId: res.locals.requestId,
        message: "Lấy thông tin thanh toán thành công",
        data: serializeBigInt(data),
    });
}
