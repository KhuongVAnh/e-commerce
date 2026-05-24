import { NextFunction, Request, Response } from "express";
import { createShop, getMyShop, updateMyShop, getShopBySellerId, getShopByIdInternal } from "../services/shopService";
import { sendSuccess } from "../utils/https";

// controller chỉ return success response, 
// lỗi sẽ được service ném ra dưới dạng exception, 
// và được middleware xử lý chung ở tầng trên (ở đây là errorHandlerMiddleware) 
// để trả về lỗi chuẩn cho client. Controller không cần phải quan tâm lỗi gì đã xảy ra, 
// chỉ cần tập trung vào logic chính của controller là gọi service và trả về success response.
export async function createShopController(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const data = await createShop(req.authUser!.userId, req.body);
    sendSuccess(res, {
        requestId: res.locals.requestId,
        message: "Tạo shop thành công",
        data,
        statusCode: 201,
    });
}

export async function getMyShopController(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const data = await getMyShop(req.authUser!.userId);
    sendSuccess(res, {
        requestId: res.locals.requestId,
        message: "Lấy shop của tôi thành công",
        data,
    });
}

export async function updateMyShopController(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const data = await updateMyShop(req.authUser!.userId, req.body);
    sendSuccess(res, {
        requestId: res.locals.requestId,
        message: "Cập nhật shop thành công",
        data,
    });
}

export async function getShopBySellerIdController(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const sellerId = req.params.sellerId as string;
    const data = await getShopBySellerId(sellerId);
    sendSuccess(res, {
        requestId: res.locals.requestId,
        message: "Lấy shop theo sellerId thành công",
        data,
    });
}

export async function getShopByIdInternalController(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const shopId = req.params.shopId as string;
    const data = await getShopByIdInternal(shopId);
    sendSuccess(res, {
        requestId: res.locals.requestId,
        message: "Lấy shop theo shopId thành công",
        data,
    });
}