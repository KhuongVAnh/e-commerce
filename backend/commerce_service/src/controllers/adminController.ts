import { NextFunction, Request, Response } from "express";
import { sendSuccess } from "../utils/http";
import {
  adminGetOrderDetail,
  adminGetOrderStats,
  adminListOrders,
  adminUpdateOrderStatus,
} from "../services/adminOrderService";
import { adminDashboardSummary } from "../services/statsService";

export async function adminListOrdersController(req: Request, res: Response, _next: NextFunction): Promise<void> {
  const data = await adminListOrders({
    q: typeof req.query.q === "string" ? req.query.q : undefined,
    status: typeof req.query.status === "string" ? req.query.status : undefined,
    paymentStatus: typeof req.query.paymentStatus === "string" ? req.query.paymentStatus : undefined,
    paymentMethod: typeof req.query.paymentMethod === "string" ? req.query.paymentMethod : undefined,
    shopId: typeof req.query.shopId === "string" ? req.query.shopId : undefined,
    customerId: typeof req.query.customerId === "string" ? req.query.customerId : undefined,
    from: typeof req.query.from === "string" ? req.query.from : undefined,
    to: typeof req.query.to === "string" ? req.query.to : undefined,
    page: typeof req.query.page === "string" ? req.query.page : undefined,
    limit: typeof req.query.limit === "string" ? req.query.limit : undefined,
  });

  sendSuccess(res, {
    requestId: res.locals.requestId,
    message: "Lấy danh sách đơn hàng (admin) thành công",
    data,
    pagination: data.pagination,
  });
}

export async function adminGetOrderDetailController(req: Request, res: Response, _next: NextFunction): Promise<void> {
  const data = await adminGetOrderDetail(String(req.params.orderId ?? ""));

  sendSuccess(res, {
    requestId: res.locals.requestId,
    message: "Lấy chi tiết đơn hàng (admin) thành công",
    data,
  });
}

export async function adminGetOrderStatsController(req: Request, res: Response, _next: NextFunction): Promise<void> {
  const data = await adminGetOrderStats();

  sendSuccess(res, {
    requestId: res.locals.requestId,
    message: "Lấy thống kê đơn hàng (admin) thành công",
    data,
  });
}

export async function adminUpdateOrderStatusController(req: Request, res: Response, _next: NextFunction): Promise<void> {
  const data = await adminUpdateOrderStatus(String(req.params.orderId ?? ""), req.body?.status);

  sendSuccess(res, {
    requestId: res.locals.requestId,
    message: "Cập nhật trạng thái đơn hàng (admin) thành công",
    data,
  });
}

export async function adminDashboardSummaryController(req: Request, res: Response, _next: NextFunction): Promise<void> {
  const data = await adminDashboardSummary({
    from: typeof req.query.from === "string" ? req.query.from : undefined,
    to: typeof req.query.to === "string" ? req.query.to : undefined,
  });

  sendSuccess(res, {
    requestId: res.locals.requestId,
    message: "Lấy thống kê dashboard (admin) thành công",
    data,
  });
}
