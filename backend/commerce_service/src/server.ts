import "dotenv/config";
import express from "express";

const app = express();
const port = Number(process.env.PORT) || 3003;

app.use(express.json());

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

app.listen(port, () => {
  console.log(`commerce_service listening on port ${port}`);
});
