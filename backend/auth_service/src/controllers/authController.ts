import { NextFunction, Request, Response } from "express";
import { getMe, login, logout, refresh, register } from "../services/authService";
import { sendSuccess } from "../utils/http";

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
  sendSuccess(res, {
    requestId: res.locals.requestId,
    message: "Đăng nhập thành công",
    data,
  });
}

export async function refreshController(req: Request, res: Response, _next: NextFunction): Promise<void> {
  const data = await refresh(req.body);
  sendSuccess(res, {
    requestId: res.locals.requestId,
    message: "Làm mới token thành công",
    data,
  });
}

export async function logoutController(req: Request, res: Response, _next: NextFunction): Promise<void> {
  const data = await logout(req.body);
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
