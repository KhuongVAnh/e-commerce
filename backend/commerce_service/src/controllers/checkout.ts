import { NextFunction, Response, Request } from "express";
import { buildCheckoutPreview } from "../services/checkoutPreview";
import { sendSuccess } from "../utils/http";
import { serializeBigInt } from "../utils/validation";
import { parseRequiredBigInt } from "../utils/validation";

export async function checkoutPreviewController(
    req: Request,
    res: Response,
    _next: NextFunction,
) {
    const shopId = parseRequiredBigInt(req.body.shopId, "shopId");

    const cartItemIds = Array.isArray(req.body.cartItemIds)
        ? req.body.cartItemIds.map((id: unknown) => parseRequiredBigInt(id, "cartItemIds"))
        : [];

    const data = await buildCheckoutPreview(
        parseRequiredBigInt(req.authUser!.userId, "userId"),
        shopId,
        cartItemIds,
    );

    return sendSuccess(res, {
        requestId: res.locals.requestId,
        message: "Checkout preview fetched successfully",
        data: serializeBigInt(data),
    });
}