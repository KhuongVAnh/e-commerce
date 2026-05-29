import { NextFunction, Request, Response } from "express";
import { sendSuccess } from "../utils/http";
import {
  adminBlockUser,
  adminGetUserStats,
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

export async function adminGetUserStatsController(req: Request, res: Response, _next: NextFunction): Promise<void> {
  const data = await adminGetUserStats();

  sendSuccess(res, {
    requestId: res.locals.requestId,
    message: "Lấy thống kê người dùng thành công",
    data,
  });
}

export async function adminUpdateUserController(req: Request, res: Response, _next: NextFunction): Promise<void> {
  // Truyền actor xuống service để service biết admin nào đang thao tác.
  const data = await adminUpdateUser(String(req.params.userId ?? ""), req.body, {
    userId: req.authUser?.userId,
  });

  sendSuccess(res, {
    requestId: res.locals.requestId,
    message: "Cập nhật người dùng thành công",
    data,
  });
}

export async function adminBlockUserController(req: Request, res: Response, _next: NextFunction): Promise<void> {
  // DELETE theo inventory là alias block user, vẫn cần actor để chặn tự khóa.
  const data = await adminBlockUser(String(req.params.userId ?? ""), {
    userId: req.authUser?.userId,
  });

  sendSuccess(res, {
    requestId: res.locals.requestId,
    message: "Khóa người dùng thành công",
    data,
  });
}
