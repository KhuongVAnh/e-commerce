import { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../utils/token";
import { sendError } from "../utils/https";

// Middleware xác thực người dùng dựa trên token JWT trong header Authorization
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
    const authorization = req.header("authorization");

    if (!authorization || !authorization.startsWith("Bearer ")) {
        sendError(res, {
            requestId: res.locals.requestId,
            statusCode: 401,
            message: "Thiếu token xác thực",
            error: {
                code: "UNAUTHORIZED",
                hint: "Truyền header Authorization: Bearer <access_token>",
            },
        });
        return;
    }

    const token = authorization.slice("Bearer ".length).trim();

    try {
        const payload = verifyAccessToken(token);
        req.authUser = {
            userId: payload.userId,
            email: payload.email,
            fullName: payload.fullName,
            role: payload.role,
        };

        if (payload.shopId) {
            req.authUser.shopId = payload.shopId;
        }

        next();
    } catch {
        sendError(res, {
            requestId: res.locals.requestId, // sử dụng requestId đã được tạo trong requestContextMiddleware
            statusCode: 401,
            message: "Token không hợp lệ hoặc đã hết hạn",
            error: {
                code: "UNAUTHORIZED",
            },
        });
    }
}