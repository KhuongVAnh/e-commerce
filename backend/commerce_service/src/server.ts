import "./config/env";
import express from "express";
import { HttpError, sendError } from "./utils/http";
import { requestContextMiddleware } from "./middlewares/requestContext";
import cartRoutes from "./routes/cart";
import orderRoutes from "./routes/order";
import paymentRoutes from "./routes/payment";
import adminRoutes from "./routes/admin";
import statsRoutes from "./routes/stats";
import { prisma } from "./config/prisma";
import swaggerUi from "swagger-ui-express";
import openApiDocument from "./docs/openapi";

const { assertDatabaseLive, assertRedisLive } = require("../../shared/startup-checks.cjs");
const serviceName = "commerce_service";

const app = express();
const port = Number(process.env.PORT) || 3003;
const trustProxy = process.env.TRUST_PROXY;

if (trustProxy) {
  // Chỉ bật trust proxy khi deploy sau gateway/reverse proxy đáng tin.
  // Khi chưa bật, Express sẽ bỏ qua x-forwarded-for do client tự gửi và req.ip lấy từ socket thật.
  app.set("trust proxy", trustProxy === "true" ? true : trustProxy);
}

app.use(express.json());
app.use(requestContextMiddleware);

app.get("/", (_req, res) => {
  res.json({
    service: "commerce_service",
    message: "Commerce Service is running",
  });
});

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "commerce_service",
  });
});

app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));
app.use("/api/commerce/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));

app.use("/api/commerce", cartRoutes);
app.use("/api/commerce", orderRoutes);
app.use("/api/commerce", paymentRoutes);
app.use("/api/commerce", adminRoutes);
app.use("/api/commerce", statsRoutes);

// Middleware xử lý lỗi chung, bắt tất cả lỗi được ném ra từ các controller hoặc middleware phía trên
app.use((error: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  
  // nếu lỗi thuộc lớp httpError đã được định nghĩa, thì trả về lỗi chuẩn cho client
  if (error instanceof HttpError) {
    sendError(res, {
      requestId: res.locals.requestId,
      statusCode: error.statusCode,
      message: error.message,
      error: {
        code: error.code,
        details: error.details,
        fieldErrors: error.fieldErrors,
        hint: error.hint,
      },
    });
    return;
  }
  
  // nếu lỗi không phải là HttpError, trả về lỗi 500 chung
  console.error("[commerce_service] unhandled error:", error);
  sendError(res, {
    requestId: res.locals.requestId,
    statusCode: 500,
    message: "Internal Server Error",
    error: {
      code: "INTERNAL_SERVER_ERROR",
      details: [error.message],
    },
  });
});

async function start() {
  await assertDatabaseLive(prisma, serviceName);
  await assertRedisLive(serviceName);

  app.listen(port, () => {
    console.log(`commerce_service listening on port ${port}`);
  });
}

start().catch(async (error) => {
  logStartupError(serviceName, error);
  await prisma.$disconnect().catch(() => undefined);
  process.exit(1);
});

function logStartupError(service: string, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[${service}] Startup failed: ${message}`);

  if (process.env.STARTUP_DEBUG === "true" && error instanceof Error && error.stack) {
    console.error(error.stack);
  }
}
