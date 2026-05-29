const path = require("path");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");
const { buildDatabaseUrl, loadServiceEnv } = require("../../shared/db-url.cjs");

loadServiceEnv(path.resolve(__dirname, ".."), "commerce_service");

const adapter = new PrismaPg({
  connectionString: buildDatabaseUrl({ defaultSchema: "commerce_service", includeSearchPath: true }),
});
const prisma = new PrismaClient({ adapter });

const ORDER_STATUSES = [
  "PENDING",
  "AWAITING_PAYMENT",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPING",
  "DELIVERED",
  "CANCELLED"
];

// 10 Customers defined in auth_service
const CUSTOMER_IDS = Array.from({ length: 10 }, (_, i) => BigInt(1201 + i));

const ORDERS = [];
let orderId = 5001n;

for (const cid of CUSTOMER_IDS) {
  for (const status of ORDER_STATUSES) {
    const isPending = status === "PENDING" || status === "CANCELLED";
    // Using real product names matching catalog_service
    // Product 4001: Apple iPhone 15 Pro Max 256GB - 34,990,000
    // Product 4002: Samsung Galaxy S24 Ultra 512GB - 33,990,000
    const totalAmount = (34990000 + 33990000).toFixed(2);
    const shippingFee = "30000.00";
    const paymentAmount = (34990000 + 33990000 + 30000).toFixed(2);
    
    ORDERS.push({
      id: orderId,
      orderCode: `ORD-CNW-${orderId}`,
      customerId: cid,
      shopId: 3001n, // Mua từ Shop Điện tử
      totalAmount: totalAmount,
      shippingFee: shippingFee,
      paymentMethod: isPending ? "COD" : "VNPAY",
      paymentStatus: isPending ? "COD_PENDING" : "PAID",
      orderStatus: status,
      receiverName: `Customer ${cid}`,
      receiverPhone: "0900000000",
      receiverAddress: "100 Nguyễn Trãi, Quận 5, TP.HCM",
      note: "Giao hàng cẩn thận, hàng giá trị cao.",
      items: [
        {
          productId: 4001n,
          productNameSnapshot: "Apple iPhone 15 Pro Max 256GB",
          priceSnapshot: "34990000.00",
          quantity: 1,
          subtotal: "34990000.00",
        },
        {
          productId: 4002n,
          productNameSnapshot: "Samsung Galaxy S24 Ultra 512GB",
          priceSnapshot: "33990000.00",
          quantity: 1,
          subtotal: "33990000.00",
        }
      ],
      payments: [
        {
          method: isPending ? "COD" : "VNPAY",
          amount: paymentAmount,
          status: isPending ? "PENDING" : "SUCCESS",
          transactionRef: `${isPending ? 'COD' : 'VNPAY'}-ORD-${orderId}`,
          providerResponse: isPending ? "Thu tiền khi giao hàng" : '{"code":"00","message":"Success"}',
        }
      ],
    });
    orderId++;
  }
}

async function main() {
  await prisma.$connect();

  await prisma.$transaction(async (tx) => {
    // Generate Cart and CartItems for all 10 customers
    for (const cId of CUSTOMER_IDS) {
      const cart = await tx.cart.upsert({
        where: { customerId: cId },
        update: {},
        create: { customerId: cId },
      });

      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      await tx.cartItem.createMany({
        data: [
          { cartId: cart.id, productId: 4001n, shopId: 3001n, quantity: 1 },
          { cartId: cart.id, productId: 4002n, shopId: 3001n, quantity: 2 },
        ]
      });
    }

    // Generate Orders for all 10 customers (7 orders each)
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

  console.log(`Seeded commerce_service with carts and ${ORDERS.length} orders (7 cho mỗi khách hàng). Dữ liệu thực đã được đồng bộ.`);
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
