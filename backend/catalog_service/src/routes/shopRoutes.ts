import { NextFunction, Request, Response, Router } from "express";
import {
    createShopController,
    getPublicShopDetailController,
    listPublicShopsController,
    getMyShopController,
    updateMyShopController,
    getShopBySellerIdController,
} from "../controllers/shopController";
import {
    adminGetShopController,
    adminListShopsController,
    adminUpdateShopStatusController,
} from "../controllers/adminShopController";
import { authMiddleware } from "../middlewares/auth";
import { roleMiddleware } from "../middlewares/role";

const router = Router();

// nhận vào controller, trả về middware thực thi controller đó, nếu controller trả về lỗi (throw exception) thì sẽ được bắt bởi catch và gọi next(error) để chuyển lỗi xuống errorHandlerMiddleware xử lý
function asyncHandler(
    handler: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) {
    return (req: Request, res: Response, next: NextFunction) => {
        handler(req, res, next).catch(next); // cú pháp luôn gọi handler, nếu lỗi thì chạy catch, catch gọi next
    };
}

router.get(
    "/shops",
    asyncHandler(listPublicShopsController),
);

router.post(
    "/shops",
    authMiddleware,
    roleMiddleware(["SELLER"]),
    asyncHandler(createShopController),
);

router.get(
    "/shops/my-shop",
    authMiddleware,
    roleMiddleware(["SELLER"]),
    asyncHandler(getMyShopController),
);

router.put(
    "/shops/my-shop",
    authMiddleware,
    roleMiddleware(["SELLER"]),
    asyncHandler(updateMyShopController),
);

// internal endpoint for other services to lookup shop by sellerId
router.get(
    "/shops/internal/by-seller/:sellerId",
    asyncHandler(getShopBySellerIdController),
);

// internal endpoint for other services to lookup shop by shopId
router.get(
    "/shops/internal/:shopId",
    asyncHandler(getShopByIdInternalController),
);

router.get(
    "/shops/:shopId",
    asyncHandler(getPublicShopDetailController),
);

// ─────────────────────────────────────────────────────────────
// Admin routes
// ─────────────────────────────────────────────────────────────

router.get(
    "/admin/shops",
    authMiddleware,
    roleMiddleware(["ADMIN"]),
    asyncHandler(adminListShopsController),
);

router.get(
    "/admin/shops/:shopId",
    authMiddleware,
    roleMiddleware(["ADMIN"]),
    asyncHandler(adminGetShopController),
);

router.patch(
    "/admin/shops/:shopId/status",
    authMiddleware,
    roleMiddleware(["ADMIN"]),
    asyncHandler(adminUpdateShopStatusController),
);

export default router;
