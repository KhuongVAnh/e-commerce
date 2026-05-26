import { OrderStatus, Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { HttpError } from "../utils/http";

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

function buildOrderDateFilter(from?: Date, to?: Date): Prisma.OrderWhereInput {
  return from || to
    ? {
      createdAt: {
        ...(from ? { gte: from } : {}),
        ...(to ? { lte: to } : {}),
      },
    }
    : {};
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addUtcDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function formatUtcDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function resolveSeriesRange(from?: Date, to?: Date): { from: Date; to: Date } {
  const today = startOfUtcDay(new Date());
  const defaultFrom = addUtcDays(today, -6);
  const defaultTo = addUtcDays(today, 1);

  const rangeFrom = from ? startOfUtcDay(from) : defaultFrom;
  const rangeTo = to ? addUtcDays(startOfUtcDay(to), 1) : defaultTo;

  return { from: rangeFrom, to: rangeTo };
}

async function buildRevenueSeries(where: Prisma.OrderWhereInput, from?: Date, to?: Date) {
  const range = resolveSeriesRange(from, to);
  const orders = await prisma.order.findMany({
    where: {
      ...where,
      orderStatus: OrderStatus.DELIVERED,
      createdAt: {
        gte: range.from,
        lt: range.to,
      },
    },
    select: {
      createdAt: true,
      totalAmount: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const totalsByDay = new Map<string, number>();
  for (const order of orders) {
    const day = formatUtcDay(order.createdAt);
    totalsByDay.set(day, (totalsByDay.get(day) ?? 0) + Number(order.totalAmount));
  }

  const series: Array<{ date: string; revenue: number }> = [];
  for (let cursor = range.from; cursor < range.to; cursor = addUtcDays(cursor, 1)) {
    const day = formatUtcDay(cursor);
    series.push({
      date: day,
      revenue: totalsByDay.get(day) ?? 0,
    });
  }

  return series;
}

export async function sellerRevenueSummary(input: { shopId: bigint; from?: string; to?: string }) {
  const from = parseOptionalDate(input.from, "from");
  const to = parseOptionalDate(input.to, "to");

  const dateFilter = buildOrderDateFilter(from, to);
  const baseWhere: Prisma.OrderWhereInput = {
    shopId: input.shopId,
    ...dateFilter,
  };

  const [
    totalOrders,
    pendingOrders,
    processingOrders,
    deliveredOrders,
    cancelledOrders,
    revenueAgg,
    recentOrders,
    revenueSeries,
  ] = await Promise.all([
    prisma.order.count({ where: baseWhere }),
    prisma.order.count({ where: { ...baseWhere, orderStatus: OrderStatus.PENDING } }),
    prisma.order.count({ where: { ...baseWhere, orderStatus: OrderStatus.PROCESSING } }),
    prisma.order.count({ where: { ...baseWhere, orderStatus: OrderStatus.DELIVERED } }),
    prisma.order.count({ where: { ...baseWhere, orderStatus: OrderStatus.CANCELLED } }),
    prisma.order.aggregate({
      where: {
        ...baseWhere,
        orderStatus: OrderStatus.DELIVERED,
      },
      _sum: { totalAmount: true },
    }),
    prisma.order.findMany({
      where: baseWhere,
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        orderCode: true,
        customerId: true,
        totalAmount: true,
        paymentMethod: true,
        paymentStatus: true,
        orderStatus: true,
        createdAt: true,
      },
    }),
    buildRevenueSeries({ shopId: input.shopId }, from, to),
  ]);

  return {
    shopId: Number(input.shopId),
    totalOrders,
    totalRevenue: Number(revenueAgg._sum.totalAmount ?? 0),
    pendingOrders,
    processingOrders,
    deliveredOrders,
    cancelledOrders,
    recentOrders: recentOrders.map((order) => ({
      id: order.id.toString(),
      orderCode: order.orderCode,
      customerId: order.customerId.toString(),
      totalAmount: Number(order.totalAmount),
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
      createdAt: order.createdAt.toISOString(),
    })),
    revenueSeries,
  };
}

export async function adminDashboardSummary(input: { from?: string; to?: string }) {
  const from = parseOptionalDate(input.from, "from");
  const to = parseOptionalDate(input.to, "to");

  const dateFilter = buildOrderDateFilter(from, to);
  const monthStart = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1));

  const [
    totalOrders,
    pendingOrders,
    deliveredOrders,
    cancelledOrders,
    revenueAgg,
    monthlyRevenueAgg,
    recentOrders,
  ] = await Promise.all([
    prisma.order.count({ where: dateFilter }),
    prisma.order.count({ where: { ...dateFilter, orderStatus: OrderStatus.PENDING } }),
    prisma.order.count({ where: { ...dateFilter, orderStatus: OrderStatus.DELIVERED } }),
    prisma.order.count({ where: { ...dateFilter, orderStatus: OrderStatus.CANCELLED } }),
    prisma.order.aggregate({
      where: {
        ...dateFilter,
        orderStatus: OrderStatus.DELIVERED,
      },
      _sum: { totalAmount: true },
    }),
    prisma.order.aggregate({
      where: {
        orderStatus: OrderStatus.DELIVERED,
        createdAt: { gte: monthStart },
      },
      _sum: { totalAmount: true },
    }),
    prisma.order.findMany({
      where: dateFilter,
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        orderCode: true,
        customerId: true,
        shopId: true,
        totalAmount: true,
        paymentMethod: true,
        paymentStatus: true,
        orderStatus: true,
        createdAt: true,
      },
    }),
  ]);

  return {
    totalOrders,
    totalRevenue: Number(revenueAgg._sum.totalAmount ?? 0),
    pendingOrders,
    deliveredOrders,
    cancelledOrders,
    monthlyRevenue: Number(monthlyRevenueAgg._sum.totalAmount ?? 0),
    recentOrders: recentOrders.map((order) => ({
      id: order.id.toString(),
      orderCode: order.orderCode,
      customerId: order.customerId.toString(),
      shopId: order.shopId.toString(),
      totalAmount: Number(order.totalAmount),
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
      createdAt: order.createdAt.toISOString(),
    })),
  };
}
