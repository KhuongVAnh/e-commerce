import path from "path";

const { loadServiceEnv } = require("../../../shared/db-url.cjs");

const serviceRoot = path.resolve(__dirname, "../..");

loadServiceEnv(serviceRoot, "auth_service");
