import { NextFunction, Request, Response } from "express";
import { createRequestId } from "../utils/https";

/**
 * Đọc x-request-id nếu request đã có sẵn từ gateway.
 * Nếu chưa có, nó tự sinh ra một requestId mới.
 * Sau đó nó gắn requestId vào res.locals, để mọi middleware và controller phía sau dùng lại.
 */
export function requestContextMiddleware(req: Request, res: Response, next: NextFunction): void {
    const incomingRequestId = req.header("x-request-id");
    res.locals.requestId = incomingRequestId && incomingRequestId.trim()
        ? incomingRequestId
        : createRequestId();
    next();
}