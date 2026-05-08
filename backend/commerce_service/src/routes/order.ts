import { Router } from "express";
import {
    createOrderController,
    getOrderPaymentUrlController,
    cancelOrderController,
} from "../controllers/order";
import { authMiddleware } from "../middlewares/auth";
import { roleMiddleware } from "../middlewares/role";

const router = Router();

// Tất cả route bên dưới đều yêu cầu đăng nhập
router.use(authMiddleware);

// ─────────────────────────────────────────────────────────────
// Customer routes
// ─────────────────────────────────────────────────────────────

/** POST /orders/checkout – Tạo đơn hàng từ giỏ hàng theo 1 shop */
router.post("/orders/checkout", roleMiddleware(["CUSTOMER"]), createOrderController);

/** GET /orders/:orderCode/payment-url – Lấy hoặc làm mới link thanh toán VNPay */
router.get("/orders/:orderCode/payment-url", roleMiddleware(["CUSTOMER"]), getOrderPaymentUrlController);

/** POST /orders/:orderCode/cancel – Hủy đơn hàng */
router.post("/orders/:orderCode/cancel", roleMiddleware(["CUSTOMER"]), cancelOrderController);

export default router;
