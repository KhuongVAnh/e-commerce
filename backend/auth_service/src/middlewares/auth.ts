import { NextFunction, Request, Response } from "express";
import { prisma } from "../config/prisma";
import { sendError } from "../utils/http";
import { verifyAccessToken } from "../utils/token";

export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
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
  let payload: { userId: string };

  try {
    payload = verifyAccessToken(token);
  } catch {
    sendError(res, {
      requestId: res.locals.requestId,
      statusCode: 401,
      message: "Token không hợp lệ hoặc đã hết hạn",
      error: {
        code: "UNAUTHORIZED",
      },
    });
    return;
  }

  let userId: bigint;
  try {
    userId = BigInt(payload.userId);
  } catch {
    sendError(res, {
      requestId: res.locals.requestId,
      statusCode: 401,
      message: "Token không hợp lệ hoặc đã hết hạn",
      error: {
        code: "UNAUTHORIZED",
      },
    });
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user) {
      sendError(res, {
        requestId: res.locals.requestId,
        statusCode: 401,
        message: "Người dùng không tồn tại",
        error: {
          code: "UNAUTHORIZED",
        },
      });
      return;
    }

    if (user.status !== "ACTIVE") {
      sendError(res, {
        requestId: res.locals.requestId,
        statusCode: 403,
        message: "Tài khoản không hoạt động",
        error: {
          code: "ACCOUNT_INACTIVE",
        },
      });
      return;
    }

    req.authUser = {
      userId: user.id.toString(),
      email: user.email,
      fullName: user.fullName,
      role: user.role.name,
    };

    next();
  } catch (error) {
    next(error);
  }
}
