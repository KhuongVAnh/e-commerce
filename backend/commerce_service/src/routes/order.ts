import { Router } from "express";
import {
    createOrderController,
    getOrderPaymentUrlController,
    cancelOrderController,
    checkResultPaymentController,
    getMyOrderDetailController,
    getMyOrdersController,
    sellerGetOrdersController,
    sellerGetOrderDetailController,
    sellerUpdateOrderStatusController,
} from "../controllers/order";
import { authMiddleware } from "../middlewares/auth";
import { roleMiddleware } from "../middlewares/role";

const router = Router();

// Chỉ các route order/seller-order mới yêu cầu đăng nhập.
router.use("/orders", authMiddleware);
router.use("/seller/orders", authMiddleware);

// ─────────────────────────────────────────────────────────────
// Customer routes
// ─────────────────────────────────────────────────────────────

/** GET /orders/my – Lịch sử đơn hàng của customer */
router.get("/orders/my", roleMiddleware(["CUSTOMER"]), getMyOrdersController);

/** GET /orders/:id – Chi tiết đơn hàng */
router.get("/orders/:id", roleMiddleware(["CUSTOMER"]), getMyOrderDetailController);

/** POST /orders/checkout – Tạo đơn hàng từ giỏ hàng theo 1 shop */
router.post("/orders/checkout", roleMiddleware(["CUSTOMER"]), createOrderController);

/** GET /orders/:orderCode/payment-url – Lấy hoặc làm mới link thanh toán VNPay */
router.get("/orders/:orderCode/payment-url", roleMiddleware(["CUSTOMER"]), getOrderPaymentUrlController);

/** POST /orders/:orderCode/cancel – Hủy đơn hàng */
router.post("/orders/:orderCode/cancel", roleMiddleware(["CUSTOMER"]), cancelOrderController);

/**
 * GET /orders/:orderCode/check-result – Kiểm tra kết quả thanh toán VNPay theo orderCode.
 */
router.get("/orders/:orderCode/check-result", roleMiddleware(["CUSTOMER"]), checkResultPaymentController);

// ─────────────────────────────────────────────────────────────
// Seller routes
// ─────────────────────────────────────────────────────────────

/** GET /seller/orders – Danh sách đơn hàng của shop */
router.get("/seller/orders", roleMiddleware(["SELLER"]), sellerGetOrdersController);

/** GET /seller/orders/:id – Chi tiết đơn hàng của shop */
router.get("/seller/orders/:id", roleMiddleware(["SELLER"]), sellerGetOrderDetailController);

/** PATCH /seller/orders/:id/status – Cập nhật trạng thái đơn hàng */
router.patch("/seller/orders/:id/status", roleMiddleware(["SELLER"]), sellerUpdateOrderStatusController);

export default router;
