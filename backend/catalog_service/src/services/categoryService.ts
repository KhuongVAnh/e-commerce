import { Prisma } from "@prisma/client";
import {
    createCategoryRecord,
    findCategoryByNameInsensitive,
    findCategoryBySlug,
    listCategoryRecords,
} from "../repositories/categoryRepository";
import { HttpError } from "../utils/https";
import {
    categoryResponse,
    createCategoryInput,
    listCategoryQuery,
} from "../utils/inOutCategoryAPI";

const ALLOWED_CATEGORY_STATUSES = ["ACTIVE", "INACTIVE"] as const;
type AllowedCategoryStatus = (typeof ALLOWED_CATEGORY_STATUSES)[number];

function nameToSlug(value: string): string {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
}

function isAllowedCategoryStatus(value: string): value is AllowedCategoryStatus {
    return ALLOWED_CATEGORY_STATUSES.includes(value as AllowedCategoryStatus);
}

function assertCreateCategoryInput(input: createCategoryInput): {
    name: string;
    status: AllowedCategoryStatus;
} {
    const fieldErrors: Array<{ field: string; message: string }> = [];

    const name = typeof input?.name === "string" ? input.name.trim() : "";
    if (!name) {
        fieldErrors.push({
            field: "name",
            message: "Tên danh mục không được để trống",
        });
    }

    const statusRaw = typeof input?.status === "string" ? input.status.trim() : "";
    let status: AllowedCategoryStatus = "ACTIVE";

    if (statusRaw) {
        if (!isAllowedCategoryStatus(statusRaw)) {
            fieldErrors.push({
                field: "status",
                message: "status không hợp lệ",
            });
        } else {
            status = statusRaw;
        }
    }

    if (fieldErrors.length > 0) {
        throw new HttpError(400, "Dữ liệu không hợp lệ", {
            code: "VALIDATION_ERROR",
            fieldErrors,
        });
    }

    return {
        name,
        status,
    };
}

function assertListCategoryQuery(query: listCategoryQuery): {
    q?: string;
    status?: AllowedCategoryStatus;
} {
    const fieldErrors: Array<{ field: string; message: string }> = [];

    const q = typeof query.q === "string" && query.q.trim() ? query.q.trim() : undefined;
    const rawStatus = typeof query.status === "string" && query.status.trim()
        ? query.status.trim()
        : undefined;

    let status: AllowedCategoryStatus | undefined;

    if (rawStatus !== undefined) {
        if (!isAllowedCategoryStatus(rawStatus)) {
            fieldErrors.push({
                field: "status",
                message: "status phải là ACTIVE hoặc INACTIVE",
            });
        } else {
            status = rawStatus;
        }
    }

    if (fieldErrors.length > 0) {
        throw new HttpError(400, "Dữ liệu không hợp lệ", {
            code: "VALIDATION_ERROR",
            fieldErrors,
        });
    }

    return {
        q,
        status,
    };
}

async function generateUniqueSlug(name: string): Promise<string> {
    const baseSlug = nameToSlug(name) || "category";
    let candidate = baseSlug;
    let suffix = 1;

    while (true) {
        const existingCategory = await findCategoryBySlug(candidate);

        if (!existingCategory) {
            return candidate;
        }

        suffix += 1;
        candidate = `${baseSlug}-${suffix}`;
    }
}

function toCategoryResponse(category: {
    id: bigint;
    name: string;
    slug: string;
    status: string;
}): categoryResponse {
    return {
        id: Number(category.id),
        name: category.name,
        slug: category.slug,
        status: category.status,
    };
}

export async function createCategory(input: createCategoryInput) {
    const payload = assertCreateCategoryInput(input);

    const existingCategoryByName = await findCategoryByNameInsensitive(payload.name);
    if (existingCategoryByName) {
        throw new HttpError(409, "Tên danh mục đã tồn tại", {
            code: "CATEGORY_NAME_ALREADY_EXISTS",
            fieldErrors: [
                {
                    field: "name",
                    message: "Tên danh mục đã tồn tại",
                },
            ],
            hint: "Hãy chọn tên danh mục khác",
        });
    }

    const slug = await generateUniqueSlug(payload.name);

    try {
        const category = await createCategoryRecord({
            name: payload.name,
            slug,
            status: payload.status,
        });

        return {
            category: toCategoryResponse(category),
        };
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            const target = Array.isArray(error.meta?.target) ? error.meta?.target.join(",") : String(error.meta?.target || "");

            if (target.includes("name")) {
                throw new HttpError(409, "Tên danh mục đã tồn tại", {
                    code: "CATEGORY_NAME_ALREADY_EXISTS",
                    fieldErrors: [
                        {
                            field: "name",
                            message: "Tên danh mục đã tồn tại",
                        },
                    ],
                });
            }

            if (target.includes("slug")) {
                throw new HttpError(409, "Slug danh mục đã tồn tại", {
                    code: "CATEGORY_SLUG_ALREADY_EXISTS",
                    fieldErrors: [
                        {
                            field: "name",
                            message: "Slug bị trùng, vui lòng đổi tên danh mục",
                        },
                    ],
                });
            }
        }

        throw error;
    }
}

export async function listCategories(query: listCategoryQuery) {
    const params = assertListCategoryQuery(query);
    const categories = await listCategoryRecords(params);

    return categories.map(toCategoryResponse);
}
