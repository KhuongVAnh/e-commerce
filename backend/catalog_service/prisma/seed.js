require("dotenv/config");

const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");

function buildConnectionString() {
  const databaseUrl = process.env.DATABASE_URL || "";
  if (!databaseUrl) {
    return "";
  }

  const parsed = new URL(databaseUrl);
  const schemaFromQuery = parsed.searchParams.get("schema");
  const schema = process.env.DB_SCHEMA || schemaFromQuery || "catalog_service";

  parsed.searchParams.set("schema", schema);
  parsed.searchParams.set("options", `-c search_path=${schema}`);

  return parsed.toString();
}

const adapter = new PrismaPg({ connectionString: buildConnectionString() });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.$connect();

  const [schemaInfo] = await prisma.$queryRawUnsafe(`
    SELECT
      current_schema() AS current_schema,
      current_setting('search_path') AS search_path
  `);

  console.log("[catalog_service seed] runtime schema info:", schemaInfo);

  const seedCategory = await prisma.category.upsert({
    where: { slug: "dien-tu" },
    update: {
      name: "Điện tử",
      status: "ACTIVE",
    },
    create: {
      name: "Điện tử",
      slug: "dien-tu",
      status: "ACTIVE",
    },
  });

  const seedShop = await prisma.shop.upsert({
    where: { slug: "shop-demo" },
    update: {
      name: "Shop Demo",
      address: "123 Đường Demo, Quận 1, TP.HCM",
      description: "Shop seed để kiểm tra schema runtime của catalog_service",
      status: "PENDING",
    },
    create: {
      sellerId: BigInt(999999),
      name: "Shop Demo",
      slug: "shop-demo",
      address: "123 Đường Demo, Quận 1, TP.HCM",
      description: "Shop seed để kiểm tra schema runtime của catalog_service",
      status: "PENDING",
    },
  });

  console.log("[catalog_service seed] category:", {
    id: seedCategory.id.toString(),
    slug: seedCategory.slug,
  });

  console.log("[catalog_service seed] shop:", {
    id: seedShop.id.toString(),
    sellerId: seedShop.sellerId.toString(),
    slug: seedShop.slug,
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
