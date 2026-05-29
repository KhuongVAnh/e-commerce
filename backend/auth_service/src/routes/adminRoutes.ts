import { NextFunction, Request, Response, Router } from "express";
import { authMiddleware } from "../middlewares/auth";
import { roleMiddleware } from "../middlewares/role";
import {
  adminBlockUserController,
  adminGetUserStatsController,
  adminGetUserController,
  adminListUsersController,
  adminUpdateUserController,
} from "../controllers/adminUserController";

const router = Router();

function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    handler(req, res, next).catch(next);
  };
}

// Require ADMIN for all routes below
router.use(authMiddleware);
router.use(roleMiddleware(["ADMIN"]));

// Users
router.get("/users", asyncHandler(adminListUsersController));
router.get("/users/stats", asyncHandler(adminGetUserStatsController));
router.get("/users/:userId", asyncHandler(adminGetUserController));
router.patch("/users/:userId", asyncHandler(adminUpdateUserController));
router.delete("/users/:userId", asyncHandler(adminBlockUserController));

export default router;
