const path = require("path");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const { buildDatabaseUrl, loadServiceEnv } = require("../../shared/db-url.cjs");

loadServiceEnv(path.resolve(__dirname, ".."), "auth_service");

const adapter = new PrismaPg({
  connectionString: buildDatabaseUrl({ defaultSchema: "auth_service", includeSearchPath: true }),
});
const prisma = new PrismaClient({ adapter });

const SEED_USERS = [
  // 3 Admins
  { id: 1001n, email: "admin1@cnweb.local", password: "123456", fullName: "Admin 1", role: "ADMIN" },
  { id: 1002n, email: "admin2@cnweb.local", password: "123456", fullName: "Admin 2", role: "ADMIN" },
  { id: 1003n, email: "admin3@cnweb.local", password: "123456", fullName: "Admin 3", role: "ADMIN" },
  
  // 10 Customers
  { id: 1201n, email: "customer1@cnweb.local", password: "123456", fullName: "Customer 1", role: "CUSTOMER" },
  { id: 1202n, email: "customer2@cnweb.local", password: "123456", fullName: "Customer 2", role: "CUSTOMER" },
  { id: 1203n, email: "customer3@cnweb.local", password: "123456", fullName: "Customer 3", role: "CUSTOMER" },
  { id: 1204n, email: "customer4@cnweb.local", password: "123456", fullName: "Customer 4", role: "CUSTOMER" },
  { id: 1205n, email: "customer5@cnweb.local", password: "123456", fullName: "Customer 5", role: "CUSTOMER" },
  { id: 1206n, email: "customer6@cnweb.local", password: "123456", fullName: "Customer 6", role: "CUSTOMER" },
  { id: 1207n, email: "customer7@cnweb.local", password: "123456", fullName: "Customer 7", role: "CUSTOMER" },
  { id: 1208n, email: "customer8@cnweb.local", password: "123456", fullName: "Customer 8", role: "CUSTOMER" },
  { id: 1209n, email: "customer9@cnweb.local", password: "123456", fullName: "Customer 9", role: "CUSTOMER" },
  { id: 1210n, email: "customer10@cnweb.local", password: "123456", fullName: "Customer 10", role: "CUSTOMER" },

  // 15 Sellers
  { id: 1101n, email: "seller1@cnweb.local", password: "123456", fullName: "Seller 1", role: "SELLER" },
  { id: 1102n, email: "seller2@cnweb.local", password: "123456", fullName: "Seller 2", role: "SELLER" },
  { id: 1103n, email: "seller3@cnweb.local", password: "123456", fullName: "Seller 3", role: "SELLER" },
  { id: 1104n, email: "seller4@cnweb.local", password: "123456", fullName: "Seller 4", role: "SELLER" },
  { id: 1105n, email: "seller5@cnweb.local", password: "123456", fullName: "Seller 5", role: "SELLER" },
  { id: 1106n, email: "seller6@cnweb.local", password: "123456", fullName: "Seller 6", role: "SELLER" },
  { id: 1107n, email: "seller7@cnweb.local", password: "123456", fullName: "Seller 7", role: "SELLER" },
  { id: 1108n, email: "seller8@cnweb.local", password: "123456", fullName: "Seller 8", role: "SELLER" },
  { id: 1109n, email: "seller9@cnweb.local", password: "123456", fullName: "Seller 9", role: "SELLER" },
  { id: 1110n, email: "seller10@cnweb.local", password: "123456", fullName: "Seller 10", role: "SELLER" },
  { id: 1111n, email: "seller11@cnweb.local", password: "123456", fullName: "Seller 11", role: "SELLER" },
  { id: 1112n, email: "seller12@cnweb.local", password: "123456", fullName: "Seller 12", role: "SELLER" },
  { id: 1113n, email: "seller13@cnweb.local", password: "123456", fullName: "Seller 13", role: "SELLER" },
  { id: 1114n, email: "seller14@cnweb.local", password: "123456", fullName: "Seller 14", role: "SELLER" },
  { id: 1115n, email: "seller15@cnweb.local", password: "123456", fullName: "Seller 15", role: "SELLER" },
];

async function main() {
  const roles = [
    {
      name: "CUSTOMER",
      description: "Customer account",
    },
    {
      name: "SELLER",
      description: "Seller account",
    },
    {
      name: "ADMIN",
      description: "System administrator",
    },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {
        description: role.description,
      },
      create: role,
    });
  }

  const roleMap = new Map();
  const roleRows = await prisma.role.findMany({
    where: {
      name: {
        in: roles.map((role) => role.name),
      },
    },
    select: {
      id: true,
      name: true,
    },
  });

  for (const role of roleRows) {
    roleMap.set(role.name, role.id);
  }

  for (const user of SEED_USERS) {
    await prisma.user.deleteMany({
      where: {
        OR: [
          { id: user.id },
          { email: user.email }
        ]
      },
    });

    const roleId = roleMap.get(user.role);
    if (!roleId) {
      throw new Error(`Role ${user.role} not found while seeding users.`);
    }

    const passwordHash = await bcrypt.hash(user.password, 10);

    await prisma.user.create({
      data: {
        id: user.id,
        email: user.email,
        passwordHash,
        fullName: user.fullName,
        roleId,
        status: "ACTIVE",
      },
    });
  }

  console.log("Seeded roles and users for auth_service.");
  console.table(
    SEED_USERS.map((user) => ({
      id: user.id.toString(),
      email: user.email,
      role: user.role,
      password: user.password,
    })),
  );
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
