import { NextFunction, Request, Response, Router } from "express";
import {
    createShopController,
    getMyShopController,
    updateMyShopController,
} from "../controllers/shopController";
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

export default router;