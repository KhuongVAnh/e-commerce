const path = require("path");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");
const { buildDatabaseUrl, loadServiceEnv } = require("../../shared/db-url.cjs");

loadServiceEnv(path.resolve(__dirname, ".."), "catalog_service");

const adapter = new PrismaPg({
  connectionString: buildDatabaseUrl({ defaultSchema: "catalog_service", includeSearchPath: true }),
});
const prisma = new PrismaClient({ adapter });

const SELLER_ONE_ID = 1001n;
const SELLER_TWO_ID = 1002n;

const CATEGORIES = [
  { id: 2001n, name: "Điện tử", slug: "dien-tu", status: "ACTIVE" },
  { id: 2002n, name: "Thời trang", slug: "thoi-trang", status: "ACTIVE" },
  { id: 2003n, name: "Đồ gia dụng", slug: "do-gia-dung", status: "ACTIVE" },
];

const SHOPS = [
  {
    id: 3001n,
    sellerId: SELLER_ONE_ID,
    name: "CNWeb Tech Store",
    slug: "cnweb-tech-store",
    address: "12 Nguyễn Huệ, Quận 1, TP.HCM",
    description: "Shop công nghệ chuyên phụ kiện và thiết bị số.",
    status: "ACTIVE",
  },
  {
    id: 3002n,
    sellerId: SELLER_TWO_ID,
    name: "CNWeb Home & Style",
    slug: "cnweb-home-style",
    address: "35 Lê Lợi, Quận 1, TP.HCM",
    description: "Shop gia dụng và thời trang cho gia đình.",
    status: "ACTIVE",
  },
];

const PRODUCTS = [
  {
    id: 4001n,
    shopId: 3001n,
    categoryId: 2001n,
    name: "Tai nghe Bluetooth CNB-01",
    slug: "tai-nghe-bluetooth-cnb-01",
    description: "Tai nghe bluetooth pin 30 giờ, chống ồn cơ bản.",
    price: "890000.00",
    stockQuantity: 25,
    thumbnailUrl: "https://picsum.photos/seed/cnb01/800/800",
    status: "ACTIVE",
  },
  {
    id: 4002n,
    shopId: 3001n,
    categoryId: 2001n,
    name: "Chuột không dây CNM-02",
    slug: "chuot-khong-day-cnm-02",
    description: "Chuột không dây kết nối kép 2.4G + Bluetooth.",
    price: "390000.00",
    stockQuantity: 40,
    thumbnailUrl: "https://picsum.photos/seed/cnm02/800/800",
    status: "ACTIVE",
  },
  {
    id: 4003n,
    shopId: 3001n,
    categoryId: 2001n,
    name: "Bàn phím cơ CNK-03",
    slug: "ban-phim-co-cnk-03",
    description: "Bàn phím cơ switch đỏ, đèn nền RGB.",
    price: "1290000.00",
    stockQuantity: 15,
    thumbnailUrl: "https://picsum.photos/seed/cnk03/800/800",
    status: "ACTIVE",
  },
  {
    id: 4004n,
    shopId: 3001n,
    categoryId: 2001n,
    name: "Webcam FullHD CNW-04",
    slug: "webcam-fullhd-cnw-04",
    description: "Webcam 1080p tích hợp micro, phù hợp học và họp online.",
    price: "650000.00",
    stockQuantity: 18,
    thumbnailUrl: "https://picsum.photos/seed/cnw04/800/800",
    status: "ACTIVE",
  },
  {
    id: 4005n,
    shopId: 3001n,
    categoryId: 2001n,
    name: "Loa mini CNT-05",
    slug: "loa-mini-cnt-05",
    description: "Loa mini di động, âm lượng lớn, pin 12 giờ.",
    price: "520000.00",
    stockQuantity: 0,
    thumbnailUrl: "https://picsum.photos/seed/cnt05/800/800",
    status: "OUT_OF_STOCK",
  },
  {
    id: 4006n,
    shopId: 3002n,
    categoryId: 2002n,
    name: "Áo thun cotton basic CST-01",
    slug: "ao-thun-cotton-basic-cst-01",
    description: "Áo thun cotton 100%, form unisex.",
    price: "220000.00",
    stockQuantity: 60,
    thumbnailUrl: "https://picsum.photos/seed/cst01/800/800",
    status: "ACTIVE",
  },
  {
    id: 4007n,
    shopId: 3002n,
    categoryId: 2002n,
    name: "Quần jogger nam CSJ-02",
    slug: "quan-jogger-nam-csj-02",
    description: "Quần jogger nỉ co giãn, mặc thoải mái hằng ngày.",
    price: "340000.00",
    stockQuantity: 32,
    thumbnailUrl: "https://picsum.photos/seed/csj02/800/800",
    status: "ACTIVE",
  },
  {
    id: 4008n,
    shopId: 3002n,
    categoryId: 2003n,
    name: "Nồi chiên không dầu CSH-03",
    slug: "noi-chien-khong-dau-csh-03",
    description: "Nồi chiên dung tích 5L, công suất 1500W.",
    price: "1690000.00",
    stockQuantity: 12,
    thumbnailUrl: "https://picsum.photos/seed/csh03/800/800",
    status: "ACTIVE",
  },
  {
    id: 4009n,
    shopId: 3002n,
    categoryId: 2003n,
    name: "Bộ nồi inox 3 món CSH-04",
    slug: "bo-noi-inox-3-mon-csh-04",
    description: "Bộ nồi inox đáy từ dùng được bếp từ và bếp gas.",
    price: "980000.00",
    stockQuantity: 20,
    thumbnailUrl: "https://picsum.photos/seed/csh04/800/800",
    status: "ACTIVE",
  },
  {
    id: 4010n,
    shopId: 3002n,
    categoryId: 2003n,
    name: "Bình giữ nhiệt CSH-05",
    slug: "binh-giu-nhiet-csh-05",
    description: "Bình giữ nhiệt inox 500ml, giữ nóng/lạnh 8 giờ.",
    price: "260000.00",
    stockQuantity: 45,
    thumbnailUrl: "https://picsum.photos/seed/csh05/800/800",
    status: "ACTIVE",
  },
];

async function main() {
  await prisma.$connect();

  await prisma.$transaction(async (tx) => {
    const categorySlugs = CATEGORIES.map((category) => category.slug);
    const shopSlugs = SHOPS.map((shop) => shop.slug);
    const productSlugs = PRODUCTS.map((product) => product.slug);
    const productIds = PRODUCTS.map((product) => product.id);
    const existingCategories = await tx.category.findMany({
      where: {
        slug: {
          in: categorySlugs,
        },
      },
      select: {
        id: true,
      },
    });
    const existingShops = await tx.shop.findMany({
      where: {
        slug: {
          in: shopSlugs,
        },
      },
      select: {
        id: true,
      },
    });
    const existingCategoryIds = existingCategories.map((category) => category.id);
    const existingShopIds = existingShops.map((shop) => shop.id);

    const existingProducts = await tx.product.findMany({
      where: {
        OR: [
          {
            slug: {
              in: productSlugs,
            },
          },
          {
            categoryId: {
              in: existingCategoryIds,
            },
          },
          {
            shopId: {
              in: existingShopIds,
            },
          },
        ],
      },
      select: {
        id: true,
        slug: true,
      },
    });

    const existingProductIds = existingProducts.map((product) => product.id);
    const allProductIds = [...new Set([...productIds, ...existingProductIds])];

    await tx.productImage.deleteMany({
      where: {
        productId: {
          in: allProductIds,
        },
      },
    });

    await tx.product.deleteMany({
      where: {
        id: {
          in: existingProductIds,
        },
      },
    });

    await tx.shop.deleteMany({
      where: {
        slug: {
          in: shopSlugs,
        },
      },
    });

    await tx.category.deleteMany({
      where: {
        slug: {
          in: categorySlugs,
        },
      },
    });

    await tx.category.createMany({
      data: CATEGORIES,
    });

    await tx.shop.createMany({
      data: SHOPS,
    });

    await tx.product.createMany({
      data: PRODUCTS.map((product) => ({
        ...product,
        deletedAt: null,
      })),
    });

    for (const product of PRODUCTS) {
      await tx.productImage.createMany({
        data: [
          {
            productId: product.id,
            imageUrl: product.thumbnailUrl,
            sortOrder: 0,
          },
          {
            productId: product.id,
            imageUrl: `${product.thumbnailUrl}?v=2`,
            sortOrder: 1,
          },
        ],
      });
    }
  });

  console.log("Seeded catalog_service with categories, shops, and 10 products.");
  console.table(
    SHOPS.map((shop) => ({
      shopId: shop.id.toString(),
      sellerId: shop.sellerId.toString(),
      shopName: shop.name,
      slug: shop.slug,
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
