import { CookieOptions, NextFunction, Request, Response } from "express";
import { getMe, login, logout, refresh, register } from "../services/authService";
import { sendSuccess } from "../utils/http";

const REFRESH_TOKEN_COOKIE_NAME = process.env.REFRESH_TOKEN_COOKIE_NAME || "refreshToken";
const REFRESH_TOKEN_COOKIE_PATH = process.env.REFRESH_TOKEN_COOKIE_PATH || "/api/auth";
const ACCESS_TOKEN_COOKIE_NAME = "accessToken";

function getBaseRefreshCookieOptions(): Pick<CookieOptions, "httpOnly" | "secure" | "sameSite" | "path"> {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: REFRESH_TOKEN_COOKIE_PATH,
  };
}

function getBaseAccessCookieOptions(): Pick<CookieOptions, "httpOnly" | "secure" | "sameSite" | "path"> {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/", // Cần gửi cookie này cho toàn bộ API Gateway
  };
}

function getRefreshCookieOptions(refreshExpiresAtIso: string): CookieOptions {
  const expiresAt = new Date(refreshExpiresAtIso);

  if (Number.isNaN(expiresAt.getTime())) {
    return getBaseRefreshCookieOptions();
  }

  return {
    ...getBaseRefreshCookieOptions(),
    expires: expiresAt,
    maxAge: Math.max(0, expiresAt.getTime() - Date.now()),
  };
}

function getAccessCookieOptions(accessExpiresAtIso: string): CookieOptions {
  const expiresAt = new Date(accessExpiresAtIso);

  if (Number.isNaN(expiresAt.getTime())) {
    return getBaseAccessCookieOptions();
  }

  return {
    ...getBaseAccessCookieOptions(),
    expires: expiresAt,
    maxAge: Math.max(0, expiresAt.getTime() - Date.now()),
  };
}

function getRefreshTokenFromRequest(req: Request): string | undefined {
  const fromCookie = req.cookies?.[REFRESH_TOKEN_COOKIE_NAME];

  if (typeof fromCookie === "string" && fromCookie.trim()) {
    return fromCookie;
  }

  return undefined;
}

export async function registerController(req: Request, res: Response, _next: NextFunction): Promise<void> {
  const data = await register(req.body);
  sendSuccess(res, {
    requestId: res.locals.requestId,
    message: "Đăng ký thành công",
    data,
    statusCode: 201,
  });
}

export async function loginController(req: Request, res: Response, _next: NextFunction): Promise<void> {
  const data = await login(req.body);
  const { refreshToken, accessToken, ...safeTokens } = data.tokens;

  res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, getRefreshCookieOptions(data.tokens.refreshExpiresAt));
  res.cookie(ACCESS_TOKEN_COOKIE_NAME, accessToken, getAccessCookieOptions(data.tokens.accessExpiresAt));

  sendSuccess(res, {
    requestId: res.locals.requestId,
    message: "Đăng nhập thành công",
    data: {
      ...data,
      tokens: safeTokens,
    },
  });
}

export async function refreshController(req: Request, res: Response, _next: NextFunction): Promise<void> {
  const data = await refresh({ refreshToken: getRefreshTokenFromRequest(req) });
  const { refreshToken, accessToken, ...safeTokens } = data.tokens;

  res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, getRefreshCookieOptions(data.tokens.refreshExpiresAt));
  res.cookie(ACCESS_TOKEN_COOKIE_NAME, accessToken, getAccessCookieOptions(data.tokens.accessExpiresAt));

  sendSuccess(res, {
    requestId: res.locals.requestId,
    message: "Làm mới token thành công",
    data: {
      tokens: safeTokens,
    },
  });
}

export async function logoutController(req: Request, res: Response, _next: NextFunction): Promise<void> {
  const data = await logout({ refreshToken: getRefreshTokenFromRequest(req) });

  res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, getBaseRefreshCookieOptions());
  res.clearCookie(ACCESS_TOKEN_COOKIE_NAME, getBaseAccessCookieOptions());

  sendSuccess(res, {
    requestId: res.locals.requestId,
    message: "Đăng xuất thành công",
    data,
  });
}

export async function meController(req: Request, res: Response, _next: NextFunction): Promise<void> {
  const data = await getMe(req.authUser!.userId);
  sendSuccess(res, {
    requestId: res.locals.requestId,
    message: "Lấy thông tin người dùng thành công",
    data,
  });
}
