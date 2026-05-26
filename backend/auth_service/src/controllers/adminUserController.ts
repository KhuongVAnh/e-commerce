import { NextFunction, Request, Response } from "express";
import { sendSuccess } from "../utils/http";
import {
  adminBlockUser,
  adminGetUser,
  adminListUsers,
  adminUpdateUser,
} from "../services/adminUserService";

export async function adminListUsersController(req: Request, res: Response, _next: NextFunction): Promise<void> {
  const data = await adminListUsers({
    q: typeof req.query.q === "string" ? req.query.q : undefined,
    role: typeof req.query.role === "string" ? req.query.role : undefined,
    status: typeof req.query.status === "string" ? req.query.status : undefined,
    page: typeof req.query.page === "string" ? req.query.page : undefined,
    limit: typeof req.query.limit === "string" ? req.query.limit : undefined,
  });

  sendSuccess(res, {
    requestId: res.locals.requestId,
    message: "Lấy danh sách người dùng thành công",
    data,
  });
}

export async function adminGetUserController(req: Request, res: Response, _next: NextFunction): Promise<void> {
  const data = await adminGetUser(String(req.params.userId ?? ""));

  sendSuccess(res, {
    requestId: res.locals.requestId,
    message: "Lấy thông tin người dùng thành công",
    data,
  });
}

export async function adminUpdateUserController(req: Request, res: Response, _next: NextFunction): Promise<void> {
  const data = await adminUpdateUser(String(req.params.userId ?? ""), req.body);

  sendSuccess(res, {
    requestId: res.locals.requestId,
    message: "Cập nhật người dùng thành công",
    data,
  });
}

export async function adminBlockUserController(req: Request, res: Response, _next: NextFunction): Promise<void> {
  const data = await adminBlockUser(String(req.params.userId ?? ""));

  sendSuccess(res, {
    requestId: res.locals.requestId,
    message: "Khóa người dùng thành công",
    data,
  });
}
