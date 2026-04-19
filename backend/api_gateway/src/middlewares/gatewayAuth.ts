import { Request, Response, NextFunction } from "express";
import { sendError } from "../utils/http";
import { verifyAccessToken } from "../utils/token";

export function gatewayAuth(req: Request, res: Response, next: NextFunction): void {
    const authHeader = req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        sendError(res, {
            statusCode: 401,
            message: "Thiếu token xác thực",
            error: {
                code: "UNAUTHORIZED",
                hint: "Truyền header Authorization: Bearer <access_token>",
            },
        });
        return;
    }

    const token = authHeader.slice("Bearer ".length).trim();

    try {
        verifyAccessToken(token);
        next();
    } catch {
        sendError(res, {
            requestId: res.locals.requestId,
            statusCode: 401,
            message: "Token không hợp lệ hoặc đã hết hạn",
            error: {
                code: "UNAUTHORIZED",
            },
        });
    }
};