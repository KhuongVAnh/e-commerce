import { Router } from "express";
import {
    addToCartController,
    getCartController,
    removeCartItemController,
    updateCartItemQuantityController,
} from "../controllers/cart";
import { checkoutPreviewController } from "../controllers/checkout";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

router.use(authMiddleware);

router.get("/cart", getCartController);
router.post("/cart/items", addToCartController);
router.patch("/cart/items/:id", updateCartItemQuantityController);
router.delete("/cart/items/:id", removeCartItemController);
router.post("/checkout-preview", checkoutPreviewController);

export default router;