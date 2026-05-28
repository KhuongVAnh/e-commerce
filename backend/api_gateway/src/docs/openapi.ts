const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "Notification Service API",
    version: "1.0.0",
    description: "API quản lý thông báo (Notification) thuộc API Gateway",
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "API Gateway (Port 3000)",
    },
  ],
  tags: [
    { name: "Notifications", description: "Quản lý thông báo người dùng" },
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
      Notification: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          userId: { type: "integer", example: 1001 },
          type: { type: "string", example: "order.created" },
          title: { type: "string", example: "Đặt hàng thành công" },
          content: { type: "string", example: "Đơn hàng ORD-CNW-1723485728 của bạn đã được tạo thành công." },
          metadata: { 
            type: "object", 
            nullable: true,
            properties: {
              orderCode: { type: "string", example: "ORD-CNW-1723485728" },
              orderId: { type: "integer", example: 5 },
            }
          },
          isRead: { type: "boolean", example: false },
          readAt: { type: "string", format: "date-time", nullable: true, example: null },
          createdAt: { type: "string", format: "date-time", example: "2026-05-28T03:30:00.000Z" },
        },
      },
      NotificationListResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string", example: "Lấy danh sách thông báo thành công" },
          data: {
            type: "object",
            properties: {
              notifications: {
                type: "array",
                items: {
                  $ref: "#/components/schemas/Notification",
                },
              },
              unreadCount: { type: "integer", example: 3 },
            },
          },
          pagination: {
            type: "object",
            properties: {
              page: { type: "integer", example: 1 },
              limit: { type: "integer", example: 20 },
              total: { type: "integer", example: 15 },
              totalPages: { type: "integer", example: 1 },
            },
          },
          requestId: { type: "string", example: "req-12345" },
        },
      },
      NotificationDetailResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string", example: "Lấy chi tiết thông báo thành công" },
          data: {
            type: "object",
            properties: {
              notification: {
                $ref: "#/components/schemas/Notification",
              },
            },
          },
          requestId: { type: "string", example: "req-12345" },
        },
      },
      SuccessResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string", example: "Thao tác thành công" },
          data: { type: "object", nullable: true },
          requestId: { type: "string", example: "req-12345" },
        },
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
  paths: {
    "/api/notifications/me": {
      get: {
        summary: "Lấy danh sách thông báo của tài khoản đang đăng nhập",
        tags: ["Notifications"],
        parameters: [
          {
            name: "page",
            in: "query",
            description: "Số trang",
            required: false,
            schema: { type: "integer", default: 1 },
          },
          {
            name: "limit",
            in: "query",
            description: "Số lượng thông báo trên một trang",
            required: false,
            schema: { type: "integer", default: 20 },
          },
          {
            name: "isRead",
            in: "query",
            description: "Lọc theo trạng thái đã đọc hay chưa (true/false)",
            required: false,
            schema: { type: "boolean" },
          },
        ],
        responses: {
          200: {
            description: "Danh sách thông báo và số lượng tin nhắn chưa đọc",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/NotificationListResponse",
                },
              },
            },
          },
          401: {
            description: "Chưa xác thực (Unauthorized)",
          },
        },
      },
    },
    "/api/notifications/read-all": {
      patch: {
        summary: "Đánh dấu đã đọc toàn bộ thông báo",
        tags: ["Notifications"],
        responses: {
          200: {
            description: "Đánh dấu đọc tất cả thành công",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/SuccessResponse",
                },
              },
            },
          },
          401: {
            description: "Chưa xác thực (Unauthorized)",
          },
        },
      },
    },
    "/api/notifications/{id}": {
      get: {
        summary: "Xem chi tiết một thông báo",
        tags: ["Notifications"],
        parameters: [
          {
            name: "id",
            in: "path",
            description: "ID của thông báo",
            required: true,
            schema: { type: "integer" },
          },
        ],
        responses: {
          200: {
            description: "Chi tiết thông báo",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/NotificationDetailResponse",
                },
              },
            },
          },
          401: {
            description: "Chưa xác thực (Unauthorized)",
          },
          404: {
            description: "Không tìm thấy thông báo",
          },
        },
      },
    },
    "/api/notifications/{id}/read": {
      patch: {
        summary: "Đánh dấu đã đọc một thông báo",
        tags: ["Notifications"],
        parameters: [
          {
            name: "id",
            in: "path",
            description: "ID của thông báo",
            required: true,
            schema: { type: "integer" },
          },
        ],
        responses: {
          200: {
            description: "Đánh dấu đã đọc thành công",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/NotificationDetailResponse",
                },
              },
            },
          },
          401: {
            description: "Chưa xác thực (Unauthorized)",
          },
          404: {
            description: "Không tìm thấy thông báo",
          },
        },
      },
    },
  },
};

export default openApiDocument;
