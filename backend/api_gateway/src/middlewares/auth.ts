import { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../utils/token";
import { sendError } from "../utils/http";

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
    let token: string | undefined = undefined;
    const authorization = req.header("Authorization");

    if (authorization && authorization.startsWith("Bearer ")) {
        token = authorization.slice("Bearer ".length).trim();
    } else if (req.cookies && req.cookies.accessToken) {
        token = req.cookies.accessToken;
    }

    if (!token) {
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

    try {
        const payload = verifyAccessToken(token);
        (req as any).authUser = {
            userId: payload.userId,
            email: payload.email,
            fullName: payload.fullName,
            role: payload.role,
        };
        next();
    } catch (err) {
        sendError(res, {
            requestId: res.locals.requestId,
            statusCode: 401,
            message: "Token không hợp lệ hoặc đã hết hạn",
            error: {
                code: "UNAUTHORIZED",
            },
        });
    }
}
