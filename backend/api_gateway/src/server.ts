import "./config/env";
import cors from "cors";
import express from "express";
import { requestContextMiddleware } from "./middlewares/requestContext";
import { gatewayAuth } from "./middlewares/gatewayAuth";
import uploadRoutes from "./routes/uploadRoutes";
import { createServiceProxy } from "./utils/proxy";
import { shouldUseGatewayAuth } from "./utils/routeMatcher";
import { authMiddleware } from "./middlewares/auth";
import notificationRoutes from "./routes/notificationRoutes";
import { startKafkaConsumer } from "./services/kafkaConsumer";
import { prisma } from "./config/prisma";

const { assertDatabaseLive, assertRedisLive } = require("../../shared/startup-checks.cjs");
const serviceName = "api_gateway";

const app = express();
const port = Number(process.env.PORT) || 3000;

const authServiceUrl = process.env.AUTH_SERVICE_URL || "http://localhost:3001";
const catalogServiceUrl = process.env.CATALOG_SERVICE_URL || "http://localhost:3002";
const commerceServiceUrl = process.env.COMMERCE_SERVICE_URL || "http://localhost:3003";
const corsEnabled = process.env.CORS_ENABLED !== "false";
const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

// Tự động cho phép chính API Gateway để tránh lỗi CORS khi chạy Swagger tại port 3000
allowedOrigins.push(`http://localhost:${port}`);
allowedOrigins.push(`http://127.0.0.1:${port}`);

const corsOptions = corsEnabled
  ? {
    origin(origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) {
      // Cho phép Postman/curl hoặc server-side request không có Origin.
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-request-id"],
  }
  : {
    origin: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-request-id"],
  };

app.use(cors(corsOptions));
app.use(express.json());
// gắn id cho mỗi req đi vào, để dễ dàng trace log sau này
app.use(requestContextMiddleware);
app.use("/api/uploads", uploadRoutes);

app.get("/", (_req, res) => {
  res.json({
    service: "api_gateway",
    message: "API Gateway is running",
  });
});

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "api_gateway",
  });
});

// nếu req đến 1 enpoint cần auth thì xác thực token trước bằng hàm gatewayAuth, không thì cho đi qua
app.use((req, res, next) => {
  if (!shouldUseGatewayAuth(req)) {
    next();
    return;
  }

  gatewayAuth(req, res, next);
});

// local notification routes (authenticates and handles routes locally)
app.use("/api/notifications", authMiddleware, notificationRoutes);

app.use("/api/auth", createServiceProxy(authServiceUrl));
app.use("/api/catalog", createServiceProxy(catalogServiceUrl));
app.use("/api/commerce", createServiceProxy(commerceServiceUrl));

// Middleware xử lý lỗi chung cho api_gateway (tránh trả về trang HTML 500 kèm stack trace)
app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("[api_gateway] unhandled error:", error);

  const message = error instanceof Error ? error.message : "Có lỗi xảy ra từ hệ thống";
  const isCorsError = error instanceof Error && error.message.includes("allowed by CORS");

  res.status(isCorsError ? 400 : 500).json({
    success: false,
    message,
    error: {
      code: isCorsError ? "CORS_ERROR" : "INTERNAL_SERVER_ERROR",
    },
    meta: {
      requestId: res.locals.requestId,
      timestamp: new Date().toISOString(),
      version: "v1",
    },
  });
});

async function start() {
  await assertDatabaseLive(prisma, serviceName);
  await assertRedisLive(serviceName);
}
app.listen(port, () => {
  console.log(`api_gateway listening on port ${port}`);
});

