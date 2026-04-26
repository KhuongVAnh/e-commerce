export type createCategoryInput = {
    name: string;
    status?: string;
};

export type updateCategoryInput = {
    name?: string;
    status?: string;
};

export type listCategoryQuery = {
    q?: string;
    status?: string;
    page?: string;
    limit?: string;
    sortBy?: string;
    sortOrder?: string;
};

export type categoryResponse = {
    id: number;
    name: string;
    slug: string;
    status: string;
};
