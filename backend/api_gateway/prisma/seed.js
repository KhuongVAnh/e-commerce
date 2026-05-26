const path = require("path");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");
const { buildDatabaseUrl, loadServiceEnv } = require("../../shared/db-url.cjs");

loadServiceEnv(path.resolve(__dirname, ".."), "api_gateway");

const adapter = new PrismaPg({
  connectionString: buildDatabaseUrl({ defaultSchema: "api_gateway", includeSearchPath: true }),
});
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.$connect();
  console.log("api_gateway has no seed data.");
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
