import { NextFunction, Request, Response } from "express";
import { sendError } from "../utils/http";
import { verifyAccessToken } from "../utils/token";

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
      userId: payload.sub,
      email: payload.email,
      fullName: payload.fullName,
      role: payload.role,
    };
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
}
