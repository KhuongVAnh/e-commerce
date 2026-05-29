import { NextFunction, Request, Response } from "express";
import { createCategory, deleteCategory, getCategoryStats, listCategories, updateCategory } from "../services/categoryService";
import { sendSuccess } from "../utils/https";
import { listCategoryQuery } from "../utils/inOutCategoryAPI";

// Hàm này đọc categoryId từ params và chuẩn hóa về string để service tự validate kiểu bigint.
function readCategoryId(req: Request): string {
    const raw = req.params.categoryId;
    return Array.isArray(raw) ? raw[0] : String(raw);
}

function readQueryValue(value: unknown): string | undefined {
    if (Array.isArray(value)) {
        const first = value[0];
        return typeof first === "string" ? first : undefined;
    }

    return typeof value === "string" ? value : undefined;
}

export async function listCategoriesController(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const query: listCategoryQuery = {
        q: readQueryValue(req.query.q),
        status: readQueryValue(req.query.status),
    };

    const data = await listCategories(query);
    res.setHeader("X-Cache", data.cacheStatus);

    sendSuccess(res, {
        requestId: res.locals.requestId,
        message: "Lấy danh sách danh mục thành công",
        data: data.categories,
    });
}

export async function getCategoryStatsController(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const data = await getCategoryStats();

    sendSuccess(res, {
        requestId: res.locals.requestId,
        message: "Lấy thống kê danh mục thành công",
        data,
    });
}

export async function createCategoryController(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const data = await createCategory(req.body);

    sendSuccess(res, {
        requestId: res.locals.requestId,
        message: "Tạo danh mục thành công",
        data,
        statusCode: 201,
    });
}

// Controller này nhận request ADMIN cập nhật category và chuyển validation nghiệp vụ xuống service.
export async function updateCategoryController(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const data = await updateCategory(readCategoryId(req), req.body);

    sendSuccess(res, {
        requestId: res.locals.requestId,
        message: "Cập nhật danh mục thành công",
        data,
    });
}

// Controller này nhận request ADMIN xóa category và để service kiểm tra category còn product hay không.
export async function deleteCategoryController(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const data = await deleteCategory(readCategoryId(req));

    sendSuccess(res, {
        requestId: res.locals.requestId,
        message: "Xóa danh mục thành công",
        data,
    });
}
