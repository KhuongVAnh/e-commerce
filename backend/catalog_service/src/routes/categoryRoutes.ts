import { NextFunction, Request, Response, Router } from "express";
import {
    createCategoryController,
    deleteCategoryController,
    getCategoryStatsController,
    listCategoriesController,
    updateCategoryController,
} from "../controllers/categoryController";
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
    "/categories",
    asyncHandler(listCategoriesController),
);

router.get(
    "/admin/categories/stats",
    authMiddleware,
    roleMiddleware(["ADMIN"]),
    asyncHandler(getCategoryStatsController),
);

router.post(
    "/categories",
    authMiddleware,
    roleMiddleware(["ADMIN"]),
    asyncHandler(createCategoryController),
);

router.put(
    "/categories/:categoryId",
    authMiddleware,
    roleMiddleware(["ADMIN"]),
    asyncHandler(updateCategoryController),
);

router.delete(
    "/categories/:categoryId",
    authMiddleware,
    roleMiddleware(["ADMIN"]),
    asyncHandler(deleteCategoryController),
);

export default router;
