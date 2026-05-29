import { OrderStatus, PaymentMethod, PaymentStatus, Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { HttpError } from "../utils/http";

type ListAdminOrdersQuery = {
  q?: string;
  status?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  shopId?: string;
  customerId?: string;
  from?: string;
  to?: string;
  page?: string;
  limit?: string;
};

function parsePositiveBigInt(value: unknown, field: string): bigint {
  const asText = String(value ?? "").trim();

  if (!asText || !/^\d+$/.test(asText)) {
    throw new HttpError(400, "Dữ liệu không hợp lệ", {
      code: "VALIDATION_ERROR",
      fieldErrors: [{ field, message: `${field} phải là số nguyên dương` }],
    });
  }

  const parsed = BigInt(asText);
  if (parsed <= 0n) {
    throw new HttpError(400, "Dữ liệu không hợp lệ", {
      code: "VALIDATION_ERROR",
      fieldErrors: [{ field, message: `${field} phải là số nguyên dương` }],
    });
  }

  return parsed;
}

function parseOptionalEnum<T extends string>(value: unknown, values: readonly T[], field: string): T | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new HttpError(400, "Dữ liệu không hợp lệ", {
      code: "VALIDATION_ERROR",
      fieldErrors: [{ field, message: `${field} không hợp lệ` }],
    });
  }

  const normalized = value.trim().toUpperCase();
  if (!values.includes(normalized as T)) {
    throw new HttpError(400, "Dữ liệu không hợp lệ", {
      code: "VALIDATION_ERROR",
      fieldErrors: [{ field, message: `${field} phải là một trong: ${values.join(", ")}` }],
    });
  }

  return normalized as T;
}

function parsePagination(query: ListAdminOrdersQuery): { page: number; limit: number } {
  const rawPage = Number(query.page ?? 1);
  const rawLimit = Number(query.limit ?? 20);

  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  const limit = Number.isInteger(rawLimit) && rawLimit > 0 && rawLimit <= 100 ? rawLimit : 20;

  return { page, limit };
}

function parseOptionalDate(value: unknown, field: string): Date | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new HttpError(400, "Dữ liệu không hợp lệ", {
      code: "VALIDATION_ERROR",
      fieldErrors: [{ field, message: `${field} không hợp lệ` }],
    });
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new HttpError(400, "Dữ liệu không hợp lệ", {
      code: "VALIDATION_ERROR",
      fieldErrors: [{ field, message: `${field} phải là ISO datetime hợp lệ` }],
    });
  }

  return parsed;
}

function serializeBigIntValue(value: bigint): number | string {
  const asNumber = Number(value);
  return Number.isSafeInteger(asNumber) ? asNumber : value.toString();
}

export async function adminListOrders(query: ListAdminOrdersQuery) {
  const { page, limit } = parsePagination(query);

  const q = typeof query.q === "string" && query.q.trim() ? query.q.trim() : undefined;
  const status = parseOptionalEnum(query.status, Object.values(OrderStatus), "status");
  const paymentStatus = parseOptionalEnum(query.paymentStatus, Object.values(PaymentStatus), "paymentStatus");
  const paymentMethod = parseOptionalEnum(query.paymentMethod, Object.values(PaymentMethod), "paymentMethod");
  const from = parseOptionalDate(query.from, "from");
  const to = parseOptionalDate(query.to, "to");

  const where: Prisma.OrderWhereInput = {
    ...(q ? { orderCode: { contains: q, mode: "insensitive" } } : {}),
    ...(status ? { orderStatus: status } : {}),
    ...(paymentStatus ? { paymentStatus } : {}),
    ...(paymentMethod ? { paymentMethod } : {}),
    ...(typeof query.shopId === "string" && query.shopId.trim()
      ? { shopId: parsePositiveBigInt(query.shopId, "shopId") }
      : {}),
    ...(typeof query.customerId === "string" && query.customerId.trim()
      ? { customerId: parsePositiveBigInt(query.customerId, "customerId") }
      : {}),
    ...(from || to
      ? {
        createdAt: {
          ...(from ? { gte: from } : {}),
          ...(to ? { lte: to } : {}),
        },
      }
      : {}),
  };

  const [total, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        orderCode: true,
        customerId: true,
        shopId: true,
        totalAmount: true,
        shippingFee: true,
        paymentMethod: true,
        paymentStatus: true,
        orderStatus: true,
        receiverName: true,
        receiverPhone: true,
        receiverAddress: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
  ]);

  return {
    orders: orders.map((o) => ({
      id: serializeBigIntValue(o.id),
      orderCode: o.orderCode,
      customerId: serializeBigIntValue(o.customerId),
      shopId: serializeBigIntValue(o.shopId),
      totalAmount: Number(o.totalAmount),
      shippingFee: Number(o.shippingFee),
      paymentMethod: o.paymentMethod,
      paymentStatus: o.paymentStatus,
      orderStatus: o.orderStatus,
      receiverName: o.receiverName,
      receiverPhone: o.receiverPhone,
      receiverAddress: o.receiverAddress,
      createdAt: o.createdAt.toISOString(),
      updatedAt: o.updatedAt.toISOString(),
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function adminGetOrderStats() {
  const [total, pending, awaitingPayment, confirmed, processing, shipping, delivered, cancelled, paid] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { orderStatus: OrderStatus.PENDING } }),
    prisma.order.count({ where: { orderStatus: OrderStatus.AWAITING_PAYMENT } }),
    prisma.order.count({ where: { orderStatus: OrderStatus.CONFIRMED } }),
    prisma.order.count({ where: { orderStatus: OrderStatus.PROCESSING } }),
    prisma.order.count({ where: { orderStatus: OrderStatus.SHIPPING } }),
    prisma.order.count({ where: { orderStatus: OrderStatus.DELIVERED } }),
    prisma.order.count({ where: { orderStatus: OrderStatus.CANCELLED } }),
    prisma.order.count({ where: { paymentStatus: PaymentStatus.PAID } }),
  ]);

  return {
    total,
    pending: pending + awaitingPayment,
    paid,
    cancelled,
    orderStatuses: {
      PENDING: pending,
      AWAITING_PAYMENT: awaitingPayment,
      CONFIRMED: confirmed,
      PROCESSING: processing,
      SHIPPING: shipping,
      DELIVERED: delivered,
      CANCELLED: cancelled,
    },
  };
}

export async function adminGetOrderDetail(orderId: string) {
  const id = parsePositiveBigInt(orderId, "orderId");

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { orderBy: { id: "asc" } },
      payments: { orderBy: { id: "asc" } },
    },
  });

  if (!order) {
    throw new HttpError(404, "Không tìm thấy đơn hàng", {
      code: "ORDER_NOT_FOUND",
    });
  }

  return {
    order: {
      id: serializeBigIntValue(order.id),
      orderCode: order.orderCode,
      customerId: serializeBigIntValue(order.customerId),
      shopId: serializeBigIntValue(order.shopId),
      totalAmount: Number(order.totalAmount),
      shippingFee: Number(order.shippingFee),
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
      receiverName: order.receiverName,
      receiverPhone: order.receiverPhone,
      receiverAddress: order.receiverAddress,
      note: order.note,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      items: order.items.map((it) => ({
        id: serializeBigIntValue(it.id),
        productId: serializeBigIntValue(it.productId),
        productNameSnapshot: it.productNameSnapshot,
        priceSnapshot: Number(it.priceSnapshot),
        quantity: it.quantity,
        subtotal: Number(it.subtotal),
      })),
      payments: order.payments.map((p) => ({
        id: serializeBigIntValue(p.id),
        method: p.method,
        amount: Number(p.amount),
        status: p.status,
        transactionRef: p.transactionRef,
        checkoutUrl: p.checkoutUrl,
        checkoutUrlCreatedAt: p.checkoutUrlCreatedAt?.toISOString() ?? null,
        checkoutUrlExpiresAt: p.checkoutUrlExpiresAt?.toISOString() ?? null,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })),
    },
  };
}

export async function adminUpdateOrderStatus(orderId: string, nextStatus: unknown) {
  const id = parsePositiveBigInt(orderId, "orderId");
  const status = parseOptionalEnum(nextStatus, Object.values(OrderStatus), "status");

  if (!status) {
    throw new HttpError(400, "Dữ liệu không hợp lệ", {
      code: "VALIDATION_ERROR",
      fieldErrors: [{ field: "status", message: "status là bắt buộc" }],
    });
  }

  const existing = await prisma.order.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existing) {
    throw new HttpError(404, "Không tìm thấy đơn hàng", {
      code: "ORDER_NOT_FOUND",
    });
  }

  const updated = await prisma.order.update({
    where: { id },
    data: { orderStatus: status },
    select: {
      id: true,
      orderCode: true,
      orderStatus: true,
      updatedAt: true,
    },
  });

  return {
    order: {
      id: serializeBigIntValue(updated.id),
      orderCode: updated.orderCode,
      orderStatus: updated.orderStatus,
      updatedAt: updated.updatedAt.toISOString(),
    },
  };
}
