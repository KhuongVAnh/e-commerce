const path = require("path");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");
const { buildDatabaseUrl, loadServiceEnv } = require("../../shared/db-url.cjs");

loadServiceEnv(path.resolve(__dirname, ".."), "commerce_service");

const adapter = new PrismaPg({
  connectionString: buildDatabaseUrl({ defaultSchema: "commerce_service", includeSearchPath: true }),
});
const prisma = new PrismaClient({ adapter });

const CUSTOMER_ID = 1003n;
const SHOP_ONE_ID = 3001n;
const SHOP_TWO_ID = 3002n;

const CART_ITEMS = [
  {
    productId: 4001n,
    shopId: SHOP_ONE_ID,
    quantity: 1,
  },
  {
    productId: 4003n,
    shopId: SHOP_ONE_ID,
    quantity: 2,
  },
  {
    productId: 4008n,
    shopId: SHOP_TWO_ID,
    quantity: 1,
  },
];

const ORDERS = [
  {
    id: 5001n,
    orderCode: "ORD-CNW-0001",
    customerId: CUSTOMER_ID,
    shopId: SHOP_ONE_ID,
    totalAmount: "3500000.00",
    shippingFee: "30000.00",
    paymentMethod: "COD",
    paymentStatus: "COD_PENDING",
    orderStatus: "CONFIRMED",
    receiverName: "Customer One",
    receiverPhone: "0900000001",
    receiverAddress: "100 Nguyễn Trãi, Quận 5, TP.HCM",
    note: "Gọi trước khi giao hàng.",
    items: [
      {
        productId: 4001n,
        productNameSnapshot: "Tai nghe Bluetooth chống ồn SoundAir Pro",
        priceSnapshot: "1890000.00",
        quantity: 1,
        subtotal: "1890000.00",
      },
      {
        productId: 4002n,
        productNameSnapshot: "Tai nghe true wireless BassPods Mini",
        priceSnapshot: "790000.00",
        quantity: 2,
        subtotal: "1580000.00",
      },
    ],
    payments: [
      {
        method: "COD",
        amount: "3500000.00",
        status: "PENDING",
        transactionRef: "COD-ORD-CNW-0001",
        providerResponse: "Thu tiền khi giao hàng",
      },
    ],
  },
  {
    id: 5002n,
    orderCode: "ORD-CNW-0002",
    customerId: CUSTOMER_ID,
    shopId: SHOP_TWO_ID,
    totalAmount: "2020000.00",
    shippingFee: "40000.00",
    paymentMethod: "VNPAY",
    paymentStatus: "PAID",
    orderStatus: "PROCESSING",
    receiverName: "Customer One",
    receiverPhone: "0900000001",
    receiverAddress: "100 Nguyễn Trãi, Quận 5, TP.HCM",
    note: "Đóng gói chống sốc.",
    items: [
      {
        productId: 4041n,
        productNameSnapshot: "Nồi chiên không dầu 5L AirCook",
        priceSnapshot: "1690000.00",
        quantity: 1,
        subtotal: "1690000.00",
      },
      {
        productId: 4046n,
        productNameSnapshot: "Bình giữ nhiệt inox 750ml",
        priceSnapshot: "290000.00",
        quantity: 1,
        subtotal: "290000.00",
      },
    ],
    payments: [
      {
        method: "VNPAY",
        amount: "2020000.00",
        status: "SUCCESS",
        transactionRef: "VNPAY-ORD-CNW-0002",
        providerResponse: '{"code":"00","message":"Success"}',
      },
    ],
  },
];

async function main() {
  await prisma.$connect();

  await prisma.$transaction(async (tx) => {
    const cart = await tx.cart.upsert({
      where: {
        customerId: CUSTOMER_ID,
      },
      update: {},
      create: {
        customerId: CUSTOMER_ID,
      },
    });

    await tx.cartItem.deleteMany({
      where: {
        cartId: cart.id,
      },
    });

    await tx.cartItem.createMany({
      data: CART_ITEMS.map((item) => ({
        cartId: cart.id,
        productId: item.productId,
        shopId: item.shopId,
        quantity: item.quantity,
      })),
    });

    for (const order of ORDERS) {
      await tx.order.upsert({
        where: {
          id: order.id,
        },
        update: {
          orderCode: order.orderCode,
          customerId: order.customerId,
          shopId: order.shopId,
          totalAmount: order.totalAmount,
          shippingFee: order.shippingFee,
          paymentMethod: order.paymentMethod,
          paymentStatus: order.paymentStatus,
          orderStatus: order.orderStatus,
          receiverName: order.receiverName,
          receiverPhone: order.receiverPhone,
          receiverAddress: order.receiverAddress,
          note: order.note,
        },
        create: {
          id: order.id,
          orderCode: order.orderCode,
          customerId: order.customerId,
          shopId: order.shopId,
          totalAmount: order.totalAmount,
          shippingFee: order.shippingFee,
          paymentMethod: order.paymentMethod,
          paymentStatus: order.paymentStatus,
          orderStatus: order.orderStatus,
          receiverName: order.receiverName,
          receiverPhone: order.receiverPhone,
          receiverAddress: order.receiverAddress,
          note: order.note,
        },
      });

      await tx.orderItem.deleteMany({
        where: {
          orderId: order.id,
        },
      });

      await tx.orderItem.createMany({
        data: order.items.map((item) => ({
          orderId: order.id,
          productId: item.productId,
          productNameSnapshot: item.productNameSnapshot,
          priceSnapshot: item.priceSnapshot,
          quantity: item.quantity,
          subtotal: item.subtotal,
        })),
      });

      await tx.payment.deleteMany({
        where: {
          orderId: order.id,
        },
      });

      await tx.payment.createMany({
        data: order.payments.map((payment) => ({
          orderId: order.id,
          method: payment.method,
          amount: payment.amount,
          status: payment.status,
          transactionRef: payment.transactionRef,
          providerResponse: payment.providerResponse,
        })),
      });
    }
  });

  console.log("Seeded commerce_service with cart, orders, order items and payments.");
  console.table(
    ORDERS.map((order) => ({
      orderId: order.id.toString(),
      orderCode: order.orderCode,
      customerId: order.customerId.toString(),
      shopId: order.shopId.toString(),
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
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
