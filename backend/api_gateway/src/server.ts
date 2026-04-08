import "dotenv/config";
import express from "express";

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json());

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

app.listen(port, () => {
  console.log(`api_gateway listening on port ${port}`);
});
