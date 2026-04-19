import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

function buildConnectionString(): string {
    const databaseUrl = process.env.DATABASE_URL || "";
    if (!databaseUrl) {
        return "";
    }

    const parsed = new URL(databaseUrl);
    const schemaFromQuery = parsed.searchParams.get("schema");
    const schema = process.env.DB_SCHEMA || schemaFromQuery || "commerce_service";

    parsed.searchParams.set("schema", schema);
    parsed.searchParams.set("options", `-c search_path=${schema}`);

    return parsed.toString();
}

const adapter = new PrismaPg({ connectionString: buildConnectionString() });

export const prisma = new PrismaClient({ adapter });
