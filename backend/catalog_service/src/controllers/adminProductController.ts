import { NextFunction, Request, Response } from "express";
import { sendSuccess } from "../utils/https";
import {
  adminDeleteProduct,
  adminGetProductStats,
  adminGetProduct,
  adminListProducts,
  adminUpdateProduct,
} from "../services/adminProductService";

export async function adminListProductsController(req: Request, res: Response, _next: NextFunction): Promise<void> {
  const data = await adminListProducts({
    q: typeof req.query.q === "string" ? req.query.q : undefined,
    status: typeof req.query.status === "string" ? req.query.status : undefined,
    shopId: typeof req.query.shopId === "string" ? req.query.shopId : undefined,
    categoryId: typeof req.query.categoryId === "string" ? req.query.categoryId : undefined,
    page: typeof req.query.page === "string" ? req.query.page : undefined,
    limit: typeof req.query.limit === "string" ? req.query.limit : undefined,
  });

  sendSuccess(res, {
    requestId: res.locals.requestId,
    message: "Lấy danh sách sản phẩm (admin) thành công",
    data,
    pagination: data.pagination,
  });
}

export async function adminGetProductStatsController(req: Request, res: Response, _next: NextFunction): Promise<void> {
  const data = await adminGetProductStats();

  sendSuccess(res, {
    requestId: res.locals.requestId,
    message: "Lấy thống kê sản phẩm thành công",
    data,
  });
}

export async function adminGetProductController(req: Request, res: Response, _next: NextFunction): Promise<void> {
  const data = await adminGetProduct(String(req.params.productId ?? ""));

  sendSuccess(res, {
    requestId: res.locals.requestId,
    message: "Lấy chi tiết sản phẩm (admin) thành công",
    data,
  });
}

export async function adminUpdateProductController(req: Request, res: Response, _next: NextFunction): Promise<void> {
  const data = await adminUpdateProduct(String(req.params.productId ?? ""), req.body);

  sendSuccess(res, {
    requestId: res.locals.requestId,
    message: "Cập nhật sản phẩm (admin) thành công",
    data,
  });
}

export async function adminDeleteProductController(req: Request, res: Response, _next: NextFunction): Promise<void> {
  const data = await adminDeleteProduct(String(req.params.productId ?? ""));

  sendSuccess(res, {
    requestId: res.locals.requestId,
    message: "Xóa mềm sản phẩm (admin) thành công",
    data,
  });
}
