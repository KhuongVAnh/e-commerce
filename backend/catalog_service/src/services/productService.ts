import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import {
    findPublicProductsByIds,
    findPublicProductDetailById,
    findPublicProductDetailBySlug,
    listPublicProductRecords,
    PublicProductSortBy,
} from "../repositories/productReadRepository";
import { HttpError } from "../utils/https";
import {
    createProductInput,
    listProductQuery,
    publicProductDetailResponse,
    publicProductListItemResponse,
    productImageInput,
    productResponse,
    updateProductInput,
    updateProductStockInput,
} from "../utils/inOutProductAPI";
import {
    buildProductDetailCacheKey,
    buildProductListCacheKey,
    CacheStatus,
    deleteCacheKey,
    deleteCacheRegistry,
    getJsonCache,
    PRODUCT_LIST_CACHE_REGISTRY_KEY,
    readCacheTtl,
    setJsonCache,
} from "./cacheService";

const SELLER_EDITABLE_STATUSES = ["ACTIVE", "INACTIVE", "OUT_OF_STOCK"] as const;
type SellerEditableStatus = (typeof SELLER_EDITABLE_STATUSES)[number];

type ProductWithRelations = Prisma.ProductGetPayload<{
    include: {
        shop: {
            select: {
                id: true;
                name: true;
                slug: true;
            };
        };
        category: {
            select: {
                id: true;
                name: true;
                slug: true;
            };
        };
        images: {
            select: {
                id: true;
                imageUrl: true;
                sortOrder: true;
            };
            orderBy: {
                sortOrder: "asc";
            };
        };
    };
}>;

type PublicProductListRecord = Awaited<ReturnType<typeof listPublicProductRecords>>["products"][number];
type PublicProductDetailRecord = NonNullable<Awaited<ReturnType<typeof findPublicProductDetailById>>>;
type StockMutationResult = {
    id: number;
    stockQuantity: number;
    status: string;
};

const PRODUCT_INCLUDE = {
    shop: {
        select: {
            id: true,
            name: true,
            slug: true,
        },
    },
    category: {
        select: {
            id: true,
            name: true,
            slug: true,
        },
    },
    images: {
        select: {
            id: true,
            imageUrl: true,
            sortOrder: true,
        },
        orderBy: {
            sortOrder: "asc" as const,
        },
    },
} satisfies Prisma.ProductInclude;

const PUBLIC_PRODUCT_SORT_OPTIONS: PublicProductSortBy[] = ["latest", "oldest", "price_asc", "price_desc"];
const PRODUCT_LIST_TTL_SECONDS = readCacheTtl("CACHE_PRODUCT_LIST_TTL_SECONDS", 60);
const PRODUCT_DETAIL_TTL_SECONDS = readCacheTtl("CACHE_PRODUCT_DETAIL_TTL_SECONDS", 60);

function normalizeOptionalText(value?: string): string | null {
    if (typeof value !== "string") {
        return null;
    }

    const trimmed = value.trim();
    return trimmed ? trimmed : null;
}

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

function parsePositiveBigInt(value: string | number, field: string): bigint {
    const asText = String(value ?? "").trim();

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

function parseNonNegativeInteger(value: string | number, field: string): number {
    const parsed = Number(value);

    if (!Number.isInteger(parsed) || parsed < 0) {
        throw new HttpError(400, "Dữ liệu không hợp lệ", {
            code: "VALIDATION_ERROR",
            fieldErrors: [
                {
                    field,
                    message: `${field} phải là số nguyên không âm`,
                },
            ],
        });
    }

    return parsed;
}

function parsePositivePrice(value: string | number): Prisma.Decimal {
    const parsed = Number(value);

    if (!Number.isFinite(parsed) || parsed <= 0) {
        throw new HttpError(400, "Dữ liệu không hợp lệ", {
            code: "VALIDATION_ERROR",
            fieldErrors: [
                {
                    field: "price",
                    message: "Giá phải lớn hơn 0",
                },
            ],
        });
    }

    return new Prisma.Decimal(parsed.toFixed(2));
}

function parseNonNegativePrice(value: string, field: string): Prisma.Decimal {
    const parsed = Number(value);

    if (!Number.isFinite(parsed) || parsed < 0) {
        throw new HttpError(400, "Dữ liệu không hợp lệ", {
            code: "VALIDATION_ERROR",
            fieldErrors: [
                {
                    field,
                    message: `${field} phải là số không âm`,
                },
            ],
        });
    }

    return new Prisma.Decimal(parsed.toFixed(2));
}

function isSellerEditableStatus(value: string): value is SellerEditableStatus {
    return SELLER_EDITABLE_STATUSES.includes(value as SellerEditableStatus);
}

function normalizeImages(images?: productImageInput[]): Array<{ imageUrl: string; sortOrder: number }> {
    if (!images) {
        return [];
    }

    if (!Array.isArray(images)) {
        throw new HttpError(400, "Dữ liệu không hợp lệ", {
            code: "VALIDATION_ERROR",
            fieldErrors: [
                {
                    field: "images",
                    message: "images phải là một mảng",
                },
            ],
        });
    }

    return images.map((item, index) => {
        const url = typeof item?.imageUrl === "string" ? item.imageUrl.trim() : "";

        if (!url) {
            throw new HttpError(400, "Dữ liệu không hợp lệ", {
                code: "VALIDATION_ERROR",
                fieldErrors: [
                    {
                        field: `images[${index}].imageUrl`,
                        message: "imageUrl không được để trống",
                    },
                ],
            });
        }

        const sortOrder = item?.sortOrder ?? index;

        if (!Number.isInteger(sortOrder) || sortOrder < 0) {
            throw new HttpError(400, "Dữ liệu không hợp lệ", {
                code: "VALIDATION_ERROR",
                fieldErrors: [
                    {
                        field: `images[${index}].sortOrder`,
                        message: "sortOrder phải là số nguyên không âm",
                    },
                ],
            });
        }

        return {
            imageUrl: url,
            sortOrder,
        };
    });
}

function buildValidationError(fieldErrors: Array<{ field: string; message: string }>): never {
    throw new HttpError(400, "Dữ liệu không hợp lệ", {
        code: "VALIDATION_ERROR",
        fieldErrors,
    });
}

function assertCreateProductInput(input: createProductInput) {
    const fieldErrors: Array<{ field: string; message: string }> = [];

    const name = typeof input?.name === "string" ? input.name.trim() : "";
    if (!name) {
        fieldErrors.push({
            field: "name",
            message: "Tên sản phẩm không được để trống",
        });
    }

    let shopId: bigint | null = null;
    try {
        shopId = parsePositiveBigInt(input.shopId, "shopId");
    } catch {
        fieldErrors.push({ field: "shopId", message: "shopId không hợp lệ" });
    }

    let categoryId: bigint | null = null;
    try {
        categoryId = parsePositiveBigInt(input.categoryId, "categoryId");
    } catch {
        fieldErrors.push({ field: "categoryId", message: "categoryId không hợp lệ" });
    }

    let price: Prisma.Decimal | null = null;
    try {
        price = parsePositivePrice(input.price);
    } catch {
        fieldErrors.push({ field: "price", message: "Giá phải lớn hơn 0" });
    }

    let stockQuantity = 0;
    if (input.stockQuantity !== undefined) {
        try {
            stockQuantity = parseNonNegativeInteger(input.stockQuantity, "stockQuantity");
        } catch {
            fieldErrors.push({ field: "stockQuantity", message: "stockQuantity phải là số nguyên không âm" });
        }
    }

    let status: SellerEditableStatus | undefined;
    if (input.status !== undefined) {
        if (typeof input.status !== "string" || !isSellerEditableStatus(input.status)) {
            fieldErrors.push({ field: "status", message: "status không hợp lệ" });
        } else {
            status = input.status;
        }
    }

    const images = normalizeImages(input.images);

    if (fieldErrors.length > 0 || !shopId || !categoryId || !price) {
        buildValidationError(fieldErrors);
    }

    return {
        shopId,
        categoryId,
        name,
        description: normalizeOptionalText(input.description),
        price,
        stockQuantity,
        thumbnailUrl: normalizeOptionalText(input.thumbnailUrl),
        status,
        images,
    };
}

function assertUpdateProductInput(input: updateProductInput) {
    const allowedFields = ["categoryId", "name", "description", "price", "stockQuantity", "thumbnailUrl", "status", "images"];
    const hasAtLeastOneField = allowedFields.some((field) => field in input);

    if (!hasAtLeastOneField) {
        buildValidationError([
            {
                field: "body",
                message: "Cần ít nhất một trường để cập nhật",
            },
        ]);
    }

    const fieldErrors: Array<{ field: string; message: string }> = [];

    let categoryId: bigint | undefined;
    if (input.categoryId !== undefined) {
        try {
            categoryId = parsePositiveBigInt(input.categoryId, "categoryId");
        } catch {
            fieldErrors.push({ field: "categoryId", message: "categoryId không hợp lệ" });
        }
    }

    let name: string | undefined;
    if (input.name !== undefined) {
        name = input.name.trim();
        if (!name) {
            fieldErrors.push({ field: "name", message: "Tên sản phẩm không được để trống" });
        }
    }

    let price: Prisma.Decimal | undefined;
    if (input.price !== undefined) {
        try {
            price = parsePositivePrice(input.price);
        } catch {
            fieldErrors.push({ field: "price", message: "Giá phải lớn hơn 0" });
        }
    }

    let stockQuantity: number | undefined;
    if (input.stockQuantity !== undefined) {
        try {
            stockQuantity = parseNonNegativeInteger(input.stockQuantity, "stockQuantity");
        } catch {
            fieldErrors.push({ field: "stockQuantity", message: "stockQuantity phải là số nguyên không âm" });
        }
    }

    let status: SellerEditableStatus | undefined;
    if (input.status !== undefined) {
        if (typeof input.status !== "string" || !isSellerEditableStatus(input.status)) {
            fieldErrors.push({ field: "status", message: "status không hợp lệ" });
        } else {
            status = input.status;
        }
    }

    const images = input.images !== undefined ? normalizeImages(input.images) : undefined;

    if (fieldErrors.length > 0) {
        buildValidationError(fieldErrors);
    }

    return {
        categoryId,
        name,
        description: input.description !== undefined ? normalizeOptionalText(input.description) : undefined,
        price,
        stockQuantity,
        thumbnailUrl: input.thumbnailUrl !== undefined ? normalizeOptionalText(input.thumbnailUrl) : undefined,
        status,
        images,
    };
}

function assertUpdateStockInput(input: updateProductStockInput): { stockQuantity: number } {
    try {
        const stockQuantity = parseNonNegativeInteger(input.stockQuantity, "stockQuantity");
        return { stockQuantity };
    } catch {
        throw new HttpError(400, "Dữ liệu không hợp lệ", {
            code: "VALIDATION_ERROR",
            fieldErrors: [
                {
                    field: "stockQuantity",
                    message: "stockQuantity phải là số nguyên không âm",
                },
            ],
        });
    }
}

async function generateUniqueSlug(name: string, excludeProductId?: bigint): Promise<string> {
    const baseSlug = nameToSlug(name) || "product";
    let candidate = baseSlug;
    let suffix = 1;

    while (true) {
        const existingProduct = await prisma.product.findUnique({
            where: { slug: candidate },
            select: { id: true },
        });

        if (!existingProduct || (excludeProductId !== undefined && existingProduct.id === excludeProductId)) {
            return candidate;
        }

        suffix += 1;
        candidate = `${baseSlug}-${suffix}`;
    }
}

async function assertCategoryExistsAndActive(categoryId: bigint): Promise<void> {
    const category = await prisma.category.findUnique({
        where: { id: categoryId },
        select: { id: true, status: true },
    });

    if (!category) {
        throw new HttpError(404, "Danh mục không tồn tại", {
            code: "CATEGORY_NOT_FOUND",
            hint: "Kiểm tra lại categoryId trước khi thao tác",
        });
    }

    if (category.status !== "ACTIVE") {
        throw new HttpError(400, "Danh mục hiện không hoạt động", {
            code: "CATEGORY_INACTIVE",
            hint: "Chỉ cho phép gán product vào category đang ACTIVE",
        });
    }
}

async function assertShopOwnership(shopId: bigint, sellerId: bigint): Promise<void> {
    const shop = await prisma.shop.findUnique({
        where: { id: shopId },
        select: { id: true, sellerId: true },
    });

    if (!shop) {
        throw new HttpError(404, "Shop không tồn tại", {
            code: "SHOP_NOT_FOUND",
            hint: "Kiểm tra lại shopId trước khi thao tác",
        });
    }

    if (shop.sellerId !== sellerId) {
        throw new HttpError(403, "Bạn không có quyền thao tác product của shop này", {
            code: "SHOP_OWNER_FORBIDDEN",
            hint: "Chỉ seller sở hữu shop mới được tạo và chỉnh sửa product",
        });
    }
}

async function findOwnedProduct(productId: bigint, sellerId: bigint): Promise<ProductWithRelations> {
    const product = await prisma.product.findFirst({
        where: {
            id: productId,
            shop: {
                sellerId,
            },
        },
        include: PRODUCT_INCLUDE,
    });

    if (!product) {
        throw new HttpError(404, "Sản phẩm không tồn tại hoặc bạn không có quyền thao tác", {
            code: "PRODUCT_NOT_FOUND",
            hint: "Kiểm tra lại productId hoặc quyền sở hữu shop",
        });
    }

    return product;
}

function assertProductNotDeleted(product: { status: string; deletedAt: Date | null }): void {
    // Chặn thao tác cập nhật/xóa lại trên product đã soft delete.
    if (product.status === "DELETED" || product.deletedAt) {
        throw new HttpError(409, "Sản phẩm đã bị xóa mềm", {
            code: "PRODUCT_ALREADY_DELETED",
            hint: "Khôi phục sản phẩm trước khi cập nhật hoặc xóa lại",
        });
    }
}

function deriveStatusByStock(
    currentStatus: SellerEditableStatus,
    stockQuantity: number,
): SellerEditableStatus {
    // Product INACTIVE do seller chủ động tắt bán, không tự bật lại theo stock.
    if (currentStatus === "INACTIVE") {
        return "INACTIVE";
    }

    if (stockQuantity === 0) {
        return "OUT_OF_STOCK";
    }

    if (currentStatus === "OUT_OF_STOCK") {
        return "ACTIVE";
    }

    return currentStatus;
}

function isPublicProductSortBy(value: string): value is PublicProductSortBy {
    return PUBLIC_PRODUCT_SORT_OPTIONS.includes(value as PublicProductSortBy);
}

function assertPublicListProductQuery(query: listProductQuery): {
    page: number;
    limit: number;
    shopId?: bigint;
    categoryId?: bigint;
    keyword?: string;
    minPrice?: Prisma.Decimal;
    maxPrice?: Prisma.Decimal;
    sortBy: PublicProductSortBy;
} {
    const fieldErrors: Array<{ field: string; message: string }> = [];

    const rawPage = typeof query.page === "string" ? query.page.trim() : "";
    const rawLimit = typeof query.limit === "string" ? query.limit.trim() : "";
    const rawShopId = typeof query.shopId === "string" ? query.shopId.trim() : "";
    const rawCategoryId = typeof query.categoryId === "string" ? query.categoryId.trim() : "";
    const rawKeyword = typeof query.keyword === "string"
        ? query.keyword.trim()
        : typeof query.q === "string"
            ? query.q.trim()
            : "";
    const rawMinPrice = typeof query.minPrice === "string" ? query.minPrice.trim() : "";
    const rawMaxPrice = typeof query.maxPrice === "string" ? query.maxPrice.trim() : "";
    const rawSortBy = typeof query.sortBy === "string" ? query.sortBy.trim() : "";

    let page = 1;
    if (rawPage) {
        const parsedPage = Number(rawPage);
        if (!Number.isInteger(parsedPage) || parsedPage < 1) {
            fieldErrors.push({
                field: "page",
                message: "page phải là số nguyên dương",
            });
        } else {
            page = parsedPage;
        }
    }

    let limit = 12;
    if (rawLimit) {
        const parsedLimit = Number(rawLimit);
        if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
            fieldErrors.push({
                field: "limit",
                message: "limit phải là số nguyên trong khoảng 1-100",
            });
        } else {
            limit = parsedLimit;
        }
    }

    let shopId: bigint | undefined;
    if (rawShopId) {
        try {
            shopId = parsePositiveBigInt(rawShopId, "shopId");
        } catch {
            fieldErrors.push({
                field: "shopId",
                message: "shopId phải là số nguyên dương",
            });
        }
    }

    let categoryId: bigint | undefined;
    if (rawCategoryId) {
        try {
            categoryId = parsePositiveBigInt(rawCategoryId, "categoryId");
        } catch {
            fieldErrors.push({
                field: "categoryId",
                message: "categoryId phải là số nguyên dương",
            });
        }
    }

    let minPrice: Prisma.Decimal | undefined;
    if (rawMinPrice) {
        try {
            minPrice = parseNonNegativePrice(rawMinPrice, "minPrice");
        } catch {
            fieldErrors.push({
                field: "minPrice",
                message: "minPrice phải là số không âm",
            });
        }
    }

    let maxPrice: Prisma.Decimal | undefined;
    if (rawMaxPrice) {
        try {
            maxPrice = parseNonNegativePrice(rawMaxPrice, "maxPrice");
        } catch {
            fieldErrors.push({
                field: "maxPrice",
                message: "maxPrice phải là số không âm",
            });
        }
    }

    if (minPrice !== undefined && maxPrice !== undefined && minPrice.gt(maxPrice)) {
        fieldErrors.push({
            field: "minPrice",
            message: "minPrice phải nhỏ hơn hoặc bằng maxPrice",
        });
    }

    let sortBy: PublicProductSortBy = "latest";
    if (rawSortBy) {
        if (!isPublicProductSortBy(rawSortBy)) {
            fieldErrors.push({
                field: "sortBy",
                message: `sortBy phải là một trong các giá trị: ${PUBLIC_PRODUCT_SORT_OPTIONS.join(", ")}`,
            });
        } else {
            sortBy = rawSortBy;
        }
    }

    if (fieldErrors.length > 0) {
        throw new HttpError(400, "Dữ liệu không hợp lệ", {
            code: "VALIDATION_ERROR",
            fieldErrors,
        });
    }

    return {
        page,
        limit,
        shopId,
        categoryId,
        keyword: rawKeyword || undefined,
        minPrice,
        maxPrice,
        sortBy,
    };
}

// Hàm này chuyển query đã validate thành object thuần để hash cache không gặp lỗi BigInt.
function normalizePublicProductListCacheQuery(payload: {
    page: number;
    limit: number;
    shopId?: bigint;
    categoryId?: bigint;
    keyword?: string;
    minPrice?: Prisma.Decimal;
    maxPrice?: Prisma.Decimal;
    sortBy: PublicProductSortBy;
}) {
    return {
        page: payload.page,
        limit: payload.limit,
        shopId: payload.shopId !== undefined ? payload.shopId.toString() : null,
        categoryId: payload.categoryId !== undefined ? payload.categoryId.toString() : null,
        keyword: payload.keyword ?? null,
        minPrice: payload.minPrice !== undefined ? payload.minPrice.toFixed(2) : null,
        maxPrice: payload.maxPrice !== undefined ? payload.maxPrice.toFixed(2) : null,
        sortBy: payload.sortBy,
    };
}

function toProductResponse(product: ProductWithRelations): productResponse {
    return {
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
            name: product.shop.name,
            slug: product.shop.slug,
        },
        category: {
            id: Number(product.category.id),
            name: product.category.name,
            slug: product.category.slug,
        },
        images: product.images.map((image) => ({
            id: Number(image.id),
            imageUrl: image.imageUrl,
            sortOrder: image.sortOrder,
        })),
    };
}

function toPublicProductListItemResponse(product: PublicProductListRecord): publicProductListItemResponse {
    return {
        id: Number(product.id),
        shopId: Number(product.shopId),
        categoryId: Number(product.categoryId),
        name: product.name,
        slug: product.slug,
        price: Number(product.price),
        stockQuantity: product.stockQuantity,
        thumbnailUrl: product.thumbnailUrl,
        status: product.status,
    };
}

function parseProductIdList(input: unknown): bigint[] {
    if (!Array.isArray(input)) {
        throw new HttpError(400, "Dữ liệu không hợp lệ", {
            code: "VALIDATION_ERROR",
            fieldErrors: [
                {
                    field: "productIds",
                    message: "productIds phải là một mảng",
                },
            ],
        });
    }

    if (input.length === 0) {
        return [];
    }

    const fieldErrors: Array<{ field: string; message: string }> = [];
    const parsedIds: bigint[] = [];

    for (let index = 0; index < input.length; index += 1) {
        try {
            parsedIds.push(parsePositiveBigInt(input[index] as string | number, `productIds[${index}]`));
        } catch {
            fieldErrors.push({
                field: `productIds[${index}]`,
                message: "productId phải là số nguyên dương",
            });
        }
    }

    if (fieldErrors.length > 0) {
        throw new HttpError(400, "Dữ liệu không hợp lệ", {
            code: "VALIDATION_ERROR",
            fieldErrors,
        });
    }

    return parsedIds;
}

function toPublicProductDetailResponse(product: PublicProductDetailRecord): publicProductDetailResponse {
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
            createdAt: product.createdAt.toISOString(),
            updatedAt: product.updatedAt.toISOString(),
        },
        images: product.images.map((image) => ({
            id: Number(image.id),
            imageUrl: image.imageUrl,
            sortOrder: image.sortOrder,
        })),
        shop: {
            id: Number(product.shop.id),
            name: product.shop.name,
        },
    };
}

// Hàm này xóa product list cache vì mọi thay đổi product/stock đều có thể làm list bị cũ.
async function invalidateProductListCache(): Promise<void> {
    await deleteCacheRegistry(PRODUCT_LIST_CACHE_REGISTRY_KEY);
}

// Hàm này xóa cache detail của một product cụ thể khi product đó thay đổi.
async function invalidateProductDetailCache(productId: string | number | bigint): Promise<void> {
    await deleteCacheKey(buildProductDetailCacheKey(productId));
}

type PublicProductListResponse = {
    products: publicProductListItemResponse[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    filters: {
        keyword: string | null;
        shopId: number | null;
        categoryId: number | null;
        minPrice: number | null;
        maxPrice: number | null;
        sortBy: PublicProductSortBy;
    };
};

// Hàm này trả danh sách product public và cache theo query đã normalize.
export async function listPublicProducts(query: listProductQuery): Promise<PublicProductListResponse & {
    cacheStatus: CacheStatus;
}> {
    const payload = assertPublicListProductQuery(query);
    const normalizedQuery = normalizePublicProductListCacheQuery(payload);
    const cacheKey = buildProductListCacheKey(normalizedQuery);
    const cached = await getJsonCache<PublicProductListResponse>(cacheKey);

    // Cache hit thì trả dữ liệu đã tính sẵn gồm products, pagination và filters.
    if (cached.status === "HIT" && cached.value) {
        return {
            ...cached.value,
            cacheStatus: "HIT",
        };
    }

    const { total, products } = await listPublicProductRecords(payload);
    const totalPages = total === 0 ? 0 : Math.ceil(total / payload.limit);

    const response = {
        products: products.map(toPublicProductListItemResponse),
        pagination: {
            page: payload.page,
            limit: payload.limit,
            total,
            totalPages,
        },
        filters: {
            keyword: payload.keyword ?? null,
            shopId: payload.shopId !== undefined ? Number(payload.shopId) : null,
            categoryId: payload.categoryId !== undefined ? Number(payload.categoryId) : null,
            minPrice: payload.minPrice !== undefined ? Number(payload.minPrice) : null,
            maxPrice: payload.maxPrice !== undefined ? Number(payload.maxPrice) : null,
            sortBy: payload.sortBy,
        },
    };

    // Chỉ cache sau khi DB query thành công để không cache lỗi hoặc dữ liệu chưa hợp lệ.
    await setJsonCache(cacheKey, response, PRODUCT_LIST_TTL_SECONDS, PRODUCT_LIST_CACHE_REGISTRY_KEY);

    return {
        ...response,
        cacheStatus: cached.status,
    };
}

// Hàm này trả chi tiết product public và cache theo product id.
export async function getPublicProductDetail(productIdOrSlug: string): Promise<publicProductDetailResponse & { cacheStatus: CacheStatus }> {
    const isId = /^\d+$/.test(productIdOrSlug);

    let productIdAsBigInt: bigint | null = null;
    let slug: string | null = null;

    if (isId) {
        productIdAsBigInt = parsePositiveBigInt(productIdOrSlug, "id");
    } else {
        slug = productIdOrSlug;
    }

    const cacheKey = isId
        ? buildProductDetailCacheKey(productIdAsBigInt!)
        : `catalog:product:detail:slug:${slug}`;

    const cached = await getJsonCache<publicProductDetailResponse>(cacheKey);

    if (cached.status === "HIT" && cached.value) {
        return {
            ...cached.value,
            cacheStatus: "HIT",
        };
    }

    const product = isId
        ? await findPublicProductDetailById(productIdAsBigInt!)
        : await findPublicProductDetailBySlug(slug!);

    if (!product) {
        throw new HttpError(404, "Sản phẩm không tồn tại", {
            code: "PRODUCT_NOT_FOUND",
            hint: "Kiểm tra lại id hoặc slug sản phẩm",
        });
    }

    const response = toPublicProductDetailResponse(product);

    await setJsonCache(cacheKey, response, PRODUCT_DETAIL_TTL_SECONDS);

    if (!isId) {
        const idCacheKey = buildProductDetailCacheKey(product.id);
        await setJsonCache(idCacheKey, response, PRODUCT_DETAIL_TTL_SECONDS);
    }

    return {
        ...response,
        cacheStatus: cached.status,
    };
}

export async function listPublicProductsByIds(productIdsInput: unknown) {
    const parsedIds = parseProductIdList(productIdsInput);

    if (parsedIds.length === 0) {
        return { products: [] as publicProductListItemResponse[] };
    }

    const uniqueIds = Array.from(new Set(parsedIds.map((id) => id.toString()))).map((id) => BigInt(id));
    const products = await findPublicProductsByIds(uniqueIds);
    const productMap = new Map(products.map((product) => [product.id.toString(), toPublicProductListItemResponse(product)]));

    const missingIds = uniqueIds.filter((id) => !productMap.has(id.toString()));
    if (missingIds.length > 0) {
        throw new HttpError(404, "Sản phẩm không tồn tại", {
            code: "PRODUCT_NOT_FOUND",
            details: missingIds.map((id) => `productId=${id.toString()}`),
            hint: "Kiểm tra lại danh sách productIds",
        });
    }

    const orderedProducts = parsedIds.map((id) => productMap.get(id.toString())!);

    return {
        products: orderedProducts,
    };
}

export async function createProduct(sellerId: string, input: createProductInput) {
    const sellerIdAsBigInt = parsePositiveBigInt(sellerId, "sellerId");
    const payload = assertCreateProductInput(input);

    await assertShopOwnership(payload.shopId, sellerIdAsBigInt);
    await assertCategoryExistsAndActive(payload.categoryId);

    const slug = await generateUniqueSlug(payload.name);
    const status: SellerEditableStatus = payload.status ?? (payload.stockQuantity === 0 ? "OUT_OF_STOCK" : "ACTIVE");

    const createdProduct = await prisma.product.create({
        data: {
            shopId: payload.shopId,
            categoryId: payload.categoryId,
            name: payload.name,
            slug,
            description: payload.description,
            price: payload.price,
            stockQuantity: payload.stockQuantity,
            thumbnailUrl: payload.thumbnailUrl ?? payload.images[0]?.imageUrl ?? null,
            status,
            deletedAt: null,
            images: payload.images.length
                ? {
                    create: payload.images.map((image) => ({
                        imageUrl: image.imageUrl,
                        sortOrder: image.sortOrder,
                    })),
                }
                : undefined,
        },
        include: PRODUCT_INCLUDE,
    });

    // Product mới làm thay đổi mọi danh sách product public nên cần xóa list cache.
    await invalidateProductListCache();

    return {
        product: toProductResponse(createdProduct),
    };
}

export async function updateProduct(sellerId: string, productId: string, input: updateProductInput) {
    const sellerIdAsBigInt = parsePositiveBigInt(sellerId, "sellerId");
    const productIdAsBigInt = parsePositiveBigInt(productId, "productId");
    const payload = assertUpdateProductInput(input);

    const existingProduct = await findOwnedProduct(productIdAsBigInt, sellerIdAsBigInt);
    assertProductNotDeleted(existingProduct);

    if (payload.categoryId !== undefined) {
        await assertCategoryExistsAndActive(payload.categoryId);
    }

    const nextStock = payload.stockQuantity ?? existingProduct.stockQuantity;
    const nextStatus = payload.status
        ?? deriveStatusByStock(existingProduct.status as SellerEditableStatus, nextStock);

    const updatedProduct = await prisma.$transaction(async (tx) => {
        const nextSlug = payload.name
            ? await generateUniqueSlug(payload.name, existingProduct.id)
            : undefined;

        // Nếu client gửi images mới thì thay toàn bộ danh sách ảnh cũ để đảm bảo đồng bộ.
        await tx.product.update({
            where: { id: existingProduct.id },
            data: {
                ...(payload.categoryId !== undefined ? { categoryId: payload.categoryId } : {}),
                ...(payload.name !== undefined ? { name: payload.name } : {}),
                ...(nextSlug !== undefined ? { slug: nextSlug } : {}),
                ...(payload.description !== undefined ? { description: payload.description } : {}),
                ...(payload.price !== undefined ? { price: payload.price } : {}),
                ...(payload.stockQuantity !== undefined ? { stockQuantity: payload.stockQuantity } : {}),
                ...(payload.thumbnailUrl !== undefined
                    ? { thumbnailUrl: payload.thumbnailUrl }
                    : payload.images !== undefined
                        ? { thumbnailUrl: payload.images[0]?.imageUrl ?? null }
                        : {}),
                status: nextStatus,
                ...(payload.images !== undefined
                    ? {
                        images: {
                            deleteMany: {},
                            ...(payload.images.length > 0
                                ? {
                                    create: payload.images.map((image) => ({
                                        imageUrl: image.imageUrl,
                                        sortOrder: image.sortOrder,
                                    })),
                                }
                                : {}),
                        },
                    }
                    : {}),
            },
        });

        return tx.product.findUniqueOrThrow({
            where: { id: existingProduct.id },
            include: PRODUCT_INCLUDE,
        });
    });

    // Product update làm detail và list cache cũ không còn chính xác.
    await invalidateProductDetailCache(existingProduct.id);
    await invalidateProductListCache();

    return {
        product: toProductResponse(updatedProduct),
    };
}

export async function softDeleteProduct(sellerId: string, productId: string) {
    const sellerIdAsBigInt = parsePositiveBigInt(sellerId, "sellerId");
    const productIdAsBigInt = parsePositiveBigInt(productId, "productId");

    const existingProduct = await findOwnedProduct(productIdAsBigInt, sellerIdAsBigInt);
    assertProductNotDeleted(existingProduct);

    const deletedProduct = await prisma.product.update({
        where: {
            id: existingProduct.id,
        },
        data: {
            status: "DELETED",
            deletedAt: new Date(),
        },
        include: PRODUCT_INCLUDE,
    });

    // Soft delete làm product biến mất khỏi public list và detail public.
    await invalidateProductDetailCache(existingProduct.id);
    await invalidateProductListCache();

    return {
        product: toProductResponse(deletedProduct),
    };
}

export async function updateProductStock(sellerId: string, productId: string, input: updateProductStockInput) {
    const sellerIdAsBigInt = parsePositiveBigInt(sellerId, "sellerId");
    const productIdAsBigInt = parsePositiveBigInt(productId, "productId");
    const payload = assertUpdateStockInput(input);

    const existingProduct = await findOwnedProduct(productIdAsBigInt, sellerIdAsBigInt);
    assertProductNotDeleted(existingProduct);

    const nextStatus = deriveStatusByStock(existingProduct.status as SellerEditableStatus, payload.stockQuantity);

    const updatedProduct = await prisma.product.update({
        where: {
            id: existingProduct.id,
        },
        data: {
            stockQuantity: payload.stockQuantity,
            status: nextStatus,
        },
        include: PRODUCT_INCLUDE,
    });

    // Stock nằm trong cả list và detail nên phải xóa cả hai cache sau khi cập nhật.
    await invalidateProductDetailCache(existingProduct.id);
    await invalidateProductListCache();

    return {
        product: toProductResponse(updatedProduct),
        previousStock: existingProduct.stockQuantity,
        currentStock: updatedProduct.stockQuantity,
        updatedAt: updatedProduct.updatedAt.toISOString(),
    };
}

/**
 * Giảm tồn kho nhiều sản phẩm cùng lúc (Internal API dùng cho Commerce Service)
 */
export async function decrementProductsStock(items: Array<{ productId: bigint; quantity: number }>) {
    const results: StockMutationResult[] = await prisma.$transaction(async (tx) => {
        const results: StockMutationResult[] = [];

        for (const item of items) {
            // Stock phải được trừ bằng một câu UPDATE có điều kiện thay vì đọc stock rồi ghi lại.
            // Khi nhiều checkout chạy cùng lúc, database sẽ chỉ cho request còn đủ stock cập nhật thành công;
            // request thua sẽ nhận count=0 và được map thành lỗi INSUFFICIENT_STOCK bên dưới.
            const updatedCount = await tx.product.updateMany({
                where: {
                    id: item.productId,
                    status: "ACTIVE",
                    deletedAt: null,
                    stockQuantity: { gte: item.quantity },
                },
                data: {
                    stockQuantity: { decrement: item.quantity },
                },
            });

            if (updatedCount.count === 0) {
                // Đọc lại product chỉ để trả lỗi đúng nguyên nhân cho client.
                // Không dùng dữ liệu đọc ở đây để quyết định trừ kho, vì quyết định đó đã nằm trong UPDATE atomic phía trên.
                const product = await tx.product.findUnique({
                    where: { id: item.productId },
                    select: { id: true, stockQuantity: true, status: true, deletedAt: true },
                });

                if (!product) {
                    throw new HttpError(404, `Sản phẩm id=${item.productId} không tồn tại`, {
                        code: "PRODUCT_NOT_FOUND",
                    });
                }

                if (product.status !== "ACTIVE" || product.deletedAt) {
                    throw new HttpError(400, `Sản phẩm id=${item.productId} không khả dụng`, {
                        code: "PRODUCT_NOT_AVAILABLE",
                    });
                }

                throw new HttpError(400, `Sản phẩm id=${item.productId} không đủ tồn kho`, {
                    code: "INSUFFICIENT_STOCK",
                });
            }

            const product = await tx.product.findUniqueOrThrow({
                where: { id: item.productId },
                select: { id: true, stockQuantity: true, status: true, deletedAt: true },
            });

            const newStatus = deriveStatusByStock(product.status as SellerEditableStatus, product.stockQuantity);

            const updated = await tx.product.update({
                where: { id: item.productId },
                data: {
                    status: newStatus,
                },
                select: {
                    id: true,
                    stockQuantity: true,
                    status: true,
                },
            });

            results.push({
                id: Number(updated.id),
                stockQuantity: updated.stockQuantity,
                status: updated.status,
            });
        }

        return results;
    });

    // Internal stock decrement đến từ Commerce cũng làm cache product bị cũ.
    await Promise.all(results.map((product) => invalidateProductDetailCache(product.id)));
    await invalidateProductListCache();

    return results;
}

/**
 * Hoàn lại tồn kho nhiều sản phẩm (Internal API)
 */
export async function incrementProductsStock(items: Array<{ productId: bigint; quantity: number }>) {
    const results: StockMutationResult[] = await prisma.$transaction(async (tx) => {
        const results: StockMutationResult[] = [];

        for (const item of items) {
            const product = await tx.product.findUnique({
                where: { id: item.productId },
                select: { id: true, stockQuantity: true, status: true, deletedAt: true },
            });

            if (!product) continue; // Hoặc throw lỗi tùy logic
            if (product.status === "DELETED" || product.deletedAt) continue;

            const newStock = product.stockQuantity + item.quantity;
            const newStatus = deriveStatusByStock(product.status as SellerEditableStatus, newStock);

            const updated = await tx.product.update({
                where: { id: item.productId },
                data: {
                    stockQuantity: newStock,
                    status: newStatus,
                },
                select: {
                    id: true,
                    stockQuantity: true,
                    status: true,
                },
            });

            results.push({
                id: Number(updated.id),
                stockQuantity: updated.stockQuantity,
                status: updated.status,
            });
        }

        return results;
    });

    // Internal stock increment khi hủy đơn cần xóa cache để stock hiển thị lại đúng.
    await Promise.all(results.map((product) => invalidateProductDetailCache(product.id)));
    await invalidateProductListCache();

    return results;
}
