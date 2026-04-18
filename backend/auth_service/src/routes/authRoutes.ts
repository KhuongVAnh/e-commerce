import { NextFunction, Request, Response, Router } from "express";
import {
  loginController,
  logoutController,
  meController,
  refreshController,
  registerController,
} from "../controllers/authController";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    handler(req, res, next).catch(next);
  };
}

router.post(
  "/register",
  asyncHandler(registerController),
);

router.post(
  "/login",
  asyncHandler(loginController),
);

router.post(
  "/refresh",
  asyncHandler(refreshController),
);

router.post(
  "/logout",
  asyncHandler(logoutController),
);

router.get(
  "/me",
  authMiddleware,
  asyncHandler(meController),
);

export default router;
