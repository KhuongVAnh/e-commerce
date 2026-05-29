import { ShopStatus } from "@prisma/client";
import { prisma } from "../config/prisma";
import { HttpError } from "../utils/https";

type ListShopsQuery = {
  q?: string;
  status?: string;
  page?: string;
  limit?: string;
};

type UpdateShopStatusInput = {
  status?: unknown;
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

function parsePagination(query: ListShopsQuery): { page: number; limit: number } {
  const rawPage = Number(query.page ?? 1);
  const rawLimit = Number(query.limit ?? 20);

  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  const limit = Number.isInteger(rawLimit) && rawLimit > 0 && rawLimit <= 100 ? rawLimit : 20;

  return { page, limit };
}

function parseOptionalShopStatus(value: unknown): ShopStatus | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new HttpError(400, "Dữ liệu không hợp lệ", {
      code: "VALIDATION_ERROR",
      fieldErrors: [{ field: "status", message: "status không hợp lệ" }],
    });
  }

  const normalized = value.trim().toUpperCase() as ShopStatus;
  const allowed = Object.values(ShopStatus);
  if (!allowed.includes(normalized)) {
    throw new HttpError(400, "Dữ liệu không hợp lệ", {
      code: "VALIDATION_ERROR",
      fieldErrors: [{ field: "status", message: `status phải là một trong: ${allowed.join(", ")}` }],
    });
  }

  return normalized;
}

function toShopResponse(shop: {
  id: bigint;
  sellerId: bigint;
  name: string;
  slug: string;
  logoUrl: string | null;
  description: string | null;
  address: string;
  status: ShopStatus;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: Number(shop.id),
    sellerId: Number(shop.sellerId),
    name: shop.name,
    slug: shop.slug,
    logoUrl: shop.logoUrl,
    description: shop.description,
    address: shop.address,
    status: shop.status,
    createdAt: shop.createdAt.toISOString(),
    updatedAt: shop.updatedAt.toISOString(),
  };
}

export async function adminListShops(query: ListShopsQuery) {
  const { page, limit } = parsePagination(query);
  const q = typeof query.q === "string" && query.q.trim() ? query.q.trim() : undefined;
  const status = parseOptionalShopStatus(query.status);

  const where = {
    ...(q
      ? {
        OR: [
          { name: { contains: q, mode: "insensitive" as const } },
          { slug: { contains: q, mode: "insensitive" as const } },
        ],
      }
      : {}),
    ...(status ? { status } : {}),
  };

  const [total, shops] = await Promise.all([
    prisma.shop.count({ where }),
    prisma.shop.findMany({
      where,
      orderBy: [
        { createdAt: "desc" },
        { id: "asc" }
      ],
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return {
    shops: shops.map(toShopResponse),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function adminGetShopStats() {
  const [total, pending, active, inactive] = await Promise.all([
    prisma.shop.count(),
    prisma.shop.count({ where: { status: ShopStatus.PENDING } }),
    prisma.shop.count({ where: { status: ShopStatus.ACTIVE } }),
    prisma.shop.count({ where: { status: ShopStatus.INACTIVE } }),
  ]);

  return {
    total,
    statuses: {
      PENDING: pending,
      ACTIVE: active,
      INACTIVE: inactive,
    },
  };
}

export async function adminGetShop(shopId: string) {
  const id = parsePositiveBigInt(shopId, "shopId");

  const shop = await prisma.shop.findUnique({ where: { id } });
  if (!shop) {
    throw new HttpError(404, "Shop không tồn tại", {
      code: "SHOP_NOT_FOUND",
    });
  }

  return {
    shop: toShopResponse(shop),
  };
}

function assertUpdateShopStatusInput(input: UpdateShopStatusInput): { status: ShopStatus } {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new HttpError(400, "Dữ liệu không hợp lệ", {
      code: "VALIDATION_ERROR",
      fieldErrors: [{ field: "body", message: "Body phải là object" }],
    });
  }

  const status = parseOptionalShopStatus((input as any).status);
  if (!status) {
    throw new HttpError(400, "Dữ liệu không hợp lệ", {
      code: "VALIDATION_ERROR",
      fieldErrors: [{ field: "status", message: "status là bắt buộc" }],
    });
  }

  return { status };
}

export async function adminUpdateShopStatus(shopId: string, input: UpdateShopStatusInput) {
  const id = parsePositiveBigInt(shopId, "shopId");
  const payload = assertUpdateShopStatusInput(input);

  const shop = await prisma.shop.update({
    where: { id },
    data: { status: payload.status },
  });

  return {
    shop: toShopResponse(shop),
  };
}
