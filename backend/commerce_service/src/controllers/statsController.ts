import { NextFunction, Request, Response } from "express";
import { sendSuccess } from "../utils/http";
import { resolveShopIdForSeller } from "../services/orderService";
import { sellerRevenueSummary } from "../services/statsService";

export async function sellerRevenueSummaryController(req: Request, res: Response, _next: NextFunction): Promise<void> {
  const shopId = await resolveShopIdForSeller({
    userId: req.authUser!.userId,
    shopId: req.authUser?.shopId,
  });

  const data = await sellerRevenueSummary({
    shopId,
    from: typeof req.query.from === "string" ? req.query.from : undefined,
    to: typeof req.query.to === "string" ? req.query.to : undefined,
  });

  sendSuccess(res, {
    requestId: res.locals.requestId,
    message: "Lấy thống kê doanh thu seller thành công",
    data,
  });
}
