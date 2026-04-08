import "dotenv/config";
import express from "express";

const app = express();
const port = Number(process.env.PORT) || 3001;

app.use(express.json());

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
