// thống nhất payload và response của API liên quan đến shop
export type createShopInput = {
    name: string;
    logoUrl?: string;
    description?: string;
    address: string;
}

export type updateShopInput = {
    name?: string;
    logoUrl?: string;
    description?: string;
    address?: string;
}

export type shopResponse = {
    id: number;
    sellerId: number;
    name: string;
    slug: string;
    logoUrl: string | null;
    description: string | null;
    address: string;
    status : string;
    createdAt: string;
    updatedAt: string;
}