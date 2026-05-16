import { HttpError } from "./http";

// helper parse ID và quantity
// parseRequiredBigInt: dùng cho productId, shopId, cartItemId.
// parsePositiveInteger: dùng cho quantity.
// Nếu dữ liệu sai, throw HttpError.
export function parseRequiredBigInt(value: unknown, field: string): bigint {
    const asText = String(value ?? "").trim();

    if (!asText) {
        throw new HttpError(400, `${field} is required`, {
            code: "VALIDATION_ERROR",
            fieldErrors: [{ field, message: `${field} is required` }],
        });
    }

    if (!/^\d+$/.test(asText)) {
        throw new HttpError(400, `${field} must be a valid id`, {
            code: "VALIDATION_ERROR",
            fieldErrors: [{ field, message: `${field} must be a valid id` }],
        });
    }

    const parsed = BigInt(asText);

    if (parsed <= 0n) {
        throw new HttpError(400, `${field} must be a positive id`, {
            code: "VALIDATION_ERROR",
            fieldErrors: [{ field, message: `${field} must be a positive id` }],
        });
    }

    return parsed;
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

export function serializeBigInt<T>(value: T): T {
    return JSON.parse(
        JSON.stringify(value, (_key, currentValue) => {
            if (typeof currentValue === "bigint") {
                return currentValue.toString();
            }

            return currentValue;
        }),
    );
}