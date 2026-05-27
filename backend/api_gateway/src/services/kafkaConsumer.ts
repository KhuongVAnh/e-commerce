import { kafka } from "../config/kafka";
import type { EachMessagePayload } from "kafkajs";
import { prisma } from "../config/prisma";

const consumer = kafka.consumer({ groupId: "api-gateway-notification-group" });
let isConsumerStarted = false;

const TOPICS = [
    "user.registered",
    "order.created",
    "order.status.updated",
    "payment.succeeded",
    "payment.failed"
];

async function ensureNotificationTopics() {
    const admin = kafka.admin();

    await admin.connect();
    try {
        await admin.createTopics({
            waitForLeaders: true,
            topics: TOPICS.map((topic) => ({
                topic,
                numPartitions: 1,
                replicationFactor: 1,
            })),
        });
    } finally {
        await admin.disconnect();
    }
}

export async function startKafkaConsumer() {
    if (isConsumerStarted) {
        return;
    }

    try {
        await ensureNotificationTopics();

        await consumer.connect();
        console.log("[Kafka Consumer] Connected successfully.");

        // Subscribe to all notification topics
        for (const topic of TOPICS) {
            await consumer.subscribe({ topic, fromBeginning: false });
            console.log(`[Kafka Consumer] Subscribed to topic: ${topic}`);
        }

        await consumer.run({
            eachMessage: async ({ topic, partition, message }: EachMessagePayload) => {
                if (!message.value) return;
                
                const rawPayload = message.value.toString();
                console.log(`[Kafka Consumer] Received message on topic [${topic}], partition [${partition}]:`, rawPayload);
                
                try {
                    const payload = JSON.parse(rawPayload);
                    await handleNotificationEvent(topic, payload);
                } catch (err) {
                    console.error(`[Kafka Consumer] Error processing event from topic ${topic}:`, err);
                }
            }
        });
        isConsumerStarted = true;
    } catch (error) {
        isConsumerStarted = false;
        console.error("[Kafka Consumer] Failed to connect or run consumer:", error);
    }
}

export async function handleNotificationEvent(topic: string, payload: any) {
    switch (topic) {
        case "user.registered": {
            const { userId, fullName, role } = payload;
            if (!userId) return;

            await prisma.notification.create({
                data: {
                    userId: BigInt(userId),
                    type: "user.registered",
                    title: "Đăng ký tài khoản thành công",
                    content: `Chào mừng ${fullName} đã tham gia hệ thống e-commerce với vai trò ${role}!`,
                }
            });
            break;
        }

        case "order.created": {
            const { orderCode, customerId, totalAmount, receiverName, sellerId } = payload;
            if (!orderCode) return;

            // 1. Notify Customer
            if (customerId) {
                await prisma.notification.create({
                    data: {
                        userId: BigInt(customerId),
                        type: "order.created",
                        title: "Đặt hàng thành công",
                        content: `Đơn hàng ${orderCode} của bạn đã được tạo thành công với tổng số tiền ${Number(totalAmount).toLocaleString()} VND.`,
                    }
                });
            }

            // 2. Notify Seller (if sellerId is resolved)
            if (sellerId) {
                await prisma.notification.create({
                    data: {
                        userId: BigInt(sellerId),
                        type: "order.created",
                        title: "Có đơn hàng mới",
                        content: `Đơn hàng mới ${orderCode} đã được đặt tại cửa hàng của bạn từ người nhận: ${receiverName}.`,
                    }
                });
            }
            break;
        }

        case "order.status.updated": {
            const { orderCode, customerId, status } = payload;
            if (!orderCode || !customerId) return;

            await prisma.notification.create({
                data: {
                    userId: BigInt(customerId),
                    type: "order.status.updated",
                    title: "Cập nhật trạng thái đơn hàng",
                    content: `Đơn hàng ${orderCode} của bạn đã được chuyển sang trạng thái: ${status}.`,
                }
            });
            break;
        }

        case "payment.succeeded": {
            const { orderCode, customerId, amount, transactionRef } = payload;
            if (!orderCode || !customerId) return;

            await prisma.notification.create({
                data: {
                    userId: BigInt(customerId),
                    type: "payment.succeeded",
                    title: "Thanh toán thành công",
                    content: `Đơn hàng ${orderCode} đã thanh toán thành công số tiền ${Number(amount).toLocaleString()} VND. Mã giao dịch: ${transactionRef}.`,
                }
            });
            break;
        }

        case "payment.failed": {
            const { orderCode, customerId, amount } = payload;
            if (!orderCode || !customerId) return;

            await prisma.notification.create({
                data: {
                    userId: BigInt(customerId),
                    type: "payment.failed",
                    title: "Thanh toán thất bại",
                    content: `Thanh toán cho đơn hàng ${orderCode} với số tiền ${Number(amount).toLocaleString()} VND đã thất bại hoặc bị hủy.`,
                }
            });
            break;
        }

        default:
            console.warn(`[Kafka Consumer] Unhandled topic: ${topic}`);
    }
}
