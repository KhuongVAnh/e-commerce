import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";

type listCategoryParams = {
    q?: string;
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

export async function createCategoryRecord(data: Prisma.CategoryCreateInput) {
    return prisma.category.create({ data });
}

export async function listCategoryRecords(params: listCategoryParams) {
    const where: Prisma.CategoryWhereInput = {
        ...(params.status ? { status: params.status } : { status: "ACTIVE" }),
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
