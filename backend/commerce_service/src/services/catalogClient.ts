import { HttpError } from "../utils/http";
import "../config/env";
// Đây là client đơn giản để gọi Catalog Service

// cấu trúc dữ liệu sản phẩm mà Commerce Service cần từ Catalog Service
export type CatalogProduct = {
    id: string;
    shopId: string;
    name: string;
    price: string;
    stockQuantity: number;
    thumbnailUrl?: string | null;
    status: "ACTIVE" | "INACTIVE" | "OUT_OF_STOCK";
};

const catalogBaseUrl = process.env.CATALOG_SERVICE_URL || "http://localhost:3002";
const normalizedCatalogBaseUrl = catalogBaseUrl.replace(/\/+$/, "");
const catalogApiBaseUrl = normalizedCatalogBaseUrl.endsWith("/api/catalog")
    ? normalizedCatalogBaseUrl
    : `${normalizedCatalogBaseUrl}/api/catalog`;

export async function getProductById(productId: bigint): Promise<CatalogProduct> {
    const response = await fetch(`${catalogApiBaseUrl}/products/${productId.toString()}`);

    if (response.status === 404) {
        throw new HttpError(400, "Sản phẩm không tồn tại", {
            code: "PRODUCT_NOT_FOUND",
            hint: "Chọn sản phẩm khác",
        });
    }

    if (!response.ok) {
        throw new HttpError(502, "Catalog Service is unavailable", {
            code: "CATALOG_SERVICE_ERROR",
            hint: "Try again later",
        });
    }

    const body = await response.json();
    return body.data?.product ?? body.data ?? body;
}

export async function getProductsByIds(productIds: bigint[]): Promise<CatalogProduct[]> {
    if (productIds.length === 0) {
        return [];
    }

    const response = await fetch(`${catalogApiBaseUrl}/products/by-ids`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            productIds: productIds.map((id) => id.toString()),
        }),
    });

    if (response.status === 404) {
        throw new HttpError(400, "Sản phẩm không tồn tại", {
            code: "PRODUCT_NOT_FOUND",
            hint: "Chọn sản phẩm khác",
        });
    }

    if (!response.ok) {
        throw new HttpError(502, "Catalog Service is unavailable", {
            code: "CATALOG_SERVICE_ERROR",
            hint: "Try again later",
        });
    }

    const body = await response.json();
    return body.data?.products ?? body.data ?? body;
}

// hàm lấy shopId của product, dùng để kiểm tra khi checkout phải cùng shop
export async function getShopIdByProductId(productId: bigint): Promise<bigint> {
    const product = await getProductById(productId);
    return BigInt(product.shopId);
}

// hàm lấy shopId của seller, dùng để kiểm tra khi checkout phải cùng shop hoặc khi tạo đơn hàng để gắn shopId vào đơn
export async function getShopIdBySellerId(sellerId: string): Promise<string | null> {
    try {
        const response = await fetch(`${catalogApiBaseUrl}/shops/internal/by-seller/${sellerId}`);

        if (!response.ok) {
            console.error(`[auth_service] Catalog Service error: ${response.status}`);
            return null;
        }

        const body = await response.json();
        const shop = body.data?.shop ?? body.data ?? body;
        
        return shop?.id ? shop.id.toString() : null;
    } catch (error) {
        console.error("[auth_service] Failed to call Catalog Service:", error);
        return null;
    }
}

// Hàm gọi Catalog Service để giảm tồn kho sản phẩm khi tạo đơn hàng thành công, hoặc tăng lại khi hủy đơn hàng
export async function decrementProductsStock(items: Array<{ productId: bigint; quantity: number }>): Promise<void> {
    const response = await fetch(`${catalogApiBaseUrl}/internal/products/decrement-stock`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            items: items.map((item) => ({
                productId: item.productId.toString(),
                quantity: item.quantity,
            })),
        }),
    });

    if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new HttpError(response.status === 400 ? 400 : 502, body.message || "Failed to decrement stock", {
            code: body.error?.code || "STOCK_DECREMENT_FAILED",
            details: body.error?.details || body.message,
        });
    }
}

// Hàm gọi Catalog Service để tăng tồn kho sản phẩm khi hủy đơn hàng
export async function incrementProductsStock(items: Array<{ productId: bigint; quantity: number }>): Promise<void> {
    const response = await fetch(`${catalogApiBaseUrl}/internal/products/increment-stock`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            items: items.map((item) => ({
                productId: item.productId.toString(),
                quantity: item.quantity,
            })),
        }),
    });

    if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new HttpError(502, body.message || "Failed to increment stock", {
            code: body.error?.code || "STOCK_INCREMENT_FAILED",
            details: body.error?.details || body.message,
        });
    }
}

