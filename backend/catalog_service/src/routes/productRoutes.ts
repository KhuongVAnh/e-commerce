import { NextFunction, Request, Response, Router } from "express";
import {
    createProductController,
    deleteProductController,
    getPublicProductDetailController,
    listPublicProductsController,
    updateProductController,
    updateProductStockController,
} from "../controllers/productController";
import { authMiddleware } from "../middlewares/auth";
import { roleMiddleware } from "../middlewares/role";

const router = Router();

function asyncHandler(
    handler: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) {
    return (req: Request, res: Response, next: NextFunction) => {
        handler(req, res, next).catch(next);
    };
}

router.get(
    "/products",
    asyncHandler(listPublicProductsController),
);

router.get(
    "/products/:productId",
    asyncHandler(getPublicProductDetailController),
);

router.post(
    "/products",
    authMiddleware,
    roleMiddleware(["SELLER"]),
    asyncHandler(createProductController),
);

router.put(
    "/products/:productId",
    authMiddleware,
    roleMiddleware(["SELLER"]),
    asyncHandler(updateProductController),
);

router.delete(
    "/products/:productId",
    authMiddleware,
    roleMiddleware(["SELLER"]),
    asyncHandler(deleteProductController),
);

router.patch(
    "/products/:productId/stock",
    authMiddleware,
    roleMiddleware(["SELLER"]),
    asyncHandler(updateProductStockController),
);

export default router;
