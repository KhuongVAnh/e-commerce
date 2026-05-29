import { NextFunction, Request, Response } from "express";
import { sendSuccess } from "../utils/https";
import {
  adminGetShop,
  adminGetShopStats,
  adminListShops,
  adminUpdateShopStatus,
} from "../services/adminShopService";

export async function adminListShopsController(req: Request, res: Response, _next: NextFunction): Promise<void> {
  const data = await adminListShops({
    q: typeof req.query.q === "string" ? req.query.q : undefined,
    status: typeof req.query.status === "string" ? req.query.status : undefined,
    page: typeof req.query.page === "string" ? req.query.page : undefined,
    limit: typeof req.query.limit === "string" ? req.query.limit : undefined,
  });

  sendSuccess(res, {
    requestId: res.locals.requestId,
    message: "Lấy danh sách shop thành công",
    data,
    pagination: data.pagination,
  });
}

export async function adminGetShopStatsController(req: Request, res: Response, _next: NextFunction): Promise<void> {
  const data = await adminGetShopStats();

  sendSuccess(res, {
    requestId: res.locals.requestId,
    message: "Lấy thống kê shop thành công",
    data,
  });
}

export async function adminGetShopController(req: Request, res: Response, _next: NextFunction): Promise<void> {
  const data = await adminGetShop(String(req.params.shopId ?? ""));

  sendSuccess(res, {
    requestId: res.locals.requestId,
    message: "Lấy thông tin shop thành công",
    data,
  });
}

export async function adminUpdateShopStatusController(req: Request, res: Response, _next: NextFunction): Promise<void> {
  const data = await adminUpdateShopStatus(String(req.params.shopId ?? ""), req.body);

  sendSuccess(res, {
    requestId: res.locals.requestId,
    message: "Cập nhật trạng thái shop thành công",
    data,
  });
}
