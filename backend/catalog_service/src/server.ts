import "dotenv/config";
import express from "express";

const app = express();
const port = Number(process.env.PORT) || 3002;

app.use(express.json());

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

app.listen(port, () => {
  console.log(`catalog_service listening on port ${port}`);
});
