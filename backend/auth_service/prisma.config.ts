import { defineConfig } from "prisma/config";

const { loadServiceEnv } = require("../shared/db-url.cjs");
const databaseUrl = loadServiceEnv(__dirname, "auth_service");

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "node prisma/seed.js",
  },
  datasource: {
    url: databaseUrl,
  },
});
