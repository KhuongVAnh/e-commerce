/*
* Author: KhuongVAnh
* kiểm tra xem request này có cần phải đi qua middleware gatewayAuth hay không, dựa vào method + pathname
*/
import { Request } from "express";

// bỏ query
function getPathname(req: Request): string {
    return req.originalUrl.split("?")[0];
}

/**
 * AUTH SERVICE
 */
export function isProtectedAuthService(req: Request): boolean {
    const pathname = getPathname(req);

    return (
        (req.method === "GET" && pathname === "/api/auth/me") ||
        (req.method === "POST" && pathname === "/api/auth/logout") ||
        pathname.startsWith("/api/auth/admin/")
    );
}

/**
 * CATALOG SERVICE (shop + product + category)
 */
export function isProtectedCatalogService(req: Request): boolean {
    const pathname = getPathname(req);

    return (
        // ===== SHOP (seller/admin) =====
        (req.method === "POST" && pathname === "/api/catalog/shops") ||
        (req.method === "GET" && pathname === "/api/catalog/shops/my-shop") ||
        (req.method === "PUT" && pathname === "/api/catalog/shops/my-shop") ||
        pathname.startsWith("/api/catalog/admin/shops") ||

        // ===== CATEGORY (admin) =====
        pathname.startsWith("/api/catalog/admin/categories") ||
        (req.method === "POST" && pathname === "/api/catalog/categories") ||
        (req.method === "PUT" && pathname.startsWith("/api/catalog/categories/")) ||
        (req.method === "DELETE" && pathname.startsWith("/api/catalog/categories/")) ||

        // ===== PRODUCT (seller) =====
        (req.method === "POST" && pathname === "/api/catalog/products") ||
        (req.method === "PUT" && pathname.startsWith("/api/catalog/products/")) ||
        (req.method === "DELETE" && pathname.startsWith("/api/catalog/products/")) ||
        (req.method === "PATCH" && pathname.startsWith("/api/catalog/products/")) ||

        // ===== PRODUCT (admin) =====
        pathname.startsWith("/api/catalog/admin/products")
    );
}

/**
 * COMMERCE SERVICE (cart + order + payment)
 */
export function isProtectedCommerceService(req: Request): boolean {
    const pathname = getPathname(req);

    return (
        // ===== CART =====
        pathname.startsWith("/api/commerce/cart") ||

        // ===== ORDER =====
        pathname.startsWith("/api/commerce/orders") ||
        pathname.startsWith("/api/commerce/seller/orders") ||

        // ===== ORDER (admin) =====
        pathname.startsWith("/api/commerce/admin/orders") ||

        // ===== PAYMENT =====
        (req.method === "POST" && pathname === "/api/commerce/payments/create-vnpay-url") ||
        (req.method === "GET" && pathname.startsWith("/api/commerce/payments/order/")) ||

        // ===== STATS =====
        pathname.startsWith("/api/commerce/seller/revenue-summary") ||
        pathname.startsWith("/api/commerce/admin/dashboard-summary")
    );
}

/**
 * NOTIFICATION SERVICE
 */
export function isProtectedNotificationService(req: Request): boolean {
    const pathname = getPathname(req);
    if (pathname.startsWith("/api/notifications/docs")) {
        return false;
    }
    return pathname.startsWith("/api/notifications");
}

/**
 * FINAL CHECK
 */
export function shouldUseGatewayAuth(req: Request): boolean {
    return (
        isProtectedAuthService(req) ||
        isProtectedCatalogService(req) ||
        isProtectedCommerceService(req) ||
        isProtectedNotificationService(req)
    );
}
