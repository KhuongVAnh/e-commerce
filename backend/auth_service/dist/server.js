"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const app = (0, express_1.default)();
const port = Number(process.env.PORT) || 3001;
app.use(express_1.default.json());
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
app.listen(port, () => {
    console.log(`auth_service listening on port ${port}`);
});
