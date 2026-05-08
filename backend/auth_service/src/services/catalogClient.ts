import { HttpError } from "../utils/http";

const catalogBaseUrl = process.env.CATALOG_SERVICE_URL || "http://localhost:3002";
const normalizedCatalogBaseUrl = catalogBaseUrl.replace(/\/+$/, "");
const catalogApiBaseUrl = normalizedCatalogBaseUrl.endsWith("/api/catalog")
    ? normalizedCatalogBaseUrl
    : `${normalizedCatalogBaseUrl}/api/catalog`;

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
