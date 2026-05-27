import "./config/env";
import cookieParser from "cookie-parser";
import express from "express";
import swaggerUi from "swagger-ui-express";
import authRoutes from "./routes/authRoutes";
import adminRoutes from "./routes/adminRoutes";
import openApiDocument from "./docs/openapi";
import { requestContextMiddleware } from "./middlewares/requestContext";
import { HttpError, sendError } from "./utils/http";
import { prisma } from "./config/prisma";

const { assertDatabaseLive, assertRedisLive } = require("../../shared/startup-checks.cjs");
const serviceName = "auth_service";

const app = express();
const port = Number(process.env.PORT) || 3001;

app.use(express.json());
app.use(cookieParser());
app.use(requestContextMiddleware);

app.get("/", (_req, res) => {
  res.json({
    service: "auth_service",
    message: "Auth Service is running",
  });
});

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "auth_service",
  });
});

app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));

app.use("/api/auth", authRoutes);
app.use("/api/auth/admin", adminRoutes);

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  
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
  
  console.error("[auth_service] unhandled error:", error);
  sendError(res, {
    requestId: res.locals.requestId,
    statusCode: 500,
    message: "Có lỗi xảy ra từ hệ thống",
    error: {
      code: "INTERNAL_SERVER_ERROR",
    },
  });
});

async function start() {
  await assertDatabaseLive(prisma, serviceName);
  await assertRedisLive(serviceName);

  app.listen(port, () => {
    console.log(`auth_service listening on port ${port}`);
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
