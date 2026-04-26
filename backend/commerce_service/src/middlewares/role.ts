import { NextFunction, Request, Response } from "express";
import { sendError } from "../utils/http";

// Middleware kiểm tra role của người dùng đã được xác thực
export function roleMiddleware(allowedRoles: string[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
        const role = req.authUser?.role;

        if (!role) {
            sendError(res, {
                requestId: res.locals.requestId,
                statusCode: 401,
                message: "Chưa xác thực người dùng",
                error: {
                    code: "UNAUTHORIZED",
                },
            });
            return;
        }

        if (!allowedRoles.includes(role)) {
            sendError(res, {
                requestId: res.locals.requestId,
                statusCode: 403,
                message: "Bạn không có quyền truy cập",
                error: {
                    code: "FORBIDDEN",
                    hint: `Yêu cầu một trong các role: ${allowedRoles.join(", ")}`,
                },
            });
            return;
        }

        next();
    };
}