import { NextFunction, Request, Response } from "express";
import {
    createProduct,
    getPublicProductDetail,
    listPublicProductsByIds,
    listPublicProducts,
    softDeleteProduct,
    updateProduct,
    updateProductStock,
    decrementProductsStock,
    incrementProductsStock,
} from "../services/productService";
import { sendSuccess } from "../utils/https";
import { listProductQuery } from "../utils/inOutProductAPI";
import { HttpError } from "../utils/https";

function readProductId(req: Request): string {
    const raw = req.params.productId;
    return Array.isArray(raw) ? raw[0] : String(raw);
}

function readQueryValue(value: unknown): string | undefined {
    if (Array.isArray(value)) {
        const first = value[0];
        return typeof first === "string" ? first : undefined;
    }

    return typeof value === "string" ? value : undefined;
}

export async function listPublicProductsController(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const query: listProductQuery = {
        page: readQueryValue(req.query.page),
        limit: readQueryValue(req.query.limit),
        shopId: readQueryValue(req.query.shopId),
        categoryId: readQueryValue(req.query.categoryId),
        keyword: readQueryValue(req.query.keyword),
        q: readQueryValue(req.query.q),
        sortBy: readQueryValue(req.query.sortBy),
    };

    const data = await listPublicProducts(query);
    res.setHeader("X-Cache", data.cacheStatus);

    sendSuccess(res, {
        requestId: res.locals.requestId,
        message: "Lấy danh sách sản phẩm thành công",
        data: data.products,
        pagination: data.pagination,
        filters: data.filters,
    });
}

export async function getPublicProductDetailController(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const data = await getPublicProductDetail(readProductId(req));
    const { cacheStatus, ...responseData } = data;
    res.setHeader("X-Cache", cacheStatus);

    sendSuccess(res, {
        requestId: res.locals.requestId,
        message: "Lấy chi tiết sản phẩm thành công",
        data: responseData,
    });
}

export async function listPublicProductsByIdsController(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const data = await listPublicProductsByIds(req.body?.productIds);

    sendSuccess(res, {
        requestId: res.locals.requestId,
        message: "Lấy danh sách sản phẩm theo id thành công",
        data,
    });
}

export async function createProductController(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const data = await createProduct(req.authUser!.userId, req.body);

    sendSuccess(res, {
        requestId: res.locals.requestId,
        message: "Tạo sản phẩm thành công",
        data,
        statusCode: 201,
    });
}

export async function updateProductController(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const data = await updateProduct(req.authUser!.userId, readProductId(req), req.body);

    sendSuccess(res, {
        requestId: res.locals.requestId,
        message: "Cập nhật sản phẩm thành công",
        data,
    });
}

export async function deleteProductController(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const data = await softDeleteProduct(req.authUser!.userId, readProductId(req));

    sendSuccess(res, {
        requestId: res.locals.requestId,
        message: "Xóa mềm sản phẩm thành công",
        data,
    });
}

export async function updateProductStockController(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const data = await updateProductStock(req.authUser!.userId, readProductId(req), req.body);

    sendSuccess(res, {
        requestId: res.locals.requestId,
        message: "Cập nhật tồn kho thành công",
        data,
    });
}

// Các controller internal để gọi từ order service khi cần tăng giảm tồn kho, không cần authUser vì đã có service order đảm bảo quyền truy cập rồi
export async function decrementStockInternalController(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const items = req.body.items; // Expect [{ productId: string, quantity: number }]

    if (!Array.isArray(items)) {
        throw new HttpError(400, "Dữ liệu không hợp lệ, items phải là mảng", { code: "VALIDATION_ERROR" });
    }

    const parsedItems = items.map(i => ({
        productId: BigInt(i.productId),
        quantity: Number(i.quantity)
    }));

    const data = await decrementProductsStock(parsedItems);

    sendSuccess(res, {
        requestId: res.locals.requestId,
        message: "Giảm tồn kho thành công",
        data,
    });
}

export async function incrementStockInternalController(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const items = req.body.items;

    if (!Array.isArray(items)) {
        throw new HttpError(400, "Dữ liệu không hợp lệ", { code: "VALIDATION_ERROR" });
    }

    const parsedItems = items.map(i => ({
        productId: BigInt(i.productId),
        quantity: Number(i.quantity)
    }));

    const data = await incrementProductsStock(parsedItems);

    sendSuccess(res, {
        requestId: res.locals.requestId,
        message: "Hoàn tồn kho thành công",
        data,
    });
}
