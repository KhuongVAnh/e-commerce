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
        (req.method === "POST" && pathname === "/api/auth/logout")
    );
}

/**
 * CATALOG SERVICE (shop + product + category)
 */
export function isProtectedCatalogService(req: Request): boolean {
    const pathname = getPathname(req);

    return (
        // ===== SHOP (seller/admin) =====
        (req.method === "POST" && pathname === "/api/shops") ||
        (req.method === "GET" && pathname === "/api/shops/my-shop") ||
        (req.method === "PUT" && pathname === "/api/shops/my-shop") ||
        (req.method === "GET" && pathname === "/api/admin/shops") ||

        // ===== CATEGORY (admin) =====
        (req.method === "POST" && pathname === "/api/categories") ||
        (req.method === "PUT" && pathname.startsWith("/api/categories/")) ||
        (req.method === "DELETE" && pathname.startsWith("/api/categories/")) ||

        // ===== PRODUCT (seller) =====
        (req.method === "POST" && pathname === "/api/products") ||
        (req.method === "PUT" && pathname.startsWith("/api/products/")) ||
        (req.method === "DELETE" && pathname.startsWith("/api/products/")) ||
        (req.method === "PATCH" && pathname.startsWith("/api/products/"))
    );
}

/**
 * COMMERCE SERVICE (cart + order + payment)
 */
export function isProtectedCommerceService(req: Request): boolean {
    const pathname = getPathname(req);

    return (
        // ===== CART =====
        pathname.startsWith("/api/cart") ||

        // ===== ORDER =====
        pathname.startsWith("/api/orders") ||
        pathname.startsWith("/api/seller/orders") ||

        // ===== PAYMENT =====
        (req.method === "POST" && pathname === "/api/payments/create-vnpay-url") ||
        (req.method === "GET" && pathname.startsWith("/api/payments/order/")) ||

        // ===== STATS =====
        pathname.startsWith("/api/seller/revenue-summary") ||
        pathname.startsWith("/api/admin/dashboard-summary")
    );
}

/**
 * FINAL CHECK
 */
export function shouldUseGatewayAuth(req: Request): boolean {
    return (
        isProtectedAuthService(req) ||
        isProtectedCatalogService(req) ||
        isProtectedCommerceService(req)
    );
}