import "dotenv/config";
import express from "express";
import swaggerUi from "swagger-ui-express";
import authRoutes from "./routes/authRoutes";
import openApiDocument from "./docs/openapi";
import { requestContextMiddleware } from "./middlewares/requestContext";
import { HttpError, sendError } from "./utils/http";

const app = express();
const port = Number(process.env.PORT) || 3001;

app.use(express.json());
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

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("[auth_service] unhandled error:", error);

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

  sendError(res, {
    requestId: res.locals.requestId,
    statusCode: 500,
    message: "Có lỗi xảy ra từ hệ thống",
    error: {
      code: "INTERNAL_SERVER_ERROR",
    },
  });
});

app.listen(port, () => {
  console.log(`auth_service listening on port ${port}`);
});
