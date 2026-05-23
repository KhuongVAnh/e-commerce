const path = require("path");

function loadDotenv(serviceRoot) {
  try {
    return require(path.join(serviceRoot, "node_modules", "dotenv"));
  } catch {
    return require("dotenv");
  }
}

function buildDatabaseUrl({ defaultSchema, includeSearchPath = false } = {}) {
  const databaseUrl = process.env.DATABASE_URL || "";
  if (!databaseUrl) {
    return "";
  }

  const parsed = new URL(databaseUrl);
  const schema = process.env.DB_SCHEMA || parsed.searchParams.get("schema") || defaultSchema;

  if (schema) {
    parsed.searchParams.set("schema", schema);
  }

  if (includeSearchPath && schema) {
    parsed.searchParams.set("options", `-c search_path=${schema}`);
  }

  return parsed.toString();
}

function loadServiceEnv(serviceRoot, defaultSchema = path.basename(serviceRoot)) {
  const backendRoot = path.resolve(serviceRoot, "..");
  const dotenv = loadDotenv(serviceRoot);

  dotenv.config({ path: path.join(serviceRoot, ".env"), quiet: true });
  dotenv.config({ path: path.join(backendRoot, ".env"), quiet: true });

  process.env.DATABASE_URL = buildDatabaseUrl({ defaultSchema });

  return process.env.DATABASE_URL;
}

module.exports = {
  buildDatabaseUrl,
  loadServiceEnv,
};
