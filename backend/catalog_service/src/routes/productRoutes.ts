import { NextFunction, Request, Response, Router } from "express";
import {
    createProductController,
    deleteProductController,
    listPublicProductsByIdsController,
    getPublicProductDetailController,
    listPublicProductsController,
    updateProductController,
    updateProductStockController,
    decrementStockInternalController,
    incrementStockInternalController,
} from "../controllers/productController";
import {
    adminDeleteProductController,
    adminGetProductController,
    adminListProductsController,
    adminUpdateProductController,
} from "../controllers/adminProductController";
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
    "/products/by-ids",
    asyncHandler(listPublicProductsByIdsController),
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

/** POST /internal/products/decrement-stock - Internal API cho commerce_service */
router.post(
    "/internal/products/decrement-stock",
    asyncHandler(decrementStockInternalController),
);

router.post(
    "/internal/products/increment-stock",
    asyncHandler(incrementStockInternalController),
);

// ─────────────────────────────────────────────────────────────
// Admin routes
// ─────────────────────────────────────────────────────────────

router.get(
    "/admin/products",
    authMiddleware,
    roleMiddleware(["ADMIN"]),
    asyncHandler(adminListProductsController),
);

router.get(
    "/admin/products/:productId",
    authMiddleware,
    roleMiddleware(["ADMIN"]),
    asyncHandler(adminGetProductController),
);

router.put(
    "/admin/products/:productId",
    authMiddleware,
    roleMiddleware(["ADMIN"]),
    asyncHandler(adminUpdateProductController),
);

router.delete(
    "/admin/products/:productId",
    authMiddleware,
    roleMiddleware(["ADMIN"]),
    asyncHandler(adminDeleteProductController),
);

export default router;
