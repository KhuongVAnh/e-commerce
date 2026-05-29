import { NextFunction, Request, Response, Router } from "express";
import { authMiddleware } from "../middlewares/auth";
import { roleMiddleware } from "../middlewares/role";
import {
  adminDashboardSummaryController,
  adminGetOrderDetailController,
  adminGetOrderStatsController,
  adminListOrdersController,
  adminUpdateOrderStatusController,
} from "../controllers/adminController";

const router = Router();

function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    handler(req, res, next).catch(next);
  };
}

router.use("/admin", authMiddleware, roleMiddleware(["ADMIN"]));

// Orders
router.get("/admin/orders", asyncHandler(adminListOrdersController));
router.get("/admin/orders/stats", asyncHandler(adminGetOrderStatsController));
router.get("/admin/orders/:orderId", asyncHandler(adminGetOrderDetailController));
router.patch("/admin/orders/:orderId/status", asyncHandler(adminUpdateOrderStatusController));

// Stats
router.get("/admin/dashboard-summary", asyncHandler(adminDashboardSummaryController));

export default router;
