"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const openapi_1 = __importDefault(require("./docs/openapi"));
const requestContext_1 = require("./middlewares/requestContext");
const http_1 = require("./utils/http");
const app = (0, express_1.default)();
const port = Number(process.env.PORT) || 3001;
app.use(express_1.default.json());
app.use(requestContext_1.requestContextMiddleware);
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
app.use("/docs", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(openapi_1.default));
app.use("/api/auth", authRoutes_1.default);
app.use((error, _req, res, _next) => {
    console.error("[auth_service] unhandled error:", error);
    if (error instanceof http_1.HttpError) {
        (0, http_1.sendError)(res, {
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
    (0, http_1.sendError)(res, {
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
