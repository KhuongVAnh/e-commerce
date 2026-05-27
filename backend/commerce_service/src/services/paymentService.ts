import crypto from "crypto";
import { OrderStatus, PaymentStatus, TransactionStatus } from "@prisma/client";
import { prisma } from "../config/prisma";
import { HttpError } from "../utils/http";
import { getShopIdBySellerId } from "./catalogClient";
import "../config/env"; // Đảm bảo đã load env
import { publishEvent } from "../config/kafka";

// Lấy config từ env
const tmnCode = process.env.VNP_TMN_CODE || ""; // vnpay cung cấp
const hashSecret = process.env.VNP_HASH_SECRET || ""; // vnpay cung cấp
const vnpUrl = process.env.VNP_URL || ""; // vnpay cung cấp
const corsAllowedOrigins = process.env.CORS_ALLOWED_ORIGINS || "";
const routeCheckout = process.env.ROUTE_CHECKOUT || "";
const returnUrl = (() => {
    if (process.env.VNP_RETURN_URL) {
        return process.env.VNP_RETURN_URL;
    }

    const frontendOrigins = corsAllowedOrigins
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
    const frontendOrigin = frontendOrigins[0] || "";

    if (!frontendOrigin || !routeCheckout) {
        return "";
    }

    return new URL(routeCheckout, frontendOrigin).toString();
})();

const VN_PAY_URL_TTL_MINUTES = process.env.VN_PAY_URL_TTL_MINUTES ? Number(process.env.VN_PAY_URL_TTL_MINUTES) : 15; // Thời gian hiệu lực của URL VNPay
const REQUIRED_VNPAY_ENV_KEYS = ["VNP_TMN_CODE", "VNP_HASH_SECRET", "VNP_URL", "CORS_ALLOWED_ORIGINS", "ROUTE_CHECKOUT"] as const;

function assertVNPayConfig() {
    const missing = REQUIRED_VNPAY_ENV_KEYS.filter((key) => !process.env[key]);
    if (missing.length > 0) {
        throw new Error(`[VNPay] Missing required env: ${missing.join(", ")}`);
    }
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

/**
 * Định dạng ngày giờ theo format yyyyMMddHHmmss chuẩn của VNPay
 * và ép theo múi giờ GMT+7 theo tài liệu VNPay.
 */
function formatVNPayDate(date: Date): string {
    // Chuyển timestamp sang mốc GMT+7 rồi đọc theo UTC để lấy đúng thành phần ngày giờ GMT+7.
    const gmt7Time = new Date(date.getTime() + 7 * 60 * 60 * 1000);
    const yyyy = gmt7Time.getUTCFullYear().toString();
    const MM = (gmt7Time.getUTCMonth() + 1).toString().padStart(2, "0");
    const dd = gmt7Time.getUTCDate().toString().padStart(2, "0");
    const HH = gmt7Time.getUTCHours().toString().padStart(2, "0");
    const mm = gmt7Time.getUTCMinutes().toString().padStart(2, "0");
    const ss = gmt7Time.getUTCSeconds().toString().padStart(2, "0");
    return `${yyyy}${MM}${dd}${HH}${mm}${ss}`;
}

function normalizeOrderInfo(orderCode: string): string {
    return `Thanh toan don hang ${orderCode}`
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9\s]/g, "")
        .trim();
}

/**
 * Sắp xếp các tham số theo thứ tự alphabet của key (chuẩn VNPay)
 */
function sortObject(obj: Record<string, any>): Record<string, string> {
    const sorted: Record<string, string> = {};
    const keys = Object.keys(obj).sort();

    for (const key of keys) {
        if (obj[key] !== undefined && obj[key] !== null && obj[key] !== "") {
            // EncodeURIComponent và thay thế khoảng trắng (nếu có)
            sorted[key] = encodeURIComponent(String(obj[key])).replace(/%20/g, "+");
        }
    }
    return sorted;
}

function normalizeVnpParams(vnpParams: Record<string, any>): Record<string, string> {
    return Object.fromEntries(Object.entries(vnpParams).map(([key, value]) => {
        if (Array.isArray(value)) {
            return [key, String(value[0] ?? "")];
        }
        return [key, String(value ?? "")];
    }));
}

// ─────────────────────────────────────────────────────────────
// Core VNPay functions
// ─────────────────────────────────────────────────────────────

export type CreateVNPayUrlInput = {
    orderCode: string;
    amount: number;
    ipAddr: string;
};

export type VNPayCheckoutSession = {
    paymentUrl: string;
    createdAt: Date;
    expiresAt: Date;
};

export type PaymentLookupAuthUser = {
    userId: string;
    role: string;
    shopId?: string;
};

export function buildVNPayCheckoutUrl(input: CreateVNPayUrlInput, createdAt: Date, expiresAt: Date): string {
    assertVNPayConfig();
    const { orderCode, amount, ipAddr } = input;
    const createDate = formatVNPayDate(createdAt);
    const expireDate = formatVNPayDate(expiresAt);

    // Khởi tạo các tham số cơ bản theo tài liệu VNPay
    const vnpParams: Record<string, any> = {
        vnp_Version: "2.1.0", // version của vnpay api
        vnp_Command: "pay",
        vnp_TmnCode: tmnCode, // merchant id
        vnp_Locale: "vn", // ngôn ngữ
        vnp_CurrCode: "VND", // tiền tệ
        vnp_TxnRef: orderCode, // mã đơn hàng
        vnp_OrderInfo: normalizeOrderInfo(orderCode),
        vnp_OrderType: "online_shopping", // 1 trong 4 loại online_shopping,billpayment,fee_payment,other, phục vụ mục đích thống kê
        vnp_Amount: amount * 100, // VNPay yêu cầu nhân 100
        vnp_ReturnUrl: returnUrl, // url vnpay redirect về sau khi thanh toán xong
        vnp_IpAddr: ipAddr, // truyền ipAddr để xác định người dùng ở khu vực nào, và để chống gian lận
        vnp_CreateDate: createDate, // thời gian tạo đơn hàng
        vnp_ExpireDate: expireDate, // thời gian hết hạn đơn hàng
    };

    // Sắp xếp các tham số
    const sortedParams = sortObject(vnpParams);

    // Tạo chuỗi sign data, biến object json thành chuỗi string, các key trong chuỗi string phải được sắp xếp theo thứ tự alphabet
    const signData = Object.entries(sortedParams)
        .map(([key, value]) => `${key}=${value}`)
        .join("&");

    // Tạo mã băm dùng để xác thực thông điệp (chương 3 attt)
    const hmac = crypto.createHmac("sha512", hashSecret); // vnpay cũng giữ secret key giống như trên
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex"); // tạo chữ ký số dùng thuật toán sha512, thuật toán băm được vnpay yêu cầu

    // Gắn thêm chữ ký vào params
    sortedParams["vnp_SecureHash"] = signed;

    // Lắp ghép thành URL cuối cùng
    const finalUrl = new URL(vnpUrl);
    for (const [key, value] of Object.entries(sortedParams)) {
        finalUrl.searchParams.append(key, value);
    }

    // Node URLSearchParams encode lại các ký tự, đôi khi VNPay không nhận diện chuẩn nếu đã encodeURIComponent trước đó,
    // Nên có thể dùng mảng nối string như signData để nối trực tiếp.
    const queryStr = Object.entries(sortedParams)
        .map(([key, value]) => `${key}=${value}`) // Value đã được encode trong sortObject
        .join("&");

    return `${vnpUrl}?${queryStr}`;
}

/**
 * Tạo URL và metadata để có thể lưu/refresh sau này.
*/
export function createVNPayCheckoutSession(input: CreateVNPayUrlInput): VNPayCheckoutSession {
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + VN_PAY_URL_TTL_MINUTES * 60 * 1000);

    return {
        paymentUrl: buildVNPayCheckoutUrl(input, createdAt, expiresAt),
        createdAt,
        expiresAt,
    };
}

/**
 * Tạo URL chuyển hướng sang VNPay để thanh toán.
 */
export function createVNPayUrl(input: CreateVNPayUrlInput): string {
    return createVNPayCheckoutSession(input).paymentUrl;
}

/**
 * Kiểm tra tính hợp lệ của dữ liệu do VNPay gửi về (Return hoặc IPN)
 */
export function verifyIpnSignature(vnpParams: Record<string, any>): boolean {
    assertVNPayConfig();
    const normalizedParams = normalizeVnpParams(vnpParams);

    // lấy chữ ký từ params gửi về
    const secureHash = normalizedParams["vnp_SecureHash"]?.trim().toLowerCase();
    if (!secureHash) {
        return false;
    }

    // Copy và loại bỏ các trường không cần thiết cho việc tạo signature
    const paramsToSign = { ...normalizedParams };
    delete paramsToSign["vnp_SecureHash"];
    delete paramsToSign["vnp_SecureHashType"];

    const sortedParams = sortObject(paramsToSign);

    const signData = Object.entries(sortedParams)
        .map(([key, value]) => `${key}=${value}`)
        .join("&");

    // mã hóa lại chuỗi dữ liệu để so sánh với chữ ký gửi về
    const hmac = crypto.createHmac("sha512", hashSecret);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex").toLowerCase();

    const secureHashBuffer = Buffer.from(secureHash, "utf-8");
    const signedBuffer = Buffer.from(signed, "utf-8");
    if (secureHashBuffer.length !== signedBuffer.length) {
        return false;
    }

    return crypto.timingSafeEqual(secureHashBuffer, signedBuffer);
}

/**
 * Xử lý phản hồi từ VNPay, cập nhật trạng thái đơn hàng và giao dịch
 */
export async function processIpn(vnpParams: Record<string, any>): Promise<{ code: string; message: string }> {
    assertVNPayConfig();
    const normalizedParams = normalizeVnpParams(vnpParams);

    // 1. Kiểm tra chữ ký
    const isValid = verifyIpnSignature(normalizedParams);
    if (!isValid) {
        return { code: "97", message: "Checksum failed" };
    }

    const orderCode = normalizedParams["vnp_TxnRef"]?.trim();
    const rspCode = normalizedParams["vnp_ResponseCode"];
    const amountRaw = Number(normalizedParams["vnp_Amount"]);

    if (!orderCode) {
        return { code: "01", message: "Order not found" };
    }
    if (!Number.isFinite(amountRaw) || amountRaw <= 0) {
        return { code: "04", message: "Invalid amount" };
    }

    // 2. Kiểm tra đơn hàng có tồn tại
    const order = await prisma.order.findUnique({
        where: { orderCode },
        include: { payments: true },
    });

    if (!order) {
        return { code: "01", message: "Order not found" };
    }

    // 3. Kiểm tra số tiền
    // VNPay gửi về là số tiền * 100
    const expectedAmount = Math.round(Number(order.totalAmount) * 100);
    if (expectedAmount !== amountRaw) {
        return { code: "04", message: "Invalid amount" };
    }

    // Lấy payment đang pending (chúng ta tạo 1 payment record lúc tạo đơn hàng)
    const payment = order.payments.find((p) => p.status === TransactionStatus.PENDING);

    // 4. Kiểm tra trạng thái đơn hàng: Đã được thanh toán / xử lý rồi hay chưa
    // Nếu payment đã xử lý rồi thì return 02, cần xử lý hoàn tiền hoặc liên hệ support
    if (!payment || payment.status !== TransactionStatus.PENDING) {
        return { code: "02", message: "Order already confirmed" };
    }

    // 5. Cập nhật DB dựa trên kết quả
    const isSuccess = rspCode === "00"; // "00" là thành công
    const newTransactionStatus = isSuccess ? TransactionStatus.SUCCESS : TransactionStatus.FAILED;

    // Nếu thành công, chuyển đơn sang PROCESSING. Nếu lỗi, có thể giữ nguyên PENDING hoặc chuyển sang CANCELLED/AWAITING_PAYMENT
    const newOrderStatus = isSuccess ? OrderStatus.PROCESSING : order.orderStatus;
    const newPaymentStatus = isSuccess ? PaymentStatus.PAID : PaymentStatus.FAILED;

    // cập nhật payment record với transactionRef và providerResponse để lưu lại thông tin giao dịch từ VNPay, phục vụ việc tra cứu, xử lý sau này
    // sử dụng transaction để đảm bảo tính nhất quán giữa payment và order
    await prisma.$transaction(async (tx) => {
        // Cập nhật Payment record
        await tx.payment.update({
            where: { id: payment.id },
            data: {
                status: newTransactionStatus,
                transactionRef: normalizedParams["vnp_TransactionNo"],
                providerResponse: JSON.stringify(normalizedParams), // Lưu lại toàn bộ response để debug
            },
        });

        // Cập nhật Order record
        await tx.order.update({
            where: { id: order.id },
            data: {
                orderStatus: newOrderStatus,
                paymentStatus: newPaymentStatus as any, // "PAID" / "FAILED"
            },
        });
    });

    // Publish payment event to Kafka (async)
    if (isSuccess) {
        publishEvent("payment.succeeded", {
            orderId: order.id.toString(),
            orderCode: order.orderCode,
            customerId: order.customerId.toString(),
            amount: Number(order.totalAmount),
            transactionRef: normalizedParams["vnp_TransactionNo"],
        }).catch((err) => {
            console.error("[commerce_service] Failed to publish payment.succeeded event:", err);
        });
    } else {
        publishEvent("payment.failed", {
            orderId: order.id.toString(),
            orderCode: order.orderCode,
            customerId: order.customerId.toString(),
            amount: Number(order.totalAmount),
        }).catch((err) => {
            console.error("[commerce_service] Failed to publish payment.failed event:", err);
        });
    }

    // Trả về mã thành công cho VNPay
    return { code: "00", message: "Confirm Success" };
}

export async function checkPaymentFromOrderCode(orderCode: string) {
    const normalizedOrderCode = String(orderCode ?? "").trim();
    if (!normalizedOrderCode) {
        throw new HttpError(400, "Thiếu mã đơn hàng", {
            code: "MISSING_ORDER_CODE",
        });
    }

    // 2. Chờ IPN cập nhật trạng thái đơn hàng (tối đa 5 phút)
    const startTime = Date.now();
    const TIMEOUT_MS = 5 * 60 * 1000; // 5 phút
    let pollIntervalMs = 3000; // Khởi tạo 3 giây

    let order;
    let payment;
    let isPaid = false;
    let isFailed = false;
    let isPending = true;

    while (Date.now() - startTime < TIMEOUT_MS) {
        order = await prisma.order.findUnique({
            where: { orderCode: normalizedOrderCode },
            include: {
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

        payment = order.payments[0];

        isPaid = order.paymentStatus === PaymentStatus.PAID || payment?.status === TransactionStatus.SUCCESS;
        isFailed = payment?.status === TransactionStatus.FAILED;
        isPending = !isPaid && !isFailed;

        if (!isPending) {
            break;
        }

        const elapsedMs = Date.now() - startTime;
        const remainingMs = TIMEOUT_MS - elapsedMs;
        if (remainingMs <= 0) {
            break;
        }

        await new Promise((resolve) => setTimeout(resolve, Math.min(pollIntervalMs, remainingMs)));
        pollIntervalMs *= 2; // Tăng thời gian chờ gấp đôi sau mỗi lần lặp
    }

    // Fallback TS typing
    if (!order) {
        throw new HttpError(404, "Không tìm thấy đơn hàng", {
            code: "ORDER_NOT_FOUND",
        });
    }

    return {
        order,
        payment,
        isPaid,
        isFailed,
        isPending,
    };
}

async function resolvePaymentLookupShopId(input: PaymentLookupAuthUser): Promise<bigint> {
    if (input.shopId && input.shopId.trim()) {
        try {
            return BigInt(input.shopId);
        } catch {
            // fall through to catalog lookup
        }
    }

    const shopId = await getShopIdBySellerId(input.userId);
    if (!shopId) {
        throw new HttpError(404, "Không tìm thấy shop của seller", {
            code: "SHOP_NOT_FOUND",
        });
    }

    return BigInt(shopId);
}

export async function getPaymentByOrderForUser(orderId: bigint, authUser: PaymentLookupAuthUser) {
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
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

    const role = String(authUser.role ?? "").toUpperCase();
    if (role === "CUSTOMER") {
        if (order.customerId.toString() !== authUser.userId) {
            throw new HttpError(403, "Bạn không có quyền truy cập thanh toán của đơn hàng này", {
                code: "FORBIDDEN",
            });
        }
    } else if (role === "SELLER") {
        const shopId = await resolvePaymentLookupShopId(authUser);
        if (order.shopId !== shopId) {
            throw new HttpError(403, "Bạn không có quyền truy cập thanh toán của đơn hàng này", {
                code: "FORBIDDEN",
            });
        }
    } else if (role !== "ADMIN") {
        throw new HttpError(403, "Bạn không có quyền truy cập", {
            code: "FORBIDDEN",
        });
    }

    const payment = order.payments[0];
    if (!payment) {
        throw new HttpError(404, "Không tìm thấy thanh toán của đơn hàng", {
            code: "PAYMENT_NOT_FOUND",
        });
    }

    return {
        payment: {
            orderId: order.id,
            method: payment.method,
            status: payment.status,
            amount: Number(payment.amount),
            transactionRef: payment.transactionRef,
            providerResponse: payment.providerResponse,
            checkoutUrlExpiresAt: payment.checkoutUrlExpiresAt?.toISOString() ?? null,
            createdAt: payment.createdAt.toISOString(),
            updatedAt: payment.updatedAt.toISOString(),
        },
    };
}
