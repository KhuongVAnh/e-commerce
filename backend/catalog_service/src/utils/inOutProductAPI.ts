export type productImageInput = {
    imageUrl: string;
    sortOrder?: number;
};

export type createProductInput = {
    shopId: string | number;
    categoryId: string | number;
    name: string;
    description?: string;
    price: string | number;
    stockQuantity?: string | number;
    thumbnailUrl?: string;
    status?: string;
    images?: productImageInput[];
};

export type updateProductInput = {
    categoryId?: string | number;
    name?: string;
    description?: string;
    price?: string | number;
    stockQuantity?: string | number;
    thumbnailUrl?: string;
    status?: string;
    images?: productImageInput[];
};

export type updateProductStockInput = {
    stockQuantity: string | number;
};

export type listProductQuery = {
    keyword?: string;
    q?: string;
    shopId?: string;
    categoryId?: string;
    sortBy?: string;
    page?: string;
    limit?: string;
};

export type publicProductListItemResponse = {
    id: number;
    shopId: number;
    categoryId: number;
    name: string;
    slug: string;
    price: number;
    stockQuantity: number;
    thumbnailUrl: string | null;
    status: string;
};

export type publicProductDetailResponse = {
    product: {
        id: number;
        shopId: number;
        categoryId: number;
        name: string;
        slug: string;
        description: string | null;
        price: number;
        stockQuantity: number;
        thumbnailUrl: string | null;
        status: string;
        createdAt: string;
        updatedAt: string;
    };
    images: productImageResponse[];
    shop: {
        id: number;
        name: string;
    };
};

export type productImageResponse = {
    id: number;
    imageUrl: string;
    sortOrder: number;
};

export type productResponse = {
    id: number;
    shopId: number;
    categoryId: number;
    name: string;
    slug: string;
    description: string | null;
    price: number;
    stockQuantity: number;
    thumbnailUrl: string | null;
    status: string;
    deletedAt: string | null;
    createdAt: string;
    updatedAt: string;
    shop: {
        id: number;
        name: string;
        slug: string;
    };
    category: {
        id: number;
        name: string;
        slug: string;
    };
    images: productImageResponse[];
};
