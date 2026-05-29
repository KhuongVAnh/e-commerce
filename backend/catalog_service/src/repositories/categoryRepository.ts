import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";

type listCategoryParams = {
    q?: string;
    status?: "ACTIVE" | "INACTIVE";
    includeAllStatuses?: boolean;
};

type countCategoryParams = {
    status?: "ACTIVE" | "INACTIVE";
};

export async function findCategoryByNameInsensitive(name: string) {
    return prisma.category.findFirst({
        where: {
            name: {
                equals: name,
                mode: "insensitive",
            },
        },
    });
}

export async function findCategoryBySlug(slug: string) {
    return prisma.category.findUnique({
        where: { slug },
    });
}

// Hàm này tìm category theo id để service kiểm tra tồn tại trước khi update hoặc delete.
export async function findCategoryById(categoryId: bigint) {
    return prisma.category.findUnique({
        where: { id: categoryId },
    });
}

export async function createCategoryRecord(data: Prisma.CategoryCreateInput) {
    return prisma.category.create({ data });
}

// Hàm này cập nhật category ở tầng repository để service chỉ tập trung xử lý nghiệp vụ.
export async function updateCategoryRecord(categoryId: bigint, data: Prisma.CategoryUpdateInput) {
    return prisma.category.update({
        where: { id: categoryId },
        data,
    });
}

// Hàm này đếm product đang tham chiếu category để chặn hard delete gây lỗi khóa ngoại.
export async function countProductsByCategoryId(categoryId: bigint) {
    return prisma.product.count({
        where: { categoryId },
    });
}

// Hàm này hard delete category sau khi service đã xác nhận không còn product liên quan.
export async function deleteCategoryRecord(categoryId: bigint) {
    return prisma.category.delete({
        where: { id: categoryId },
    });
}

export async function countCategoryRecords(params: countCategoryParams = {}) {
    return prisma.category.count({
        where: {
            ...(params.status ? { status: params.status } : {}),
        },
    });
}

export async function listCategoryRecords(params: listCategoryParams) {
    const where: Prisma.CategoryWhereInput = {
        ...(params.status ? { status: params.status } : params.includeAllStatuses ? {} : { status: "ACTIVE" }),
        ...(params.q
            ? {
                OR: [
                    {
                        name: {
                            contains: params.q,
                            mode: "insensitive",
                        },
                    },
                    {
                        slug: {
                            contains: params.q,
                            mode: "insensitive",
                        },
                    },
                ],
            }
            : {}),
    };

    return prisma.category.findMany({
        where,
        orderBy: {
            createdAt: "desc",
        },
    });
}
