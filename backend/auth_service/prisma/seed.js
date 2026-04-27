require("dotenv/config");

const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL || "" });
const prisma = new PrismaClient({ adapter });

const SEED_USERS = [
  {
    id: 1001n,
    email: "seller.one@cnweb.local",
    password: "123456",
    fullName: "Seller One",
    role: "SELLER",
  },
  {
    id: 1002n,
    email: "seller.two@cnweb.local",
    password: "123456",
    fullName: "Seller Two",
    role: "SELLER",
  },
  {
    id: 1003n,
    email: "customer.one@cnweb.local",
    password: "123456",
    fullName: "Customer One",
    role: "CUSTOMER",
  },
  {
    id: 1000n,
    email: "admin@cnweb.local",
    password: "123456",
    fullName: "System Admin",
    role: "ADMIN",
  },
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
        email: user.email,
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
