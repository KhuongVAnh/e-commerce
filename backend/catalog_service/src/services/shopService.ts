import { prisma } from "../config/prisma";
import { HttpError } from "../utils/https";
import { createShopInput, updateShopInput, shopResponse } from "../utils/inOutShopAPI";

// xóa khoảng trắng đầu cuối, chuyển chuỗi rỗng thành null
function normalizeOptionalText(value?: string): string | null {
    if (typeof value !== "string") {
        return null;
    }

    const trimmed = value.trim();
    return trimmed ? trimmed : null;
}

// biến tên shop thành slug để lưu vào database, đảm bảo tính duy nhất
// slugify("Xin chào Thế giới!!!")
// → "xin-chao-the-gioi"
function nameToSlug(value: string): string {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
}

function parsePositiveBigInt(value: string, field: string): bigint {
    const asText = String(value ?? "").trim();

    if (!asText || !/^\d+$/.test(asText)) {
        throw new HttpError(400, "Dữ liệu không hợp lệ", {
            code: "VALIDATION_ERROR",
            fieldErrors: [
                {
                    field,
                    message: `${field} phải là số nguyên dương`,
                },
            ],
        });
    }

    const parsed = BigInt(asText);

    if (parsed <= 0n) {
        throw new HttpError(400, "Dữ liệu không hợp lệ", {
            code: "VALIDATION_ERROR",
            fieldErrors: [
                {
                    field,
                    message: `${field} phải là số nguyên dương`,
                },
            ],
        });
    }

    return parsed;
}

// đảm bảo cấu trúc input khi tạo shop mới
function assertCreateInput(input: createShopInput) {
    const fieldErrors: Array<{ field: string; message: string }> = [];

    if (!input.name || !input.name.trim()) {
        fieldErrors.push({ field: "name", message: "Tên shop là bắt buộc" });
    }

    if (!input.address || !input.address.trim()) {
        fieldErrors.push({ field: "address", message: "Địa chỉ shop là bắt buộc" });
    }

    if (fieldErrors.length > 0) {
        throw new HttpError(400, "Dữ liệu không hợp lệ", {
            code: "VALIDATION_ERROR",
            fieldErrors,
            hint: "Kiểm tra lại dữ liệu nhập",
        });
    }

    return {
        name: input.name.trim(),
        description: normalizeOptionalText(input.description),
        logoUrl: normalizeOptionalText(input.logoUrl),
        address: input.address.trim(),
    };
}

// đảm bảo cấu trúc input khi cập nhật shop
function assertUpdateInput(input: updateShopInput) {
    const hastingFields = ["name", "description", "logoUrl", "address"].some(field => field in input);
    if (!hastingFields) {
        throw new HttpError(400, "Dữ liệu không hợp lệ", {
            code: "VALIDATION_ERROR",
            fieldErrors: [
                {
                    field: "body",
                    message: "Cần ít nhất một trường để cập nhật",
                },
            ],
            hint: "Gửi ít nhất một trong các trường: name, description, logoUrl, address",
        });
    }

    if (input.name !== undefined && !input.name.trim()) {
        throw new HttpError(400, "Dữ liệu không hợp lệ", {
            code: "VALIDATION_ERROR",
            fieldErrors: [
                {
                    field: "name",
                    message: "Tên shop không được để trống",
                },
            ],
            hint: "Hãy đảm bảo tên shop không phải là chuỗi rỗng",
        });
    }

    if (input.address !== undefined && !input.address.trim()) {
        throw new HttpError(400, "Dữ liệu không hợp lệ", {
            code: "VALIDATION_ERROR",
            fieldErrors: [
                {
                    field: "address",
                    message: "Địa chỉ shop không được để trống",
                },
            ],
            hint: "Hãy đảm bảo địa chỉ shop không phải là chuỗi rỗng",
        });
    }

    return {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.description !== undefined ? { description: normalizeOptionalText(input.description) } : {}),
        ...(input.logoUrl !== undefined ? { logoUrl: normalizeOptionalText(input.logoUrl) } : {}),
        ...(input.address !== undefined ? { address: input.address.trim() } : {}),
    };
}

// tạo slug duy nhất cho shop dựa trên tên
async function generateUniqueSlug(name: string): Promise<string> {
    const baseSlug = nameToSlug(name) || "shop";
    let candidate = baseSlug;
    let suffix = 1;

    while (true) {
        const existingShop = await prisma.shop.findUnique({
            where: { slug: candidate },
            select: { id: true },
        });

        if (!existingShop) {
            return candidate;
        }

        suffix += 1;
        candidate = `${baseSlug}-${suffix}`;
    }
}

// chuyển đổi dữ liệu shop từ database thành định dạng response của API
function toShopResponse(shop: {
    id: bigint;
    sellerId: bigint;
    name: string;
    slug: string;
    logoUrl: string | null;
    description: string | null;
    address: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
}): shopResponse {
    return {
        id: Number(shop.id),
        sellerId: Number(shop.sellerId),
        name: shop.name,
        slug: shop.slug,
        logoUrl: shop.logoUrl,
        description: shop.description,
        address: shop.address,
        status: shop.status,
        createdAt: shop.createdAt.toISOString(),
        updatedAt: shop.updatedAt.toISOString(),
    };
}

// create shop
export async function createShop(sellerId: string, input: createShopInput) {
    const sellerIdAsBigInt = parsePositiveBigInt(sellerId, "sellerId");

    // kiểm tra người dùng đã có shop chưa
    const existingShop = await prisma.shop.findFirst({
        where: { sellerId: sellerIdAsBigInt },
        select: { id: true },
    });

    if (existingShop) {
        throw new HttpError(409, "Người dùng đã có shop", {
            code: "SHOP_ALREADY_EXISTS",
            hint: "Mỗi seller chỉ được sở hữu một shop",
        });
    }

    const payload = assertCreateInput(input);
    const slug = await generateUniqueSlug(payload.name);

    const createdShop = await prisma.shop.create({
        data: {
            sellerId: sellerIdAsBigInt,
            name: payload.name,
            slug,
            logoUrl: payload.logoUrl,
            description: payload.description,
            address: payload.address,
        },
    });

    return {
        shop: toShopResponse(createdShop),
    };
}

export async function getMyShop(sellerId: string) {
    const sellerIdAsBigInt = parsePositiveBigInt(sellerId, "sellerId");

    const shop = await prisma.shop.findUnique({
        where: { sellerId: sellerIdAsBigInt },
    });

    if (!shop) {
        throw new HttpError(404, "Shop không tồn tại", {
            code: "SHOP_NOT_FOUND",
            hint: "Seller hiện chưa tạo shop",
        });
    }

    return {
        shop: toShopResponse(shop),
    };
}

export async function updateMyShop(sellerId: string, input: updateShopInput) {
    const sellerIdAsBigInt = parsePositiveBigInt(sellerId, "sellerId");
    const payload = assertUpdateInput(input);

    const existingShop = await prisma.shop.findUnique({
        where: { sellerId: sellerIdAsBigInt },
    });

    if (!existingShop) {
        throw new HttpError(404, "Shop không tồn tại", {
            code: "SHOP_NOT_FOUND",
            hint: "Seller hiện chưa tạo shop",
        });
    }

    const shop = await prisma.shop.update({
        where: { id: existingShop.id },
        data: { ...payload },
    });

    return {
        shop: toShopResponse(shop),
    };
}

// Lấy shop theo sellerId cho các service nội bộ (không ném lỗi nếu không tìm thấy)
export async function getShopBySellerId(sellerId: string) {
    const sellerIdAsBigInt = parsePositiveBigInt(sellerId, "sellerId");

    const shop = await prisma.shop.findUnique({
        where: { sellerId: sellerIdAsBigInt },
    });

    if (!shop) {
        return { shop: null };
    }

    return { shop: toShopResponse(shop) };
}



