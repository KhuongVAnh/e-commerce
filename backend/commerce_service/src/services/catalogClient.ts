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

export async function getProductById(productId: bigint): Promise<CatalogProduct> {
    const response = await fetch(`${catalogBaseUrl}/products/${productId.toString()}`);

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

// N+1 query, fix sau
export async function getProductsByIds(productIds: bigint[]): Promise<CatalogProduct[]> {
    const products = await Promise.all(productIds.map((id) => getProductById(id)));
    return products;
}

// hàm lấy shopId của product, dùng để kiểm tra khi checkout phải cùng shop
export async function getShopIdByProductId(productId: bigint): Promise<bigint> {
    const product = await getProductById(productId);
    return BigInt(product.shopId);
}
