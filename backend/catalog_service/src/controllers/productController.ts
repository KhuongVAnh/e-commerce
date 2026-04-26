import { NextFunction, Request, Response } from "express";
import {
    createProduct,
    getPublicProductDetail,
    listPublicProducts,
    softDeleteProduct,
    updateProduct,
    updateProductStock,
} from "../services/productService";
import { sendSuccess } from "../utils/https";
import { listProductQuery } from "../utils/inOutProductAPI";

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

    sendSuccess(res, {
        requestId: res.locals.requestId,
        message: "Lấy chi tiết sản phẩm thành công",
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
