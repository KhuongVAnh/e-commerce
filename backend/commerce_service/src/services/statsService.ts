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

export async function sellerRevenueSummary(input: { shopId: bigint; from?: string; to?: string }) {
  const from = parseOptionalDate(input.from, "from");
  const to = parseOptionalDate(input.to, "to");

  const dateFilter: Prisma.OrderWhereInput = from || to
    ? {
      createdAt: {
        ...(from ? { gte: from } : {}),
        ...(to ? { lte: to } : {}),
      },
    }
    : {};

  const [totalOrders, revenueAgg] = await Promise.all([
    prisma.order.count({
      where: {
        shopId: input.shopId,
        ...dateFilter,
      },
    }),
    prisma.order.aggregate({
      where: {
        shopId: input.shopId,
        orderStatus: OrderStatus.DELIVERED,
        ...dateFilter,
      },
      _sum: { totalAmount: true },
    }),
  ]);

  return {
    shopId: Number(input.shopId),
    totalOrders,
    totalRevenue: Number(revenueAgg._sum.totalAmount ?? 0),
  };
}

export async function adminDashboardSummary(input: { from?: string; to?: string }) {
  const from = parseOptionalDate(input.from, "from");
  const to = parseOptionalDate(input.to, "to");

  const dateFilter: Prisma.OrderWhereInput = from || to
    ? {
      createdAt: {
        ...(from ? { gte: from } : {}),
        ...(to ? { lte: to } : {}),
      },
    }
    : {};

  const [totalOrders, revenueAgg] = await Promise.all([
    prisma.order.count({ where: { ...dateFilter } }),
    prisma.order.aggregate({
      where: {
        orderStatus: OrderStatus.DELIVERED,
        ...dateFilter,
      },
      _sum: { totalAmount: true },
    }),
  ]);

  return {
    totalOrders,
    totalRevenue: Number(revenueAgg._sum.totalAmount ?? 0),
  };
}
