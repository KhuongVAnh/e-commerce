import { randomBytes } from "crypto";
import { Response } from "express";

// cấu trúc chung res tuân theo quy tắc trong tài liệu api response team thống nhất
const API_VERSION = process.env.API_VERSION || "v1";

type FieldError = {
    field: string;
    message: string;
};

type ErrorPayload = {
    code: string;
    details?: string[]; // phục vụ cho việc debug
    fieldErrors?: FieldError[];
    hint?: string | null; // gợi ý để người dùng có thể tự sửa lỗi
};

// tạo requestID
export function createRequestId(): string {
    return `req_${randomBytes(4).toString("hex")}`;
}

// class httperror tự cấu hình, dùng khi ném throw
export class HttpError extends Error {
    public readonly statusCode: number;
    public readonly code: string;
    public readonly details: string[];
    public readonly fieldErrors: FieldError[];
    public readonly hint: string | null;

    constructor(
        statusCode: number,
        message: string,
        options: ErrorPayload,
    ) {
        super(message);
        this.statusCode = statusCode;
        this.code = options.code;
        this.details = options.details ? options.details : [];
        this.fieldErrors = options.fieldErrors ?? [];
        this.hint = options.hint ?? null;
    }
}

// send success response
export function sendSuccess(
    res: Response,
    options: {
        requestId: string;
        message: string;
        data: unknown;
        statusCode?: number;
        pagination?: any;
        warnings?: string[];
    }) {
    const statusCode = options.statusCode ?? 200;

    return res.status(statusCode).json({
        success: true,
        message: options.message,
        data: options.data,
        meta: {
            requestId: options.requestId,
            timestamp: new Date().toISOString(),
            pagination: options.pagination ?? null,
            version: API_VERSION,
            warnings: options.warnings ?? [],
        },
    });
}

// send error response
export function sendError(
    res: Response,
    options: {
        requestId?: string;
        statusCode: number;
        message: string;
        error: ErrorPayload;
    }
) {
    return res.status(options.statusCode).json({
        success: false,
        message: options.message,
        error: {
            code: options.error.code,
            details: options.error.details ?? [],
            fieldErrors: options.error.fieldErrors ?? [],
            hint: options.error.hint ?? null,
        },
        meta: {
            requestId: options.requestId ?? createRequestId(),
            timestamp: new Date().toISOString(),
            version: API_VERSION,
        },
    });
}
