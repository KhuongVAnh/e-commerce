import "./config/env";
import express from "express";
import shopRoutes from "./routes/shopRoutes";
import { requestContextMiddleware } from "./middlewares/requestContext";
import { HttpError, sendError } from "./utils/https";

const app = express();
const port = Number(process.env.PORT) || 3002;

app.use(express.json());
app.use(requestContextMiddleware);

app.get("/", (_req, res) => {
  res.json({
    service: "catalog_service",
    message: "Catalog Service is running",
  });
});

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "catalog_service",
  });
});

app.use("/api/catalog", shopRoutes);

// Middleware xử lý lỗi chung, bắt tất cả lỗi được ném ra từ các controller hoặc middleware phía trên
app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("[catalog_service] unhandled error:", error);

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

  // nếu lỗi không phải là httpError, thì trả về lỗi 500 cho client
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
  console.log(`catalog_service listening on port ${port}`);
});
