import "dotenv/config";
import express from "express";
import { requestContextMiddleware } from "./middlewares/requestContext";
import { gatewayAuth } from "./middlewares/gatewayAuth";
import { createServiceProxy } from "./utils/proxy";
import { shouldUseGatewayAuth } from "./utils/routeMatcher";

const app = express();
const port = Number(process.env.PORT) || 3000;

const authServiceUrl = process.env.AUTH_SERVICE_URL || "http://localhost:3001";
const catalogServiceUrl = process.env.CATALOG_SERVICE_URL || "http://localhost:3002";

app.use(express.json());
// gắn id cho mỗi req đi vào, để dễ dàng trace log sau này
app.use(requestContextMiddleware);

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

app.use("/api/auth", createServiceProxy(authServiceUrl));
app.use("/api/catalog", createServiceProxy(catalogServiceUrl));

app.listen(port, () => {
  console.log(`api_gateway listening on port ${port}`);
});