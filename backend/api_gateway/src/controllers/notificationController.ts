import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { sendSuccess, sendError } from "../utils/http";

// Helper to serialize BigInt properties to standard JSON types
function serializeNotification(notif: any) {
    return {
        id: Number(notif.id),
        userId: Number(notif.userId),
        type: notif.type,
        title: notif.title,
        content: notif.content,
        isRead: notif.isRead,
        readAt: notif.readAt ? notif.readAt.toISOString() : null,
        createdAt: notif.createdAt.toISOString(),
    };
}

/**
 * GET /api/notifications/me
 * Retrieves notifications for the logged-in user.
 */
export async function getMyNotifications(req: Request, res: Response): Promise<void> {
    const authUser = (req as any).authUser;
    const requestId = res.locals.requestId;

    if (!authUser) {
        sendError(res, {
            requestId,
            statusCode: 401,
            message: "Bạn chưa đăng nhập",
            error: { code: "UNAUTHORIZED" },
        });
        return;
    }

    try {
        const userId = BigInt(authUser.userId);
        
        // Parse pagination query params
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 10));
        
        // Parse isRead filter if provided
        let isReadFilter: boolean | undefined;
        if (req.query.isRead !== undefined) {
            isReadFilter = req.query.isRead === "true";
        }

        const whereClause = {
            userId,
            ...(isReadFilter !== undefined ? { isRead: isReadFilter } : {}),
        };

        // Query total count and records concurrently
        const [total, notifications, unreadCount] = await Promise.all([
            prisma.notification.count({ where: whereClause }),
            prisma.notification.findMany({
                where: whereClause,
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.notification.count({
                where: { userId, isRead: false },
            }),
        ]);

        const totalPages = Math.ceil(total / limit);

        sendSuccess(res, {
            requestId,
            message: "Lấy danh sách thông báo thành công",
            data: {
                notifications: notifications.map(serializeNotification),
                unreadCount,
            },
            pagination: {
                page,
                limit,
                total,
                totalPages,
            },
        });
    } catch (error: any) {
        console.error("[NotificationController] getMyNotifications error:", error);
        sendError(res, {
            requestId,
            statusCode: 500,
            message: "Lỗi hệ thống khi lấy thông báo",
            error: {
                code: "INTERNAL_SERVER_ERROR",
                details: [error.message],
            },
        });
    }
}

/**
 * PATCH /api/notifications/:id/read
 * Marks a notification as read.
 */
export async function markNotificationAsRead(req: Request, res: Response): Promise<void> {
    const authUser = (req as any).authUser;
    const requestId = res.locals.requestId;
    const idParam = req.params.id;

    if (!authUser) {
        sendError(res, {
            requestId,
            statusCode: 401,
            message: "Bạn chưa đăng nhập",
            error: { code: "UNAUTHORIZED" },
        });
        return;
    }

    try {
        const userId = BigInt(authUser.userId);
        const notifId = BigInt(idParam as string);

        // Verify the notification exists and belongs to the user
        const existing = await prisma.notification.findFirst({
            where: { id: notifId, userId },
        });

        if (!existing) {
            sendError(res, {
                requestId,
                statusCode: 404,
                message: "Không tìm thấy thông báo hoặc bạn không có quyền sở hữu",
                error: { code: "RESOURCE_NOT_FOUND" },
            });
            return;
        }

        // Update read status
        const updated = await prisma.notification.update({
            where: { id: notifId },
            data: {
                isRead: true,
                readAt: new Date(),
            },
        });

        sendSuccess(res, {
            requestId,
            message: "Đánh dấu thông báo đã đọc thành công",
            data: {
                notification: {
                    id: Number(updated.id),
                    isRead: updated.isRead,
                    readAt: updated.readAt ? updated.readAt.toISOString() : null,
                },
            },
        });
    } catch (error: any) {
        console.error("[NotificationController] markNotificationAsRead error:", error);
        sendError(res, {
            requestId,
            statusCode: 500,
            message: "Lỗi hệ thống khi đánh dấu đã đọc",
            error: {
                code: "INTERNAL_SERVER_ERROR",
                details: [error.message],
            },
        });
    }
}
