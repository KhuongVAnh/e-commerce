import { HttpError } from "./http";

export type PaginationParams = {
    page: number;
    limit: number;
    skip: number;
    take: number;
};

export type PaginationMeta = {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
};

function parsePositiveInt(value: unknown): number | null {
    if (value === undefined || value === null || value === "") {
        return null;
    }

    const n = Number(String(value));
    if (!Number.isFinite(n) || !Number.isInteger(n) || n <= 0) {
        return null;
    }

    return n;
}

export function parsePaginationQuery(
    query: { page?: unknown; limit?: unknown },
    options?: { defaultLimit?: number; maxLimit?: number },
): PaginationParams {
    const defaultLimit = options?.defaultLimit ?? 10;
    const maxLimit = options?.maxLimit ?? 50;

    const pageParsed = parsePositiveInt(query.page);
    const limitParsed = parsePositiveInt(query.limit);

    const page = pageParsed ?? 1;
    const limit = limitParsed ?? defaultLimit;

    if (limit > maxLimit) {
        throw new HttpError(400, "limit vượt quá giới hạn", {
            code: "VALIDATION_ERROR",
            fieldErrors: [{ field: "limit", message: `limit tối đa là ${maxLimit}` }],
        });
    }

    const skip = (page - 1) * limit;

    return {
        page,
        limit,
        skip,
        take: limit,
    };
}

export function buildPaginationMeta(input: { page: number; limit: number; total: number }): PaginationMeta {
    const totalPages = input.total === 0 ? 0 : Math.ceil(input.total / input.limit);

    return {
        page: input.page,
        limit: input.limit,
        total: input.total,
        totalPages,
    };
}
