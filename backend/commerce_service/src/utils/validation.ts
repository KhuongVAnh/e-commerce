import { HttpError } from "./http";

// helper parse ID và quantity
// parseRequiredBigInt: dùng cho productId, shopId, cartItemId.
// parsePositiveInteger: dùng cho quantity.
// Nếu dữ liệu sai, throw HttpError.
export function parseRequiredBigInt(value: unknown, field: string): bigint {
    if (value === undefined || value === null || value === "") {
        throw new HttpError(400, `${field} is required`, {
            code: "VALIDATION_ERROR",
            fieldErrors: [{ field, message: `${field} is required` }],
        });
    }

    try {
        return BigInt(String(value));
    } catch {
        throw new HttpError(400, `${field} must be a valid id`, {
            code: "VALIDATION_ERROR",
            fieldErrors: [{ field, message: `${field} must be a valid id` }],
        });
    }
}

export function parsePositiveInteger(value: unknown, field: string): number {
    const numberValue = Number(value);

    if (!Number.isInteger(numberValue) || numberValue <= 0) {
        throw new HttpError(400, `${field} must be a positive integer`, {
            code: "VALIDATION_ERROR",
            fieldErrors: [{ field, message: `${field} must be a positive integer` }],
        });
    }

    return numberValue;
}