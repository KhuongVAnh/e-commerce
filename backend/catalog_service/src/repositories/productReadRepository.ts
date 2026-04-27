import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";

export type PublicProductSortBy = "latest" | "oldest" | "price_asc" | "price_desc";

export type listPublicProductsParams = {
    page: number;
    limit: number;
    shopId?: bigint;
    categoryId?: bigint;
    keyword?: string;
    sortBy: PublicProductSortBy;
};

function buildPublicProductWhere(params: listPublicProductsParams): Prisma.ProductWhereInput {
    return {
        status: "ACTIVE",
        deletedAt: null,
        ...(params.shopId !== undefined ? { shopId: params.shopId } : {}),
        ...(params.categoryId !== undefined ? { categoryId: params.categoryId } : {}),
        ...(params.keyword
            ? {
                OR: [
                    {
                        name: {
                            contains: params.keyword,
                            mode: "insensitive",
                        },
                    },
                    {
                        slug: {
                            contains: params.keyword,
                            mode: "insensitive",
                        },
                    },
                ],
            }
            : {}),
    };
}

function buildPublicProductOrderBy(sortBy: PublicProductSortBy): Prisma.ProductOrderByWithRelationInput {
    switch (sortBy) {
        case "price_asc":
            return { price: "asc" };
        case "price_desc":
            return { price: "desc" };
        case "oldest":
            return { createdAt: "asc" };
        default:
            return { createdAt: "desc" };
    }
}

export async function listPublicProductRecords(params: listPublicProductsParams) {
    const where = buildPublicProductWhere(params);
    const orderBy = buildPublicProductOrderBy(params.sortBy);
    const skip = (params.page - 1) * params.limit;

    const [total, products] = await prisma.$transaction([
        prisma.product.count({ where }),
        prisma.product.findMany({
            where,
            orderBy,
            skip,
            take: params.limit,
            select: {
                id: true,
                shopId: true,
                categoryId: true,
                name: true,
                slug: true,
                price: true,
                stockQuantity: true,
                thumbnailUrl: true,
                status: true,
            },
        }),
    ]);

    return {
        total,
        products,
    };
}

export async function findPublicProductDetailById(productId: bigint) {
    return prisma.product.findFirst({
        where: {
            id: productId,
            status: "ACTIVE",
            deletedAt: null,
        },
        select: {
            id: true,
            shopId: true,
            categoryId: true,
            name: true,
            slug: true,
            description: true,
            price: true,
            stockQuantity: true,
            thumbnailUrl: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            images: {
                select: {
                    id: true,
                    imageUrl: true,
                    sortOrder: true,
                },
                orderBy: {
                    sortOrder: "asc",
                },
            },
            shop: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
    });
}

export async function findPublicProductsByIds(productIds: bigint[]) {
    return prisma.product.findMany({
        where: {
            id: {
                in: productIds,
            },
            status: "ACTIVE",
            deletedAt: null,
        },
        select: {
            id: true,
            shopId: true,
            categoryId: true,
            name: true,
            slug: true,
            price: true,
            stockQuantity: true,
            thumbnailUrl: true,
            status: true,
        },
    });
}
