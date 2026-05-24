import "./env";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const { buildDatabaseUrl } = require("../../../shared/db-url.cjs");

const adapter = new PrismaPg({
    connectionString: buildDatabaseUrl({ defaultSchema: "api_gateway", includeSearchPath: true }),
});

export const prisma = new PrismaClient({ adapter });
