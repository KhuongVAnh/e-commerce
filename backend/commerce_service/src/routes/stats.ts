import { NextFunction, Request, Response, Router } from "express";
import { authMiddleware } from "../middlewares/auth";
import { roleMiddleware } from "../middlewares/role";
import { sellerRevenueSummaryController } from "../controllers/statsController";

const router = Router();

function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    handler(req, res, next).catch(next);
  };
}

router.get(
  "/seller/revenue-summary",
  authMiddleware,
  roleMiddleware(["SELLER"]),
  asyncHandler(sellerRevenueSummaryController),
);

export default router;
