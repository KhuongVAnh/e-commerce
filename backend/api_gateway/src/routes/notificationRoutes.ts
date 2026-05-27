import { Router } from "express";
import {
    getNotificationDetail,
    getMyNotifications,
    markAllNotificationsAsRead,
    markNotificationAsRead,
} from "../controllers/notificationController";

const router = Router();

router.get("/me", getMyNotifications);
router.get("/:id", getNotificationDetail);
router.patch("/read-all", markAllNotificationsAsRead);
router.patch("/:id/read", markNotificationAsRead);

export default router;
