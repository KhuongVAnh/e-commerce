import { createHash } from "crypto";
import { createClient } from "redis";

/*
 * Cấu trúc key-value Redis mà Catalog Service đang dùng:
 *
 * 1. Product list cache
 *    Key: catalog:products:list:{hashQuery}
 *    Value JSON:
 *    {
 *      "products": [
 *        {
 *          "id": 1,
 *          "shopId": 2,
 *          "categoryId": 3,
 *          "name": "Áo thun",
 *          "slug": "ao-thun",
 *          "price": 120000,
 *          "stockQuantity": 10,
 *          "thumbnailUrl": "https://...",
 *          "status": "ACTIVE"
 *        }
 *      ],
 *      "pagination": { "page": 1, "limit": 12, "total": 30, "totalPages": 3 },
 *      "filters": { "keyword": null, "shopId": null, "categoryId": null, "sortBy": "latest" }
 *    }
 * ví dụ:
 * catalog:products:list:{hash của page=1, categoryId=3}
 * catalog:products:list:{hash của page=2, categoryId=3}
 * catalog:products:list:{hash của keyword=ao, sortBy=price_asc}
 *
 * 2. Product detail cache
 *    Key: catalog:product:detail:{productId}
 *    Value JSON:
 *    {
 *      "product": {
 *        "id": 1,
 *        "shopId": 2,
 *        "categoryId": 3,
 *        "name": "Áo thun",
 *        "slug": "ao-thun",
 *        "description": "Mô tả sản phẩm",
 *        "price": 120000,
 *        "stockQuantity": 10,
 *        "thumbnailUrl": "https://...",
 *        "status": "ACTIVE",
 *        "createdAt": "2026-05-16T00:00:00.000Z",
 *        "updatedAt": "2026-05-16T00:00:00.000Z"
 *      },
 *      "images": [{ "id": 1, "imageUrl": "https://...", "sortOrder": 0 }],
 *      "shop": { "id": 2, "name": "Shop ABC" }
 *    }
 *
 * 3. Category list cache
 *    Key: catalog:categories:list:{hashQuery}
 *    Value JSON:
 *    [
 *      { "id": 1, "name": "Thời trang", "slug": "thoi-trang", "status": "ACTIVE" }
 *    ]
 *
 * 4. Registry key: danh bạ chứa các key của cache để dễ dàng xóa hàng loạt khi dữ liệu thay đổi mà không cần dùng lệnh KEYS tốn kém.
 *    Key: catalog:products:list:keys
 *    Value Redis Set: ["catalog:products:list:abc123", "catalog:products:list:def456",...]
 *
 *    Key: catalog:categories:list:keys
 *    Value Redis Set: ["catalog:categories:list:abc123", "catalog:categories:list:def456",...]
 */

export type CacheStatus = "HIT" | "MISS" | "BYPASS";

type RedisClient = ReturnType<typeof createClient>;

const DEFAULT_REDIS_URL = "redis://localhost:6379";
const CACHE_ENABLED = process.env.CACHE_ENABLED !== "false";
const REDIS_URL = process.env.REDIS_URL || DEFAULT_REDIS_URL;

export const PRODUCT_LIST_CACHE_REGISTRY_KEY = "catalog:products:list:keys";
export const CATEGORY_LIST_CACHE_REGISTRY_KEY = "catalog:categories:list:keys";

let redisClient: RedisClient | null = null;
let redisConnectionPromise: Promise<RedisClient | null> | null = null;

// Hàm này chuẩn hóa object theo thứ tự key để cùng một query luôn sinh ra cùng một cache key.
export function stableHash(value: unknown): string {
    const normalized = JSON.stringify(sortObjectKeys(value));
    return createHash("sha1").update(normalized).digest("hex");
}

// Hàm này tạo key cho product list dựa trên query đã normalize để phân biệt từng bộ lọc.
export function buildProductListCacheKey(normalizedQuery: unknown): string {
    return `catalog:products:list:${stableHash(normalizedQuery)}`;
}

// Hàm này tạo key chi tiết product theo id vì detail chỉ phụ thuộc vào một product cụ thể.
export function buildProductDetailCacheKey(productId: string | number | bigint): string {
    return `catalog:product:detail:${productId.toString()}`;
}

// Hàm này tạo key cho category list dựa trên query đã normalize để hỗ trợ q/status khác nhau.
export function buildCategoryListCacheKey(normalizedQuery: unknown): string {
    return `catalog:categories:list:${stableHash(normalizedQuery)}`;
}

// Hàm này đọc số TTL từ env và fallback về giá trị mặc định khi env thiếu hoặc không hợp lệ.
export function readCacheTtl(envName: string, defaultValue: number): number {
    const parsed = Number(process.env[envName]);

    // Nếu TTL không phải số nguyên dương thì dùng default để tránh cache vĩnh viễn ngoài ý muốn.
    if (!Number.isInteger(parsed) || parsed <= 0) {
        return defaultValue;
    }

    return parsed;
}

// Hàm này lấy JSON từ Redis; nếu Redis lỗi thì trả BYPASS để caller tự query database.
export async function getJsonCache<T>(key: string): Promise<{ status: CacheStatus; value: T | null }> {
    const client = await getRedisClient();

    // Khi Redis bị tắt hoặc lỗi kết nối, hệ thống bỏ qua cache và không làm hỏng API chính.
    if (!client) {
        return { status: "BYPASS", value: null };
    }

    try {
        const cached = await client.get(key);

        // Redis trả null nghĩa là cache miss và caller cần query database.
        if (!cached) {
            return { status: "MISS", value: null };
        }

        return { status: "HIT", value: JSON.parse(cached) as T };
    } catch (error) {
        console.warn("[catalog_service] Redis get failed:", error);
        return { status: "BYPASS", value: null };
    }
}

// Hàm này lưu JSON vào Redis, đồng thời có thể ghi key vào registry để invalidate theo nhóm.
export async function setJsonCache(
    key: string,
    value: unknown,
    ttlSeconds: number,
    registryKey?: string,
): Promise<void> {
    const client = await getRedisClient();

    // Nếu Redis không khả dụng thì bỏ qua thao tác set vì dữ liệu DB vẫn là nguồn sự thật.
    if (!client) {
        return;
    }

    try {
        await client.set(key, JSON.stringify(value), { EX: ttlSeconds });

        // Registry lưu danh sách key cache dạng list để xóa hàng loạt mà không dùng lệnh KEYS.
        if (registryKey) {
            await client.sAdd(registryKey, key);
        }
    } catch (error) {
        console.warn("[catalog_service] Redis set failed:", error);
    }
}

// Hàm này xóa một key cache cụ thể, dùng cho product detail khi biết chính xác id.
export async function deleteCacheKey(key: string): Promise<void> {
    const client = await getRedisClient();

    // Không có Redis client thì coi như không có cache cần xóa.
    if (!client) {
        return;
    }

    try {
        await client.del(key);
    } catch (error) {
        console.warn("[catalog_service] Redis delete key failed:", error);
    }
}

// Hàm này xóa toàn bộ cache list đã đăng ký trong registry, tránh dùng KEYS gây nặng Redis.
export async function deleteCacheRegistry(registryKey: string): Promise<void> {
    const client = await getRedisClient();

    // Nếu Redis không khả dụng thì bỏ qua invalidate vì cache cũng không được dùng.
    if (!client) {
        return;
    }

    try {
        const keys = await client.sMembers(registryKey);

        // Nếu registry rỗng thì chỉ cần đảm bảo registry key được xóa sạch.
        if (keys.length > 0) {
            await client.del(keys);
        }

        await client.del(registryKey);
    } catch (error) {
        console.warn("[catalog_service] Redis delete registry failed:", error);
    }
}

// Hàm này mở kết nối Redis một lần và tái sử dụng cho các request sau.
async function getRedisClient(): Promise<RedisClient | null> {
    // CACHE_ENABLED=false cho phép tắt cache bằng env khi test hoặc khi chưa có Redis.
    if (!CACHE_ENABLED) {
        return null;
    }

    // Nếu client đã mở kết nối thì dùng lại để tránh tạo connection mới mỗi request.
    if (redisClient?.isOpen) {
        return redisClient;
    }

    // Promise dùng chung giúp nhiều request đồng thời không cùng lúc tạo nhiều kết nối Redis.
    if (!redisConnectionPromise) {
        redisConnectionPromise = connectRedis();
    }

    return redisConnectionPromise;
}

// Hàm này kết nối Redis theo kiểu fail-open, lỗi chỉ được log và caller sẽ fallback DB.
async function connectRedis(): Promise<RedisClient | null> {
    const client = createClient({ url: REDIS_URL });

    // Event error có thể bắn sau khi connect, cần log để debug nhưng không throw ra request.
    client.on("error", (error) => {
        console.warn("[catalog_service] Redis connection error:", error);
    });

    try {
        await client.connect();
        redisClient = client;
        return client;
    } catch (error) {
        console.warn("[catalog_service] Redis connect failed:", error);
        redisConnectionPromise = null;
        return null;
    }
}

// Hàm này sắp xếp key lồng nhau để JSON.stringify không phụ thuộc thứ tự field ban đầu.
function sortObjectKeys(value: unknown): unknown {
    if (Array.isArray(value)) {
        return value.map(sortObjectKeys);
    }

    if (value && typeof value === "object") {
        const input = value as Record<string, unknown>;
        return Object.keys(input)
            .sort()
            .reduce<Record<string, unknown>>((result, key) => {
                result[key] = sortObjectKeys(input[key]);
                return result;
            }, {});
    }

    return value;
}
