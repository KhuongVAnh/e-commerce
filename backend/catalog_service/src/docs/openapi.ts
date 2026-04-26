const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "Catalog Service API",
    version: "1.0.0",
    description: "API quan ly shop, category, product cho he thong e-commerce",
  },
  servers: [
    {
      url: "http://localhost:3002",
      description: "Catalog Service Local",
    },
  ],
  tags: [
    { name: "Categories", description: "Quan ly category" },
    { name: "Products", description: "Quan ly product cho seller" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      CategoryCreateRequest: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string", example: "Thoi trang" },
          status: { type: "string", enum: ["ACTIVE", "INACTIVE"], example: "ACTIVE" },
        },
      },
      CategoryData: {
        type: "object",
        properties: {
          id: { type: "integer", example: 2 },
          name: { type: "string", example: "Thoi trang" },
          slug: { type: "string", example: "thoi-trang" },
          status: { type: "string", example: "ACTIVE" },
        },
      },
      CategoryListSuccessResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string", example: "Lay danh sach danh muc thanh cong" },
          data: {
            type: "array",
            items: { $ref: "#/components/schemas/CategoryData" },
          },
          meta: {
            type: "object",
            properties: {
              requestId: { type: "string", example: "req_407" },
              timestamp: { type: "string", format: "date-time", example: "2026-04-09T14:00:00Z" },
              pagination: { nullable: true, example: null },
              version: { type: "string", example: "v1" },
              warnings: { type: "array", items: { type: "string" }, example: [] },
            },
          },
        },
      },
      CategoryCreateSuccessResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string", example: "Tao danh muc thanh cong" },
          data: {
            type: "object",
            properties: {
              category: { $ref: "#/components/schemas/CategoryData" },
            },
          },
          meta: {
            type: "object",
            properties: {
              requestId: { type: "string", example: "req_408" },
              timestamp: { type: "string", format: "date-time", example: "2026-04-09T14:05:00Z" },
              pagination: { nullable: true, example: null },
              version: { type: "string", example: "v1" },
              warnings: { type: "array", items: { type: "string" }, example: [] },
            },
          },
        },
      },
      PublicProductListItem: {
        type: "object",
        properties: {
          id: { type: "integer", example: 10 },
          shopId: { type: "integer", example: 5 },
          categoryId: { type: "integer", example: 2 },
          name: { type: "string", example: "Ao so mi trang" },
          slug: { type: "string", example: "ao-so-mi-trang" },
          price: { type: "number", example: 175000 },
          stockQuantity: { type: "integer", example: 20 },
          thumbnailUrl: { type: "string", nullable: true, example: "https://cdn.example.com/1.png" },
          status: { type: "string", example: "ACTIVE" },
        },
      },
      PublicProductListSuccessResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string", example: "Lay danh sach san pham thanh cong" },
          data: {
            type: "array",
            items: { $ref: "#/components/schemas/PublicProductListItem" },
          },
          meta: {
            type: "object",
            properties: {
              requestId: { type: "string", example: "req_401" },
              timestamp: { type: "string", format: "date-time", example: "2026-04-09T13:30:00Z" },
              pagination: {
                type: "object",
                properties: {
                  page: { type: "integer", example: 1 },
                  limit: { type: "integer", example: 12 },
                  total: { type: "integer", example: 120 },
                  totalPages: { type: "integer", example: 10 },
                },
              },
              version: { type: "string", example: "v1" },
              warnings: { type: "array", items: { type: "string" }, example: [] },
              filters: {
                type: "object",
                properties: {
                  keyword: { type: "string", nullable: true, example: "ao" },
                  shopId: { type: "integer", nullable: true, example: null },
                  categoryId: { type: "integer", nullable: true, example: 2 },
                  sortBy: { type: "string", example: "price_asc" },
                },
              },
            },
          },
        },
      },
      PublicProductDetailSuccessResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string", example: "Lay chi tiet san pham thanh cong" },
          data: {
            type: "object",
            properties: {
              product: {
                type: "object",
                properties: {
                  id: { type: "integer", example: 10 },
                  shopId: { type: "integer", example: 5 },
                  categoryId: { type: "integer", example: 2 },
                  name: { type: "string", example: "Ao so mi trang" },
                  slug: { type: "string", example: "ao-so-mi-trang" },
                  description: { type: "string", nullable: true, example: "Cotton 100%" },
                  price: { type: "number", example: 175000 },
                  stockQuantity: { type: "integer", example: 20 },
                  thumbnailUrl: { type: "string", nullable: true, example: "https://cdn.example.com/1.png" },
                  status: { type: "string", example: "ACTIVE" },
                  createdAt: { type: "string", format: "date-time", example: "2026-04-09T13:30:00Z" },
                  updatedAt: { type: "string", format: "date-time", example: "2026-04-09T13:30:00Z" },
                },
              },
              images: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "integer", example: 1 },
                    imageUrl: { type: "string", example: "https://cdn.example.com/1.png" },
                    sortOrder: { type: "integer", example: 1 },
                  },
                },
              },
              shop: {
                type: "object",
                properties: {
                  id: { type: "integer", example: 5 },
                  name: { type: "string", example: "Shop ABC" },
                },
              },
            },
          },
          meta: {
            type: "object",
            properties: {
              requestId: { type: "string", example: "req_402" },
              timestamp: { type: "string", format: "date-time", example: "2026-04-09T13:35:00Z" },
              pagination: { nullable: true, example: null },
              version: { type: "string", example: "v1" },
              warnings: { type: "array", items: { type: "string" }, example: [] },
            },
          },
        },
      },
      ProductCreateRequest: {
        type: "object",
        required: ["shopId", "categoryId", "name", "price"],
        properties: {
          shopId: { type: "integer", example: 5 },
          categoryId: { type: "integer", example: 2 },
          name: { type: "string", example: "Ao so mi trang" },
          description: { type: "string", nullable: true, example: "Vai cotton, tay dai" },
          price: { type: "number", example: 175000 },
          stockQuantity: { type: "integer", minimum: 0, example: 20 },
          thumbnailUrl: { type: "string", nullable: true, example: "https://cdn.example.com/p10-thumb.jpg" },
          status: { type: "string", enum: ["ACTIVE", "INACTIVE", "OUT_OF_STOCK"], example: "ACTIVE" },
          images: {
            type: "array",
            items: {
              type: "object",
              required: ["imageUrl"],
              properties: {
                imageUrl: { type: "string", example: "https://cdn.example.com/p10-1.jpg" },
                sortOrder: { type: "integer", minimum: 0, example: 0 },
              },
            },
          },
        },
      },
      ProductUpdateRequest: {
        type: "object",
        properties: {
          categoryId: { type: "integer", example: 2 },
          name: { type: "string", example: "Ao so mi trang premium" },
          description: { type: "string", nullable: true, example: "Vai cotton cao cap" },
          price: { type: "number", example: 190000 },
          stockQuantity: { type: "integer", minimum: 0, example: 30 },
          thumbnailUrl: { type: "string", nullable: true, example: "https://cdn.example.com/p10-thumb-v2.jpg" },
          status: { type: "string", enum: ["ACTIVE", "INACTIVE", "OUT_OF_STOCK"], example: "ACTIVE" },
          images: {
            type: "array",
            items: {
              type: "object",
              required: ["imageUrl"],
              properties: {
                imageUrl: { type: "string", example: "https://cdn.example.com/p10-2.jpg" },
                sortOrder: { type: "integer", minimum: 0, example: 0 },
              },
            },
          },
        },
      },
      ProductStockPatchRequest: {
        type: "object",
        required: ["stockQuantity"],
        properties: {
          stockQuantity: { type: "integer", minimum: 0, example: 12 },
        },
      },
      ProductData: {
        type: "object",
        properties: {
          id: { type: "integer", example: 10 },
          shopId: { type: "integer", example: 5 },
          categoryId: { type: "integer", example: 2 },
          name: { type: "string", example: "Ao so mi trang" },
          slug: { type: "string", example: "ao-so-mi-trang" },
          description: { type: "string", nullable: true, example: "Vai cotton, tay dai" },
          price: { type: "number", example: 175000 },
          stockQuantity: { type: "integer", example: 20 },
          thumbnailUrl: { type: "string", nullable: true, example: "https://cdn.example.com/p10-thumb.jpg" },
          status: { type: "string", example: "ACTIVE" },
          deletedAt: { type: "string", nullable: true, example: null },
          createdAt: { type: "string", format: "date-time", example: "2026-04-09T13:40:00Z" },
          updatedAt: { type: "string", format: "date-time", example: "2026-04-09T13:40:00Z" },
          shop: {
            type: "object",
            properties: {
              id: { type: "integer", example: 5 },
              name: { type: "string", example: "Shop ABC" },
              slug: { type: "string", example: "shop-abc" },
            },
          },
          category: {
            type: "object",
            properties: {
              id: { type: "integer", example: 2 },
              name: { type: "string", example: "Thoi trang" },
              slug: { type: "string", example: "thoi-trang" },
            },
          },
          images: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "integer", example: 77 },
                imageUrl: { type: "string", example: "https://cdn.example.com/p10-1.jpg" },
                sortOrder: { type: "integer", example: 0 },
              },
            },
          },
        },
      },
      ProductSuccessResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string", example: "Tao san pham thanh cong" },
          data: {
            type: "object",
            properties: {
              product: { $ref: "#/components/schemas/ProductData" },
            },
          },
          meta: {
            type: "object",
            properties: {
              requestId: { type: "string", example: "req_403" },
              timestamp: { type: "string", format: "date-time", example: "2026-04-09T13:40:00Z" },
              pagination: { nullable: true, example: null },
              version: { type: "string", example: "v1" },
              warnings: { type: "array", items: { type: "string" }, example: [] },
            },
          },
        },
      },
      ProductStockSuccessResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string", example: "Cap nhat ton kho thanh cong" },
          data: {
            type: "object",
            properties: {
              product: { $ref: "#/components/schemas/ProductData" },
              previousStock: { type: "integer", example: 20 },
              currentStock: { type: "integer", example: 12 },
              updatedAt: { type: "string", format: "date-time", example: "2026-04-09T13:40:00Z" },
            },
          },
          meta: {
            type: "object",
            properties: {
              requestId: { type: "string", example: "req_403" },
              timestamp: { type: "string", format: "date-time", example: "2026-04-09T13:40:00Z" },
              pagination: { nullable: true, example: null },
              version: { type: "string", example: "v1" },
              warnings: { type: "array", items: { type: "string" }, example: [] },
            },
          },
        },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string", example: "Du lieu khong hop le" },
          error: {
            type: "object",
            properties: {
              code: { type: "string", example: "VALIDATION_ERROR" },
              details: { type: "array", items: { type: "string" }, example: [] },
              fieldErrors: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    field: { type: "string", example: "price" },
                    message: { type: "string", example: "Gia phai lon hon 0" },
                  },
                },
              },
              hint: { type: "string", nullable: true, example: null },
            },
          },
          meta: {
            type: "object",
            properties: {
              requestId: { type: "string", example: "req_403" },
              timestamp: { type: "string", format: "date-time", example: "2026-04-09T13:40:00Z" },
              version: { type: "string", example: "v1" },
            },
          },
        },
      },
    },
  },
  paths: {
    "/api/catalog/categories": {
      get: {
        tags: ["Categories"],
        summary: "Lay danh sach category",
        parameters: [
          {
            name: "q",
            in: "query",
            required: false,
            schema: { type: "string" },
            description: "Tim theo ten hoac slug",
          },
          {
            name: "status",
            in: "query",
            required: false,
            schema: { type: "string", enum: ["ACTIVE", "INACTIVE"] },
            description: "Mac dinh la ACTIVE neu khong truyen",
          },
        ],
        responses: {
          "200": {
            description: "Lay danh sach danh muc thanh cong",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CategoryListSuccessResponse" },
              },
            },
          },
          "400": {
            description: "Query khong hop le",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
      post: {
        tags: ["Categories"],
        summary: "Admin tao category moi",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CategoryCreateRequest" },
            },
          },
        },
        responses: {
          "201": {
            description: "Tao danh muc thanh cong",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CategoryCreateSuccessResponse" },
              },
            },
          },
          "400": {
            description: "Du lieu khong hop le",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "401": {
            description: "Chua xac thuc",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "403": {
            description: "Khong du quyen ADMIN",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "409": {
            description: "Trung name hoac slug",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/catalog/products": {
      get: {
        tags: ["Products"],
        summary: "Lay danh sach san pham public",
        parameters: [
          {
            name: "page",
            in: "query",
            required: false,
            schema: { type: "integer", minimum: 1, default: 1 },
          },
          {
            name: "limit",
            in: "query",
            required: false,
            schema: { type: "integer", minimum: 1, maximum: 100, default: 12 },
          },
          {
            name: "shopId",
            in: "query",
            required: false,
            schema: { type: "integer", minimum: 1 },
          },
          {
            name: "categoryId",
            in: "query",
            required: false,
            schema: { type: "integer", minimum: 1 },
          },
          {
            name: "keyword",
            in: "query",
            required: false,
            schema: { type: "string" },
          },
          {
            name: "sortBy",
            in: "query",
            required: false,
            schema: { type: "string", enum: ["latest", "oldest", "price_asc", "price_desc"] },
          },
        ],
        responses: {
          "200": {
            description: "Lay danh sach san pham thanh cong",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PublicProductListSuccessResponse" },
              },
            },
          },
          "400": {
            description: "Query khong hop le",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
      post: {
        tags: ["Products"],
        summary: "Seller tao san pham moi",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ProductCreateRequest" },
            },
          },
        },
        responses: {
          "201": {
            description: "Tao san pham thanh cong",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ProductSuccessResponse" },
              },
            },
          },
          "400": {
            description: "Du lieu khong hop le",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "401": {
            description: "Chua xac thuc",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "403": {
            description: "Khong co quyen",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/catalog/products/{productId}": {
      get: {
        tags: ["Products"],
        summary: "Lay chi tiet san pham public",
        parameters: [
          {
            name: "productId",
            in: "path",
            required: true,
            schema: { type: "integer", minimum: 1 },
            example: 10,
          },
        ],
        responses: {
          "200": {
            description: "Lay chi tiet san pham thanh cong",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PublicProductDetailSuccessResponse" },
              },
            },
          },
          "404": {
            description: "San pham khong ton tai",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
      put: {
        tags: ["Products"],
        summary: "Seller cap nhat san pham cua shop minh",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "productId",
            in: "path",
            required: true,
            schema: { type: "integer" },
            example: 10,
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ProductUpdateRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Cap nhat san pham thanh cong",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ProductSuccessResponse" },
              },
            },
          },
          "400": {
            description: "Du lieu khong hop le",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "404": {
            description: "Product khong ton tai",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "409": {
            description: "Product da bi xoa mem",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
      delete: {
        tags: ["Products"],
        summary: "Seller xoa mem san pham",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "productId",
            in: "path",
            required: true,
            schema: { type: "integer" },
            example: 10,
          },
        ],
        responses: {
          "200": {
            description: "Xoa mem san pham thanh cong",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ProductSuccessResponse" },
              },
            },
          },
          "404": {
            description: "Product khong ton tai",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "409": {
            description: "Product da bi xoa mem",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/catalog/products/{productId}/stock": {
      patch: {
        tags: ["Products"],
        summary: "Seller cap nhat ton kho product",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "productId",
            in: "path",
            required: true,
            schema: { type: "integer" },
            example: 10,
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ProductStockPatchRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Cap nhat ton kho thanh cong",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ProductStockSuccessResponse" },
              },
            },
          },
          "400": {
            description: "Du lieu khong hop le",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "404": {
            description: "Product khong ton tai",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "409": {
            description: "Product da bi xoa mem",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
  },
};

export default openApiDocument;
