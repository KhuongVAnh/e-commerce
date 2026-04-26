import { prisma } from "../config/prisma";
import { HttpError } from "../utils/http";
import { getProductById, getProductsByIds } from "./catalogClient";

export async function addToCart(customerId: bigint, productId: bigint, quantity: number) {


    const product = await getProductById(productId);
    const shopId = BigInt(product.shopId);
    
    if (!product) {
        throw new HttpError(400, "Sản phẩm không tồn tại", {
            code: "PRODUCT_NOT_FOUND",
            hint: "Chọn sản phẩm khác",
        });
    }


    if (product.status !== "ACTIVE") {
        throw new HttpError(400, "Sản phẩm không khả dụng", {
            code: "PRODUCT_UNAVAILABLE",
            hint: "Chọn sản phẩm khác",
        });
    }

    if (product.stockQuantity < quantity) {
        throw new HttpError(400, "Số lượng yêu cầu vượt quá tồn kho", {
            code: "NOT_ENOUGH_STOCK",
        });
    }

    // kiểm tra số lượng giỏ hàng hiện tại của khách hàng
    const itemscount = await prisma.cartItem.count({
        where: {
            cart: {
                customerId: customerId,
            },
            NOT: {productId: productId}, // nếu đã có item cùng product thì không tính vào giới hạn số lượng mục, vì sẽ update quantity thôi    
        },
    });
    if (itemscount >= parseInt(process.env.CART_ITEM_LIMIT || "100")) {
        throw new HttpError(400, "Giỏ hàng đã đạt giới hạn số lượng mục", {
            code: "CART_ITEM_LIMIT_REACHED",
            hint: "Xóa bớt mục trong giỏ hàng để thêm mục mới",
        });
    }

    // kiểm tra stock
    const cart = await prisma.cart.findUnique({
        where: {
            customerId: customerId,
        },
        select: {
            id: true,
            items: {
                where: {
                    productId: productId,
                },
                select: {
                    id: true,
                    productId: true,
                    quantity: true,
                },
            },
        },
    });

    if (cart && cart.items.length > 0) {
        const existingItem = cart.items[0];
        const newQuantity = existingItem.quantity + quantity;

        if (product.stockQuantity < newQuantity) {
            throw new HttpError(400, "Số lượng trong giỏ hàng vượt quá tồn kho", {
                code: "NOT_ENOUGH_STOCK",
            });
        }

        return prisma.cartItem.update({
            where: { id: existingItem.id },
            data: { quantity: newQuantity },
        });
    } else {
        const newCart = cart ? cart : await prisma.cart.create({
            data: {
                customerId: customerId,
            },
        });

        return prisma.cartItem.create({
            data: {
                cartId: newCart.id,
                productId: productId,
                quantity: quantity,
                shopId: shopId,
            },
        });
    }
}

export async function updateCartItemQuantity(
    customerId: bigint,
    cartItemId: bigint,
    quantity: number,
) {
    const item = await prisma.cartItem.findFirst({
        where: {
            id: cartItemId,
            cart: {
                customerId: customerId,
            },
        },
    });

    if (!item) {
        throw new HttpError(404, "không tìm thấy mục trong giỏ hàng", {
            code: "CART_ITEM_NOT_FOUND",
        });
    }

    const product = await getProductById(item.productId);

    if (product.stockQuantity < quantity) {
        throw new HttpError(400, "Số lượng sản phẩm trong kho không đủ", {
            code: "NOT_ENOUGH_STOCK",
        });
    }

    return prisma.cartItem.update({
        where: { id: item.id },
        data: { quantity: quantity },
    });
}

export async function removeCartItem(customerId: bigint, cartItemId: bigint) {
    const item = await prisma.cartItem.findFirst({
        where: {
            id: cartItemId,
            cart: {
                customerId,
            },
        },
    });

    if (!item) {
        throw new HttpError(404, "không tìm thấy mục trong giỏ hàng", {
            code: "CART_ITEM_NOT_FOUND",
        });
    }

    await prisma.cartItem.delete({
        where: { id: item.id },
    });
}

// get cart nhóm theo shop
/**
{
  "cartId": "1",
  "customerId": "5",
  "shops": [
    {
      "shopId": "12",
      "items": [
        {
          "id": "1",
          "productId": "101",
          "productName": "Ao thun",
          "price": "120000.00",
          "quantity": 2,
          "lineTotal": "240000.00"
        }
      ],
      "totalQuantity": 2,
      "subtotal": "240000.00"
    },
    {...},
  ],
  "totalQuantity": 2
}
 */
export async function getCartGroupedByShop(customerId: bigint) {
    const cart = await prisma.cart.findUnique({
        where: {
            customerId,
        },
        include: {
            items: {
                // sort shopId tăng dần, createdAt giảm dần
                orderBy: [{ shopId: "asc" }, { createdAt: "desc" }],
            },
        },
    });

    if (!cart) {
        return {
            cartId: null,
            customerId,
            shops: [],
            totalQuantity: 0,
        };
    }

    const products = await getProductsByIds(cart.items.map((item) => item.productId));
    const productMap = new Map(products.map((product) => [product.id.toString(), product]));

    const shopMap = new Map<string, {
        shopId: string;
        items: unknown[];
        totalQuantity: number;
        subtotal: string;
    }>();

    let totalQuantity = 0;
    for (const item of cart.items) {
        totalQuantity += item.quantity;

        const shopId = item.shopId.toString();
        const product = productMap.get(item.productId.toString());
        const price = product ? Number(product.price) : 0;
        const lineTotal = price * item.quantity; // tổng tiền 1 dòng sản phẩm

        // thêm shop vào map nếu chưa có
        if (!shopMap.has(shopId)) {
            shopMap.set(shopId, {
                shopId,
                items: [],
                totalQuantity: 0,
                subtotal: "0.00",
            });
        }

        const group = shopMap.get(shopId)!;

        group.items.push({
            id: item.id,
            productId: item.productId,
            productName: product?.name ?? null,
            thumbnailUrl: product?.thumbnailUrl ?? null,
            price: price.toFixed(2),
            quantity: item.quantity,
            lineTotal: lineTotal.toFixed(2),
        });

        group.totalQuantity += item.quantity;
        group.subtotal = (Number(group.subtotal) + lineTotal).toFixed(2);
    }

    return {
        cartId: cart.id,
        customerId,
        shops: Array.from(shopMap.values()), // array của các value, trong value cũng chứa key shopId
        totalQuantity: totalQuantity,
    };
}

