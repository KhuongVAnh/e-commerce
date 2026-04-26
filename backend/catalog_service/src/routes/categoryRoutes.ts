import { NextFunction, Request, Response, Router } from "express";
import {
    createCategoryController,
    listCategoriesController,
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

router.post(
    "/categories",
    authMiddleware,
    roleMiddleware(["ADMIN"]),
    asyncHandler(createCategoryController),
);

export default router;
