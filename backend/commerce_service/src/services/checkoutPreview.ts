import { prisma } from "../config/prisma";
import { HttpError } from "../utils/http";
import { getProductsByIds } from "./catalogClient";

export async function buildCheckoutPreview(
    customerId: bigint,
    shopId: bigint,
    cartItemIds: bigint[]
) {
    if (cartItemIds.length === 0) {
        throw new HttpError(400, "cartItemIds không được để trống", {
            code: "VALIDATION_ERROR",
            fieldErrors: [
                { field: "cartItemIds", message: "cartItemIds must not be empty" },
            ],
        });
    }

    const items = await prisma.cartItem.findMany({
        where: {
            id: { in: cartItemIds },
            shopId: shopId,
            cart: {
                customerId: customerId,
            },
        },
        orderBy: { createdAt: "desc" },
    });

    if (items.length !== cartItemIds.length) {
        throw new HttpError(400, "Một số mục trong giỏ hàng không hợp lệ", {
            code: "INVALID_CART_ITEMS",
            hint: "Chỉ có thể thanh toán các mục từ giỏ hàng của bạn và cùng một cửa hàng",
        });
    }

    const products = await getProductsByIds(items.map((item) => item.productId));
    const productMap = new Map(products.map((p) => [p.id.toString(), p]));

    let subtotal = 0;
    let canCheckout = true;

    const previewItems = items.map((item) => {
        const product = productMap.get(item.productId.toString());

        if (!product) {
            canCheckout = false;

            return {
                cartItemId: item.id,
                productId: item.productId,
                quantity: item.quantity,
                valid: false,
                invalidReason: "Sản phẩm không còn tồn tại",
            };
        }

        const unitPrice = Number(product.price);
        const lineSubtotal = unitPrice * item.quantity;

        const isActive = product.status === "ACTIVE";
        const hasEnoughStock = product.stockQuantity >= item.quantity;
        const valid = isActive && hasEnoughStock;

        if (valid) {
            subtotal += lineSubtotal;
        } else {
            canCheckout = false;
        }

        return {
            cartItemId: item.id,
            productId: item.productId,
            productName: product.name,
            unitPrice, // number
            quantity: item.quantity,
            subtotal: lineSubtotal, // number
            valid,
            invalidReason: !isActive
                ? "Sản phẩm không hoạt động"
                : !hasEnoughStock
                    ? "Số lượng sản phẩm trong kho không đủ"
                    : null,
        };
    });

    const shippingFee = 30000; // cố định 30k, có thể thay đổi sau khi tích hợp với dịch vụ vận chuyển
    const grandTotal = subtotal + shippingFee;

    return {
        shopId,
        items: previewItems,
        pricing: {
            subtotal,
            shippingFee,
            grandTotal,
        },
        canCheckout,
    };
}