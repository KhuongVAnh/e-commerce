import { NextFunction, Request, Response } from "express";
import {
    addToCart,
    getCartGroupedByShop,
    removeCartItem,
    updateCartItemQuantity,
} from "../services/cartService";
import { sendSuccess } from "../utils/http";
import { parsePositiveInteger, parseRequiredBigInt, serializeBigInt } from "../utils/validation";
import { getShopIdByProductId } from "../services/catalogClient";

// lấy giỏ hàng
export async function getCartController(
    req: Request,
    res: Response,
    _next: NextFunction,
) {
    const data = await getCartGroupedByShop(parseRequiredBigInt(req.authUser!.userId, "userId"));

    return sendSuccess(res, {
        requestId: res.locals.requestId,
        message: "Lấy giỏ hàng thành công",
        data: serializeBigInt(data),
    });
}

// thêm giỏ hàng
export async function addToCartController(
    req: Request,
    res: Response,
    _next: NextFunction,
) {
    const productId = parseRequiredBigInt(req.body.productId, "productId");
    const quantity = parsePositiveInteger(req.body.quantity ?? 1, "quantity");

    const data = await addToCart(
        parseRequiredBigInt(req.authUser!.userId, "userId"),
        productId,
        quantity
    );

    return sendSuccess(res, {
        requestId: res.locals.requestId,
        statusCode: 201,
        message: "Added to cart successfully",
        data: serializeBigInt(data),
    });
}

export async function updateCartItemQuantityController(
    req: Request,
    res: Response,
    _next: NextFunction,
) {
    const cartItemId = parseRequiredBigInt(req.params.id, "id");
    const quantity = parsePositiveInteger(req.body.quantity, "quantity");

    const data = await updateCartItemQuantity(
        parseRequiredBigInt(req.authUser!.userId, "userId"),
        cartItemId,
        quantity
    );

    return sendSuccess(res, {
        requestId: res.locals.requestId,
        message: "Cart item updated successfully",
        data: serializeBigInt(data),
    });
}

export async function removeCartItemController(
    req: Request,
    res: Response,
    _next: NextFunction,
) {
    const cartItemId = parseRequiredBigInt(req.params.id, "id");
    await removeCartItem(parseRequiredBigInt(req.authUser!.userId, "userId"), cartItemId);

    return res.status(204).send();
}