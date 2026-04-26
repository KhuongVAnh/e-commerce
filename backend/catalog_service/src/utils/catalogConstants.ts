export const CATEGORY_STATUSES = ["ACTIVE", "INACTIVE"] as const;
export const PRODUCT_STATUSES = ["ACTIVE", "INACTIVE", "OUT_OF_STOCK", "DELETED"] as const;

export type CategoryStatusValue = (typeof CATEGORY_STATUSES)[number];
export type ProductStatusValue = (typeof PRODUCT_STATUSES)[number];
