import { Router } from "express";
import { vnpayIpnController, checkResultVNPAYController } from "../controllers/payment";

const router = Router();

/**
 * GET /payments/vnpay-return
 * Route dành cho VNPay Server gọi vào để cập nhật trạng thái thanh toán.
 * Không dùng authMiddleware vì VNPay gọi ẩn danh.
 */
router.get("/payments/vnpay-return", vnpayIpnController);

/**
 * GET /payments/check-result?orderCode=...
 * Route để FE kiểm tra kết quả thanh toán VNPay
 * FE forward toàn bộ query params từ VNPay để controller đối chiếu và trả về kết quả chính xác dựa trên DB.
 */
router.get("/payments/check-result", checkResultVNPAYController);

export default router;
