import { NextFunction, Request, Response } from "express";
import { createCategory, listCategories } from "../services/categoryService";
import { sendSuccess } from "../utils/https";
import { listCategoryQuery } from "../utils/inOutCategoryAPI";

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

    sendSuccess(res, {
        requestId: res.locals.requestId,
        message: "Lấy danh sách danh mục thành công",
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
