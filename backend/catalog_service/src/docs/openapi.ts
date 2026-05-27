const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "Catalog Service API",
    version: "1.0.0",
    description: "API quan ly shop, category, product cho he thong e-commerce",
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "API Gateway (Port 3000)",
    },
    {
      url: "http://localhost:3002",
      description: "Catalog Service Local (Port 3002)",
    },
  ],
  tags: [
    { name: "Categories", description: "Quan ly category" },
    { name: "Products", description: "Quan ly product cho seller" },
    { name: "Shops", description: "Quan ly shop cho seller va nguoi dung" },
    { name: "Admin", description: "Quan tri he thong (ADMIN)" },
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
      CategoryUpdateRequest: {
        type: "object",
        properties: {
          name: { type: "string", example: "Thoi trang nam" },
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
      CategoryDeleteSuccessResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string", example: "Xoa danh muc thanh cong" },
          data: {
            type: "object",
            properties: {
              deleted: { type: "boolean", example: true },
              category: { $ref: "#/components/schemas/CategoryData" },
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
                  minPrice: { type: "number", nullable: true, example: 100000 },
                  maxPrice: { type: "number", nullable: true, example: 500000 },
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
      ShopData: {
        type: "object",
        properties: {
          id: { oneOf: [{ type: "number" }, { type: "string" }], example: 3001 },
          sellerId: { oneOf: [{ type: "number" }, { type: "string" }], example: 1001 },
          name: { type: "string", example: "CNWeb Tech Store" },
          slug: { type: "string", example: "cnweb-tech-store" },
          address: { type: "string", example: "12 Nguyen Hue, Quan 1, TP.HCM" },
          description: { type: "string", example: "Shop cong nghe chuyen phu kien va thiet bi so." },
          status: { type: "string", enum: ["ACTIVE", "INACTIVE", "PENDING"], example: "ACTIVE" },
          createdAt: { type: "string", format: "date-time", example: "2026-05-16T00:00:00.000Z" },
          updatedAt: { type: "string", format: "date-time", example: "2026-05-16T00:00:00.000Z" },
        },
      },
      ShopCreateRequest: {
        type: "object",
        required: ["name", "address"],
        properties: {
          name: { type: "string", example: "CNWeb Tech Store" },
          address: { type: "string", example: "12 Nguyen Hue, Quan 1, TP.HCM" },
          logoUrl: { type: "string", example: "https://example.com/logo.png" },
          description: { type: "string", example: "Shop cong nghe chuyen phu kien va thiet bi so." },
        },
      },
      ShopUpdateRequest: {
        type: "object",
        properties: {
          name: { type: "string", example: "CNWeb Tech Store V2" },
          address: { type: "string", example: "14 Nguyen Hue, Quan 1, TP.HCM" },
          logoUrl: { type: "string", example: "https://example.com/logo-v2.png" },
          description: { type: "string", example: "Mo ta moi." },
        },
      },
      ShopSuccessResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string", example: "Thanh cong" },
          data: {
            type: "object",
            properties: {
              shop: { $ref: "#/components/schemas/ShopData" },
            },
          },
        },
      },
      ShopListSuccessResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string", example: "Thanh cong" },
          data: {
            type: "object",
            properties: {
              shops: {
                type: "array",
                items: { $ref: "#/components/schemas/ShopData" },
              },
              pagination: {
                type: "object",
                properties: {
                  page: { type: "integer", example: 1 },
                  limit: { type: "integer", example: 20 },
                  total: { type: "integer", example: 5 },
                  totalPages: { type: "integer", example: 1 },
                },
              },
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
    "/api/catalog/categories/{categoryId}": {
      put: {
        tags: ["Categories"],
        summary: "Admin cap nhat category",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "categoryId",
            in: "path",
            required: true,
            schema: { type: "integer", minimum: 1 },
            example: 2,
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CategoryUpdateRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Cap nhat danh muc thanh cong",
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
          "404": {
            description: "Category khong ton tai",
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
      delete: {
        tags: ["Categories"],
        summary: "Admin xoa category neu chua co product",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "categoryId",
            in: "path",
            required: true,
            schema: { type: "integer", minimum: 1 },
            example: 2,
          },
        ],
        responses: {
          "200": {
            description: "Xoa danh muc thanh cong",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CategoryDeleteSuccessResponse" },
              },
            },
          },
          "404": {
            description: "Category khong ton tai",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "409": {
            description: "Category dang co product",
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
            name: "q",
            in: "query",
            required: false,
            schema: { type: "string" },
          },
          {
            name: "minPrice",
            in: "query",
            required: false,
            schema: { type: "number", minimum: 0 },
          },
          {
            name: "maxPrice",
            in: "query",
            required: false,
            schema: { type: "number", minimum: 0 },
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
    "/api/catalog/shops": {
      post: {
        tags: ["Shops"],
        summary: "Seller tao shop moi",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ShopCreateRequest" },
            },
          },
        },
        responses: {
          "201": {
            description: "Tao shop thanh cong",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ShopSuccessResponse" },
              },
            },
          },
          "400": {
            description: "Du lieu khong hop le hoac Seller da co shop",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
      get: {
        tags: ["Shops"],
        summary: "Lay danh sach shop (Public)",
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", example: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", example: 20 } },
          { name: "q", in: "query", schema: { type: "string" }, description: "Tim kiem theo ten shop" },
          { name: "status", in: "query", schema: { type: "string", enum: ["ACTIVE", "INACTIVE"] } },
        ],
        responses: {
          "200": {
            description: "Lay danh sach shop thanh cong",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ShopListSuccessResponse" },
              },
            },
          },
        },
      },
    },
    "/api/catalog/shops/my-shop": {
      get: {
        tags: ["Shops"],
        summary: "Seller lay thong tin shop cua minh",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Thanh cong",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ShopSuccessResponse" },
              },
            },
          },
          "404": {
            description: "Khong tim thay shop",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
      put: {
        tags: ["Shops"],
        summary: "Seller cap nhat thong tin shop cua minh",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ShopUpdateRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Cap nhat thanh cong",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ShopSuccessResponse" },
              },
            },
          },
        },
      },
    },
    "/api/catalog/shops/{id}": {
      get: {
        tags: ["Shops"],
        summary: "Lay chi tiet shop theo ID (Public)",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" }, example: 3001 },
        ],
        responses: {
          "200": {
            description: "Thanh cong",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/ShopSuccessResponse" },
                    {
                      type: "object",
                      properties: {
                        stats: {
                          type: "object",
                          properties: {
                            productCount: { type: "integer", example: 12 },
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          "404": {
            description: "Shop khong ton tai",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/catalog/admin/shops": {
      get: {
        tags: ["Admin"],
        summary: "Admin lay danh sach shop",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", example: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", example: 20 } },
          { name: "q", in: "query", schema: { type: "string" } },
          { name: "status", in: "query", schema: { type: "string", enum: ["ACTIVE", "INACTIVE", "PENDING"] } },
        ],
        responses: {
          "200": {
            description: "Thanh cong",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ShopListSuccessResponse" },
              },
            },
          },
        },
      },
    },
    "/api/catalog/admin/shops/{shopId}": {
      get: {
        tags: ["Admin"],
        summary: "Admin lay chi tiet shop",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "shopId", in: "path", required: true, schema: { type: "integer" }, example: 3001 },
        ],
        responses: {
          "200": {
            description: "Thanh cong",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ShopSuccessResponse" },
              },
            },
          },
        },
      },
    },
    "/api/catalog/admin/shops/{shopId}/status": {
      patch: {
        tags: ["Admin"],
        summary: "Admin duyet/khoa status cua shop",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "shopId", in: "path", required: true, schema: { type: "integer" }, example: 3001 },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["status"],
                properties: {
                  status: { type: "string", enum: ["ACTIVE", "INACTIVE", "PENDING"], example: "ACTIVE" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Cap nhat thanh cong",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ShopSuccessResponse" },
              },
            },
          },
        },
      },
    },
    "/api/catalog/admin/products": {
      get: {
        tags: ["Admin"],
        summary: "Admin lay danh sach tat ca san pham",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", example: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", example: 20 } },
          { name: "q", in: "query", schema: { type: "string" } },
          { name: "status", in: "query", schema: { type: "string", enum: ["ACTIVE", "INACTIVE", "OUT_OF_STOCK", "DELETED"] } },
          { name: "shopId", in: "query", schema: { type: "integer" } },
          { name: "categoryId", in: "query", schema: { type: "integer" } },
        ],
        responses: {
          "200": {
            description: "Thanh cong",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        products: {
                          type: "array",
                          items: { $ref: "#/components/schemas/ProductData" },
                        },
                        pagination: {
                          type: "object",
                          properties: {
                            page: { type: "integer", example: 1 },
                            limit: { type: "integer", example: 20 },
                            total: { type: "integer", example: 50 },
                            totalPages: { type: "integer", example: 3 },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/catalog/admin/products/{productId}": {
      get: {
        tags: ["Admin"],
        summary: "Admin lay chi tiet san pham",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "productId", in: "path", required: true, schema: { type: "integer" }, example: 10 },
        ],
        responses: {
          "200": {
            description: "Thanh cong",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ProductSuccessResponse" },
              },
            },
          },
        },
      },
      put: {
        tags: ["Admin"],
        summary: "Admin cap nhat bat ky san pham nao",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "productId", in: "path", required: true, schema: { type: "integer" }, example: 10 },
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
            description: "Cap nhat thanh cong",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ProductSuccessResponse" },
              },
            },
          },
        },
      },
      delete: {
        tags: ["Admin"],
        summary: "Admin xoa mem san pham",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "productId", in: "path", required: true, schema: { type: "integer" }, example: 10 },
        ],
        responses: {
          "200": {
            description: "Xoa thanh cong",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ProductSuccessResponse" },
              },
            },
          },
        },
      },
    },
  },
};

export default openApiDocument;
