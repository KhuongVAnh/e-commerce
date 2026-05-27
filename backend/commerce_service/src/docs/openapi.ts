const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "Commerce Service API",
    version: "1.0.0",
    description: "API quan ly gio hang, don hang, thanh toan va thong ke cho he thong e-commerce",
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "API Gateway (Port 3000)",
    },
    {
      url: "http://localhost:3003",
      description: "Commerce Service Local (Port 3003)",
    },
  ],
  tags: [
    { name: "Cart", description: "Quan ly gio hang" },
    { name: "Orders", description: "Quan ly don hang" },
    { name: "Payments", description: "Thanh toan" },
    { name: "Stats", description: "Thong ke" },
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
      CartItem: {
        type: "object",
        properties: {
          id: { type: "string", example: "cart-item-123" },
          productId: { type: "string", example: "4001" },
          productName: { type: "string", example: "Tai nghe Bluetooth CNB-01" },
          thumbnailUrl: { type: "string", nullable: true, example: "https://picsum.photos/seed/cnb01/800/800" },
          price: { type: "number", example: 890000 },
          quantity: { type: "integer", example: 1 },
          lineTotal: { type: "number", example: 890000 },
        },
      },
      CartShopGroup: {
        type: "object",
        properties: {
          shopId: { type: "string", example: "3001" },
          shopName: { type: "string", example: "CNWeb Tech Store" },
          items: {
            type: "array",
            items: { $ref: "#/components/schemas/CartItem" },
          },
          totalQuantity: { type: "integer", example: 3 },
          subtotal: { type: "number", example: 3470000 },
        },
      },
      CartResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          data: {
            type: "object",
            properties: {
              cartId: { type: "string", nullable: true, example: "cart-123" },
              customerId: { type: "string", example: "1003" },
              shops: {
                type: "array",
                items: { $ref: "#/components/schemas/CartShopGroup" },
              },
              totalQuantity: { type: "integer", example: 3 },
            },
          },
        },
      },
      CartItemAddRequest: {
        type: "object",
        required: ["productId"],
        properties: {
          productId: { type: "integer", example: 4001 },
          quantity: { type: "integer", minimum: 1, default: 1, example: 1 },
        },
      },
      CartItemUpdateRequest: {
        type: "object",
        required: ["quantity"],
        properties: {
          quantity: { type: "integer", minimum: 1, example: 2 },
        },
      },
      CheckoutPreviewRequest: {
        type: "object",
        required: ["shopId", "cartItemIds"],
        properties: {
          shopId: { type: "string", example: "3001" },
          cartItemIds: {
            type: "array",
            items: { type: "string" },
            example: ["cart-item-123", "cart-item-456"],
          },
        },
      },
      CheckoutRequest: {
        type: "object",
        required: ["shopId", "cartItemIds", "paymentMethod", "receiverName", "receiverPhone", "receiverAddress"],
        properties: {
          shopId: { type: "string", example: "3001" },
          cartItemIds: {
            type: "array",
            items: { type: "string" },
            example: ["cart-item-123"],
          },
          paymentMethod: { type: "string", enum: ["COD", "VNPAY"], example: "COD" },
          receiverName: { type: "string", example: "Customer One" },
          receiverPhone: { type: "string", example: "0900000001" },
          receiverAddress: { type: "string", example: "100 Nguyen Trai, Quan 5, TP.HCM" },
          note: { type: "string", example: "Goi truoc khi giao." },
        },
      },
      OrderData: {
        type: "object",
        properties: {
          id: { type: "string", example: "5001" },
          orderCode: { type: "string", example: "ORD-CNW-0001" },
          customerId: { type: "string", example: "1003" },
          shopId: { type: "string", example: "3001" },
          totalAmount: { type: "number", example: 1710000 },
          shippingFee: { type: "number", example: 30000 },
          paymentMethod: { type: "string", enum: ["COD", "VNPAY"], example: "COD" },
          paymentStatus: { type: "string", enum: ["PENDING", "PAID", "FAILED", "COD_PENDING"], example: "COD_PENDING" },
          orderStatus: { type: "string", enum: ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"], example: "CONFIRMED" },
          receiverName: { type: "string", example: "Customer One" },
          receiverPhone: { type: "string", example: "0900000001" },
          receiverAddress: { type: "string", example: "100 Nguyen Trai, Quan 5, TP.HCM" },
          note: { type: "string", nullable: true, example: "Goi truoc khi giao." },
          createdAt: { type: "string", format: "date-time", example: "2026-05-26T15:00:00.000Z" },
          updatedAt: { type: "string", format: "date-time", example: "2026-05-26T15:00:00.000Z" },
        },
      },
      OrderListItem: {
        type: "object",
        properties: {
          id: { type: "string", example: "5001" },
          productId: { type: "string", example: "4001" },
          productNameSnapshot: { type: "string", example: "Tai nghe Bluetooth CNB-01" },
          priceSnapshot: { type: "number", example: 890000 },
          quantity: { type: "integer", example: 1 },
          subtotal: { type: "number", example: 890000 },
        },
      },
      PaymentData: {
        type: "object",
        properties: {
          id: { type: "string", example: "pay-123" },
          orderId: { type: "string", example: "5001" },
          method: { type: "string", enum: ["COD", "VNPAY"], example: "COD" },
          amount: { type: "number", example: 1710000 },
          status: { type: "string", enum: ["PENDING", "SUCCESS", "FAILED"], example: "PENDING" },
          transactionRef: { type: "string", example: "COD-ORD-CNW-0001" },
          providerResponse: { type: "string", nullable: true },
          checkoutUrlExpiresAt: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
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
                    field: { type: "string", example: "receiverPhone" },
                    message: { type: "string", example: "So dien thoai khong hop le" },
                  },
                },
              },
              hint: { type: "string", nullable: true, example: null },
            },
          },
          meta: {
            type: "object",
            properties: {
              requestId: { type: "string", example: "req_001" },
              timestamp: { type: "string", format: "date-time" },
              version: { type: "string", example: "v1" },
            },
          },
        },
      },
    },
  },
  paths: {
    "/api/commerce/cart": {
      get: {
        tags: ["Cart"],
        summary: "Lay chi tiet gio hang cua User hien tai",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Thanh cong",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CartResponse" },
              },
            },
          },
        },
      },
    },
    "/api/commerce/cart/items": {
      post: {
        tags: ["Cart"],
        summary: "Them san pham vao gio hang",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CartItemAddRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Them thanh cong",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        id: { type: "string", example: "cart-item-123" },
                        cartId: { type: "string", example: "cart-123" },
                        productId: { type: "string", example: "4001" },
                        shopId: { type: "string", example: "3001" },
                        quantity: { type: "integer", example: 1 },
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
    "/api/commerce/cart/items/{id}": {
      patch: {
        tags: ["Cart"],
        summary: "Cap nhat so luong san pham trong gio hang",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" }, example: "cart-item-123" },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CartItemUpdateRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Cap nhat thanh cong",
          },
        },
      },
      delete: {
        tags: ["Cart"],
        summary: "Xoa san pham khoi gio hang",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" }, example: "cart-item-123" },
        ],
        responses: {
          "204": {
            description: "Xoa thanh cong (Khong tra ve body)",
          },
        },
      },
    },
    "/api/commerce/cart/checkout-preview": {
      post: {
        tags: ["Cart"],
        summary: "Xem truoc thong tin tinh tien cua gio hang truoc khi checkout",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CheckoutPreviewRequest" },
            },
          },
        },
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
                        shopId: { type: "string", example: "3001" },
                        items: { type: "array", items: { type: "object" } },
                        pricing: {
                          type: "object",
                          properties: {
                            subtotal: { type: "number", example: 1710000 },
                            shippingFee: { type: "number", example: 30000 },
                            grandTotal: { type: "number", example: 1740000 },
                          },
                        },
                        canCheckout: { type: "boolean", example: true },
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
    "/api/commerce/orders/checkout": {
      post: {
        tags: ["Orders"],
        summary: "Tien hanh dat hang va thanh toan",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CheckoutRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Dat hang thanh cong",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        orderId: { type: "string", example: "5001" },
                        orderCode: { type: "string", example: "ORD-CNW-0001" },
                        orderStatus: { type: "string", example: "PENDING" },
                        paymentStatus: { type: "string", example: "PENDING" },
                        totalAmount: { type: "number", example: 1740000 },
                        paymentUrl: { type: "string", nullable: true, example: "https://sandbox.vnpayment.vn/..." },
                        paymentUrlExpiresAt: { type: "string", nullable: true },
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
    "/api/commerce/orders/{orderCode}/payment-url": {
      get: {
        tags: ["Orders"],
        summary: "Lay lai URL thanh toan VNPAY (truong hop VNPay va link chua het han)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "orderCode", in: "path", required: true, schema: { type: "string" }, example: "ORD-CNW-0002" },
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
                        orderId: { type: "string", example: "5002" },
                        orderCode: { type: "string", example: "ORD-CNW-0002" },
                        paymentUrl: { type: "string", example: "https://sandbox.vnpayment.vn/..." },
                        expiresAt: { type: "string" },
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
    "/api/commerce/orders/{orderCode}/check-result": {
      get: {
        tags: ["Orders"],
        summary: "Khách hàng check ket qua thanh toan sau khi redirect",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "orderCode", in: "path", required: true, schema: { type: "string" }, example: "ORD-CNW-0002" },
        ],
        responses: {
          "200": {
            description: "Thanh cong",
          },
        },
      },
    },
    "/api/commerce/orders/{orderCode}/cancel": {
      post: {
        tags: ["Orders"],
        summary: "Khach hang yeu cau huy don hang",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "orderCode", in: "path", required: true, schema: { type: "string" }, example: "ORD-CNW-0001" },
        ],
        responses: {
          "200": {
            description: "Huy don thanh cong",
          },
        },
      },
    },
    "/api/commerce/orders/my": {
      get: {
        tags: ["Orders"],
        summary: "Khach hang xem lich su don hang cua minh",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "status", in: "query", schema: { type: "string" } },
          { name: "page", in: "query", schema: { type: "integer" } },
          { name: "limit", in: "query", schema: { type: "integer" } },
        ],
        responses: {
          "200": {
            description: "Thanh cong",
          },
        },
      },
    },
    "/api/commerce/orders/{id}": {
      get: {
        tags: ["Orders"],
        summary: "Khach hang xem chi tiet don hang theo ID",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" }, example: "5001" },
        ],
        responses: {
          "200": {
            description: "Thanh cong",
          },
        },
      },
    },
    "/api/commerce/seller/orders": {
      get: {
        tags: ["Orders"],
        summary: "Seller xem danh sach don hang cua shop minh",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "status", in: "query", schema: { type: "string" } },
        ],
        responses: {
          "200": {
            description: "Thanh cong",
          },
        },
      },
    },
    "/api/commerce/seller/orders/{id}": {
      get: {
        tags: ["Orders"],
        summary: "Seller xem chi tiet don hang",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" }, example: "5001" },
        ],
        responses: {
          "200": {
            description: "Thanh cong",
          },
        },
      },
    },
    "/api/commerce/seller/orders/{id}/status": {
      patch: {
        tags: ["Orders"],
        summary: "Seller cap nhat trang thai don hang",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" }, example: "5001" },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["status"],
                properties: {
                  status: { type: "string", enum: ["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"] },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Cap nhat thanh cong",
          },
        },
      },
    },
    "/api/commerce/admin/orders": {
      get: {
        tags: ["Orders"],
        summary: "Admin lay tat ca don hang trong he thong",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer" } },
          { name: "limit", in: "query", schema: { type: "integer" } },
          { name: "q", in: "query", schema: { type: "string" }, description: "Order Code" },
          { name: "status", in: "query", schema: { type: "string" } },
          { name: "paymentStatus", in: "query", schema: { type: "string" } },
          { name: "paymentMethod", in: "query", schema: { type: "string" } },
          { name: "shopId", in: "query", schema: { type: "integer" } },
          { name: "customerId", in: "query", schema: { type: "integer" } },
        ],
        responses: {
          "200": {
            description: "Thanh cong",
          },
        },
      },
    },
    "/api/commerce/admin/orders/{orderId}": {
      get: {
        tags: ["Orders"],
        summary: "Admin xem chi tiet don hang",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "orderId", in: "path", required: true, schema: { type: "integer" }, example: 5001 },
        ],
        responses: {
          "200": {
            description: "Thanh cong",
          },
        },
      },
    },
    "/api/commerce/admin/orders/{orderId}/status": {
      patch: {
        tags: ["Orders"],
        summary: "Admin can thiep trang thai don hang",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "orderId", in: "path", required: true, schema: { type: "integer" }, example: 5001 },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["status"],
                properties: {
                  status: { type: "string", enum: ["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"] },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Cap nhat thanh cong",
          },
        },
      },
    },
    "/api/commerce/payments/vnpay-return": {
      get: {
        tags: ["Payments"],
        summary: "VNPay return URL callback (IPN)",
        responses: {
          "200": {
            description: "Thanh cong",
          },
        },
      },
    },
    "/api/commerce/payments/check-result": {
      get: {
        tags: ["Payments"],
        summary: "Frontend gui toan bo query params de Backend verify chu ky va lay ket qua thanh toan",
        responses: {
          "200": {
            description: "Thanh cong",
          },
        },
      },
    },
    "/api/commerce/payments/order/{orderId}": {
      get: {
        tags: ["Payments"],
        summary: "Lay chi tiet payment cua mot don hang",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "orderId", in: "path", required: true, schema: { type: "integer" }, example: 5001 },
        ],
        responses: {
          "200": {
            description: "Thanh cong",
          },
        },
      },
    },
    "/api/commerce/seller/revenue-summary": {
      get: {
        tags: ["Stats"],
        summary: "Seller xem thong ke doanh thu cua cua hang minh",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "from", in: "query", schema: { type: "string" }, description: "ISO date string" },
          { name: "to", in: "query", schema: { type: "string" }, description: "ISO date string" },
        ],
        responses: {
          "200": {
            description: "Thanh cong",
          },
        },
      },
    },
    "/api/commerce/admin/dashboard-summary": {
      get: {
        tags: ["Stats"],
        summary: "Admin xem thong ke doanh thu va don hang toan quoc",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "from", in: "query", schema: { type: "string" } },
          { name: "to", in: "query", schema: { type: "string" } },
        ],
        responses: {
          "200": {
            description: "Thanh cong",
          },
        },
      },
    },
  },
};

export default openApiDocument;
