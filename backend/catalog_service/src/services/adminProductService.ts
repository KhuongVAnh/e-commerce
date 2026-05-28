import { prisma } from "../config/prisma";
import { HttpError } from "../utils/https";
import { softDeleteProduct, updateProduct } from "./productService";

type ListAdminProductsQuery = {
  q?: string;
  status?: string;
  shopId?: string;
  categoryId?: string;
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

function parsePagination(query: ListAdminProductsQuery): { page: number; limit: number } {
  const rawPage = Number(query.page ?? 1);
  const rawLimit = Number(query.limit ?? 20);

  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  const limit = Number.isInteger(rawLimit) && rawLimit > 0 && rawLimit <= 100 ? rawLimit : 20;

  return { page, limit };
}

export async function adminListProducts(query: ListAdminProductsQuery) {
  const { page, limit } = parsePagination(query);
  const q = typeof query.q === "string" && query.q.trim() ? query.q.trim() : undefined;

  const where: any = {
    ...(q
      ? {
        OR: [
          { name: { contains: q, mode: "insensitive" as const } },
          { slug: { contains: q, mode: "insensitive" as const } },
        ],
      }
      : {}),
  };

  if (typeof query.status === "string" && query.status.trim()) {
    where.status = query.status.trim().toUpperCase();
  }

  if (typeof query.shopId === "string" && query.shopId.trim()) {
    where.shopId = parsePositiveBigInt(query.shopId, "shopId");
  }

  if (typeof query.categoryId === "string" && query.categoryId.trim()) {
    where.categoryId = parsePositiveBigInt(query.categoryId, "categoryId");
  }

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      include: {
        shop: { select: { id: true, sellerId: true, name: true, slug: true, status: true } },
        category: { select: { id: true, name: true, slug: true, status: true } },
        images: { select: { id: true, imageUrl: true, sortOrder: true }, orderBy: { sortOrder: "asc" } },
      },
      orderBy: [
        { createdAt: "desc" },
        { id: "asc" }
      ],
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return {
    products: products.map((p) => ({
      id: Number(p.id),
      shopId: Number(p.shopId),
      categoryId: Number(p.categoryId),
      name: p.name,
      slug: p.slug,
      description: p.description,
      price: Number(p.price),
      stockQuantity: p.stockQuantity,
      thumbnailUrl: p.thumbnailUrl,
      status: p.status,
      deletedAt: p.deletedAt ? p.deletedAt.toISOString() : null,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      shop: {
        id: Number(p.shop.id),
        sellerId: Number(p.shop.sellerId),
        name: p.shop.name,
        slug: p.shop.slug,
        status: p.shop.status,
      },
      category: {
        id: Number(p.category.id),
        name: p.category.name,
        slug: p.category.slug,
        status: p.category.status,
      },
      images: p.images.map((img) => ({ id: Number(img.id), imageUrl: img.imageUrl, sortOrder: img.sortOrder })),
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function adminGetProduct(productId: string) {
  const id = parsePositiveBigInt(productId, "productId");

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      shop: { select: { id: true, sellerId: true, name: true, slug: true, status: true } },
      category: { select: { id: true, name: true, slug: true, status: true } },
      images: { select: { id: true, imageUrl: true, sortOrder: true }, orderBy: { sortOrder: "asc" } },
    },
  });

  if (!product) {
    throw new HttpError(404, "Sản phẩm không tồn tại", {
      code: "PRODUCT_NOT_FOUND",
    });
  }

  return {
    product: {
      id: Number(product.id),
      shopId: Number(product.shopId),
      categoryId: Number(product.categoryId),
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: Number(product.price),
      stockQuantity: product.stockQuantity,
      thumbnailUrl: product.thumbnailUrl,
      status: product.status,
      deletedAt: product.deletedAt ? product.deletedAt.toISOString() : null,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
      shop: {
        id: Number(product.shop.id),
        sellerId: Number(product.shop.sellerId),
        name: product.shop.name,
        slug: product.shop.slug,
        status: product.shop.status,
      },
      category: {
        id: Number(product.category.id),
        name: product.category.name,
        slug: product.category.slug,
        status: product.category.status,
      },
      images: product.images.map((img) => ({ id: Number(img.id), imageUrl: img.imageUrl, sortOrder: img.sortOrder })),
    },
  };
}

async function getOwnerSellerIdByProduct(productId: string): Promise<string> {
  const id = parsePositiveBigInt(productId, "productId");

  const product = await prisma.product.findUnique({
    where: { id },
    select: {
      id: true,
      shop: { select: { sellerId: true } },
    },
  });

  if (!product) {
    throw new HttpError(404, "Sản phẩm không tồn tại", {
      code: "PRODUCT_NOT_FOUND",
    });
  }

  return product.shop.sellerId.toString();
}

export async function adminUpdateProduct(productId: string, input: unknown) {
  const sellerId = await getOwnerSellerIdByProduct(productId);
  return updateProduct(sellerId, productId, input as any);
}

export async function adminDeleteProduct(productId: string) {
  const sellerId = await getOwnerSellerIdByProduct(productId);
  return softDeleteProduct(sellerId, productId);
}
