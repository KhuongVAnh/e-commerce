const REFRESH_TOKEN_COOKIE_NAME = process.env.REFRESH_TOKEN_COOKIE_NAME || "refreshToken";

const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "Auth Service API",
    version: "1.0.0",
    description: "API tai khoan va xac thuc cho he thong e-commerce",
  },
  servers: [
    {
      url: "http://localhost:3001",
      description: "Local",
    },
  ],
  tags: [
    { name: "Auth", description: "Xac thuc nguoi dung" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
      refreshTokenCookie: {
        type: "apiKey",
        in: "cookie",
        name: REFRESH_TOKEN_COOKIE_NAME,
      },
    },
    schemas: {
      RegisterRequest: {
        type: "object",
        required: ["email", "password", "fullName"],
        properties: {
          email: { type: "string", example: "user@gmail.com" },
          password: { type: "string", example: "123456" },
          fullName: { type: "string", example: "Nguyen Van A" },
          role: { type: "string", enum: ["CUSTOMER", "SELLER"], example: "CUSTOMER" },
        },
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", example: "user@gmail.com" },
          password: { type: "string", example: "123456" },
          role: { type: "string", enum: ["CUSTOMER", "SELLER", "ADMIN"], example: "CUSTOMER" },
        },
      },
      SuccessResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string", example: "Thanh cong" },
          data: { type: "object" },
          meta: {
            type: "object",
            properties: {
              requestId: { type: "string", example: "req_001" },
              timestamp: { type: "string", example: "2026-04-09T10:00:00Z" },
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
                    field: { type: "string", example: "email" },
                    message: { type: "string", example: "Email da ton tai" },
                  },
                },
              },
              hint: { type: "string", nullable: true, example: "Kiem tra lai du lieu nhap" },
            },
          },
          meta: {
            type: "object",
            properties: {
              requestId: { type: "string", example: "req_001" },
              timestamp: { type: "string", example: "2026-04-09T10:00:00Z" },
              version: { type: "string", example: "v1" },
            },
          },
        },
      },
    },
  },
  paths: {
    "/api/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Dang ky tai khoan moi",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/RegisterRequest",
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Dang ky thanh cong",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessResponse" },
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
        },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Dang nhap va cap token",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/LoginRequest",
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Dang nhap thanh cong",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessResponse" },
              },
            },
          },
          "401": {
            description: "Sai thong tin dang nhap",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/auth/refresh": {
      post: {
        tags: ["Auth"],
        summary: "Cap lai access token va rotate refresh token",
        security: [{ refreshTokenCookie: [] }],
        responses: {
          "200": {
            description: "Lam moi token thanh cong",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessResponse" },
              },
            },
          },
          "401": {
            description: "Refresh token khong hop le hoac da het han",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Dang xuat va thu hoi refresh token",
        security: [{ refreshTokenCookie: [] }],
        responses: {
          "200": {
            description: "Dang xuat thanh cong",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessResponse" },
              },
            },
          },
        },
      },
    },
    "/api/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Lay thong tin user hien tai",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Lay thong tin thanh cong",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessResponse" },
              },
            },
          },
          "401": {
            description: "Thieu hoac sai token",
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
