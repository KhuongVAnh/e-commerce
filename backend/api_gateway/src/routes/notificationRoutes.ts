import { Router } from "express";
import { getMyNotifications, markNotificationAsRead } from "../controllers/notificationController";

const router = Router();

router.get("/me", getMyNotifications);
router.patch("/:id/read", markNotificationAsRead);

export default router;
