import { Prisma } from "@prisma/client";
import {
    createCategoryRecord,
    countCategoryRecords,
    countProductsByCategoryId,
    deleteCategoryRecord,
    findCategoryById,
    findCategoryByNameInsensitive,
    findCategoryBySlug,
    listCategoryRecords,
    updateCategoryRecord,
} from "../repositories/categoryRepository";
import {
    buildCategoryListCacheKey,
    CATEGORY_LIST_CACHE_REGISTRY_KEY,
    CacheStatus,
    deleteCacheRegistry,
    getJsonCache,
    PRODUCT_LIST_CACHE_REGISTRY_KEY,
    readCacheTtl,
    setJsonCache,
} from "./cacheService";
import { HttpError } from "../utils/https";
import {
    categoryResponse,
    createCategoryInput,
    deleteCategoryResponse,
    listCategoryQuery,
    updateCategoryInput,
} from "../utils/inOutCategoryAPI";

const ALLOWED_CATEGORY_STATUSES = ["ACTIVE", "INACTIVE"] as const;
type AllowedCategoryStatus = (typeof ALLOWED_CATEGORY_STATUSES)[number];
type CategoryListStatus = AllowedCategoryStatus | "ALL";

const CATEGORY_LIST_TTL_SECONDS = readCacheTtl("CACHE_CATEGORY_LIST_TTL_SECONDS", 300);

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

// Hàm này validate body tạo category để dữ liệu vào DB luôn có name và status hợp lệ.
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

// Hàm này validate body update category, cho phép sửa từng phần nhưng không cho body rỗng.
function assertUpdateCategoryInput(input: updateCategoryInput): {
    name?: string;
    status?: AllowedCategoryStatus;
} {
    const fieldErrors: Array<{ field: string; message: string }> = [];

    // Body update phải là object để các kiểm tra field phía dưới không ném lỗi runtime.
    if (!input || typeof input !== "object" || Array.isArray(input)) {
        throw new HttpError(400, "Dữ liệu không hợp lệ", {
            code: "VALIDATION_ERROR",
            fieldErrors: [
                {
                    field: "body",
                    message: "Body phải là object chứa name hoặc status",
                },
            ],
        });
    }

    const hasAtLeastOneField = "name" in input || "status" in input;

    // Body rỗng bị chặn để tránh request thành công nhưng không thay đổi dữ liệu nào.
    if (!hasAtLeastOneField) {
        throw new HttpError(400, "Dữ liệu không hợp lệ", {
            code: "VALIDATION_ERROR",
            fieldErrors: [
                {
                    field: "body",
                    message: "Cần ít nhất một trường để cập nhật",
                },
            ],
        });
    }

    let name: string | undefined;
    if (input.name !== undefined) {
        name = typeof input.name === "string" ? input.name.trim() : "";

        // Name nếu được gửi lên thì không được rỗng vì nó là dữ liệu định danh chính của category.
        if (!name) {
            fieldErrors.push({
                field: "name",
                message: "Tên danh mục không được để trống",
            });
        }
    }

    let status: AllowedCategoryStatus | undefined;
    if (input.status !== undefined) {
        const statusRaw = typeof input.status === "string" ? input.status.trim() : "";

        // Status chỉ nhận enum đã thống nhất để API không ghi giá trị ngoài nghiệp vụ vào DB.
        if (!isAllowedCategoryStatus(statusRaw)) {
            fieldErrors.push({
                field: "status",
                message: "status phải là ACTIVE hoặc INACTIVE",
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

// Hàm này parse id dạng string sang bigint để dùng thống nhất với schema Prisma.
function parsePositiveBigInt(value: string | number, field: string): bigint {
    const asText = String(value ?? "").trim();

    // Regex giúp loại bỏ số âm, số thập phân và chuỗi không phải số trước khi gọi BigInt.
    if (!asText || !/^\d+$/.test(asText)) {
        throw new HttpError(400, "Dữ liệu không hợp lệ", {
            code: "VALIDATION_ERROR",
            fieldErrors: [
                {
                    field,
                    message: `${field} phải là số nguyên dương`,
                },
            ],
        });
    }

    const parsed = BigInt(asText);

    // Id bằng 0 không hợp lệ vì các bảng đang dùng autoincrement bắt đầu từ số dương.
    if (parsed <= 0n) {
        throw new HttpError(400, "Dữ liệu không hợp lệ", {
            code: "VALIDATION_ERROR",
            fieldErrors: [
                {
                    field,
                    message: `${field} phải là số nguyên dương`,
                },
            ],
        });
    }

    return parsed;
}

// Hàm này chuẩn hóa query category để cache key không phụ thuộc vào field dư thừa từ request.
function normalizeCategoryListQuery(params: { q?: string; status?: CategoryListStatus }) {
    return {
        q: params.q ?? null,
        status: params.status ?? null,
    };
}

function assertListCategoryQuery(query: listCategoryQuery): {
    q?: string;
    status?: CategoryListStatus;
} {
    const fieldErrors: Array<{ field: string; message: string }> = [];

    const q = typeof query.q === "string" && query.q.trim() ? query.q.trim() : undefined;
    const rawStatus = typeof query.status === "string" && query.status.trim()
        ? query.status.trim()
        : undefined;

    let status: CategoryListStatus | undefined;

    if (rawStatus !== undefined) {
        if (rawStatus === "ALL") {
            status = rawStatus;
        } else if (!isAllowedCategoryStatus(rawStatus)) {
            fieldErrors.push({
                field: "status",
                message: "status phải là ACTIVE, INACTIVE hoặc ALL",
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

// Hàm này tạo slug không trùng, có thể bỏ qua chính category hiện tại khi update name.
async function generateUniqueSlug(name: string, excludeCategoryId?: bigint): Promise<string> {
    const baseSlug = nameToSlug(name) || "category";
    let candidate = baseSlug;
    let suffix = 1;

    while (true) {
        const existingCategory = await findCategoryBySlug(candidate);

        // Khi update, slug hiện tại của chính category không bị xem là trùng.
        if (!existingCategory || existingCategory.id === excludeCategoryId) {
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

// Hàm này gom logic xóa category cache để các mutation gọi một nơi nhất quán.
async function invalidateCategoryListCache(): Promise<void> {
    await deleteCacheRegistry(CATEGORY_LIST_CACHE_REGISTRY_KEY);
}

// Hàm này xóa product list cache khi category thay đổi có thể làm filter/list product bị cũ.
async function invalidateProductListCache(): Promise<void> {
    await deleteCacheRegistry(PRODUCT_LIST_CACHE_REGISTRY_KEY);
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

        // Redis đang lưu nhiều key list theo query, ví dụ catalog:categories:list:{hash} -> JSON array category.
        // Khi tạo category mới, không biết chính xác list query nào cần chèn item nên xóa list cache để lần đọc sau build lại từ DB.
        await invalidateCategoryListCache();

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

// Hàm này trả danh sách category public/admin và cache theo query đã normalize.
export async function listCategories(query: listCategoryQuery): Promise<{
    categories: categoryResponse[];
    cacheStatus: CacheStatus;
}> {
    const params = assertListCategoryQuery(query);
    const normalizedQuery = normalizeCategoryListQuery(params);
    const cacheKey = buildCategoryListCacheKey(normalizedQuery);
    const cached = await getJsonCache<categoryResponse[]>(cacheKey);

    // Cache hit thì trả ngay dữ liệu Redis để tránh query DB lặp lại.
    if (cached.status === "HIT" && cached.value) {
        return {
            categories: cached.value,
            cacheStatus: "HIT",
        };
    }

    const categories = await listCategoryRecords({
        q: params.q,
        status: params.status === "ALL" ? undefined : params.status,
        includeAllStatuses: params.status === "ALL",
    });
    const response = categories.map(toCategoryResponse);

    // Chỉ ghi cache sau khi query DB thành công để không cache lỗi validation hoặc lỗi hệ thống.
    await setJsonCache(cacheKey, response, CATEGORY_LIST_TTL_SECONDS, CATEGORY_LIST_CACHE_REGISTRY_KEY);

    return {
        categories: response,
        cacheStatus: cached.status,
    };
}

export async function getCategoryStats() {
    const [total, active, inactive] = await Promise.all([
        countCategoryRecords(),
        countCategoryRecords({ status: "ACTIVE" }),
        countCategoryRecords({ status: "INACTIVE" }),
    ]);

    return {
        total,
        statuses: {
            ACTIVE: active,
            INACTIVE: inactive,
        },
    };
}

// Hàm này cập nhật category và đồng bộ cache sau khi dữ liệu DB thay đổi thành công.
export async function updateCategory(categoryId: string, input: updateCategoryInput) {
    const categoryIdAsBigInt = parsePositiveBigInt(categoryId, "categoryId");
    const payload = assertUpdateCategoryInput(input);
    const existingCategory = await findCategoryById(categoryIdAsBigInt);

    // Không tìm thấy category thì trả 404 rõ ràng thay vì để Prisma throw lỗi kỹ thuật.
    if (!existingCategory) {
        throw new HttpError(404, "Danh mục không tồn tại", {
            code: "CATEGORY_NOT_FOUND",
            hint: "Kiểm tra lại categoryId trước khi thao tác",
        });
    }

    if (payload.name !== undefined) {
        const existingCategoryByName = await findCategoryByNameInsensitive(payload.name);

        // Name là unique, nên nếu thuộc category khác thì phải chặn trước khi update.
        if (existingCategoryByName && existingCategoryByName.id !== categoryIdAsBigInt) {
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
    }

    const nextSlug = payload.name !== undefined
        ? await generateUniqueSlug(payload.name, categoryIdAsBigInt)
        : undefined;

    try {
        const category = await updateCategoryRecord(categoryIdAsBigInt, {
            ...(payload.name !== undefined ? { name: payload.name } : {}),
            ...(nextSlug !== undefined ? { slug: nextSlug } : {}),
            ...(payload.status !== undefined ? { status: payload.status } : {}),
        });

        // Update category có thể ảnh hưởng category list và product list theo filter category.
        await invalidateCategoryListCache();
        await invalidateProductListCache();

        return {
            category: toCategoryResponse(category),
        };
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            throw new HttpError(409, "Danh mục bị trùng dữ liệu unique", {
                code: "CATEGORY_UNIQUE_CONSTRAINT_FAILED",
                hint: "Kiểm tra lại name hoặc slug của danh mục",
            });
        }

        throw error;
    }
}

// Hàm này hard delete category chỉ khi category không còn product tham chiếu.
export async function deleteCategory(categoryId: string): Promise<deleteCategoryResponse> {
    const categoryIdAsBigInt = parsePositiveBigInt(categoryId, "categoryId");
    const existingCategory = await findCategoryById(categoryIdAsBigInt);

    // Trả 404 nếu category không tồn tại để client biết không có dữ liệu để xóa.
    if (!existingCategory) {
        throw new HttpError(404, "Danh mục không tồn tại", {
            code: "CATEGORY_NOT_FOUND",
            hint: "Kiểm tra lại categoryId trước khi thao tác",
        });
    }

    const productCount = await countProductsByCategoryId(categoryIdAsBigInt);

    // Không xóa category đang có product để tránh mất quan hệ và lỗi khóa ngoại.
    if (productCount > 0) {
        throw new HttpError(409, "Không thể xóa danh mục đang có sản phẩm", {
            code: "CATEGORY_HAS_PRODUCTS",
            details: [`Category id=${categoryIdAsBigInt.toString()} đang có ${productCount} sản phẩm`],
            hint: "Chuyển sản phẩm sang danh mục khác trước khi xóa",
        });
    }

    try {
        const deletedCategory = await deleteCategoryRecord(categoryIdAsBigInt);

        // Delete category làm category list và product list theo filter category không còn chính xác.
        await invalidateCategoryListCache();
        await invalidateProductListCache();

        return {
            deleted: true,
            category: toCategoryResponse(deletedCategory),
        };
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
            throw new HttpError(409, "Không thể xóa danh mục đang có sản phẩm", {
                code: "CATEGORY_HAS_PRODUCTS",
                hint: "Chuyển sản phẩm sang danh mục khác trước khi xóa",
            });
        }

        throw error;
    }
}
