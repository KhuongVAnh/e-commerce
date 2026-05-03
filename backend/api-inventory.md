# API INVENTORY - TÀI LIỆU API CHÍNH

> Đây là tài liệu API chính thức của hệ thống backend. Cập nhật file này mỗi khi thêm hoặc thay đổi endpoint.

| Trạng thái | Ý nghĩa |
|---|---|
| **Đã có** | Endpoint đã implement và hoạt động |
| **Chưa có** | Endpoint được thiết kế nhưng chưa implement |
| **Lệch path** | Đã implement nhưng path khác với thiết kế ban đầu |

---

## 1. Quy ước response chuẩn

| Loại response | Payload chuẩn | Ghi chú |
|---|---|---|
| Success response | `{ "success": true, "message": "Thông báo nghiệp vụ", "data": {}, "meta": { "requestId": "req_xxxx", "timestamp": "ISO-8601", "pagination": null, "version": "v1", "warnings": [] } }` | Áp dụng cho hầu hết API thành công |
| Error response | `{ "success": false, "message": "Thông báo lỗi", "error": { "code": "ERROR_CODE", "details": [], "fieldErrors": [], "hint": "Gợi ý xử lý" }, "meta": { "requestId": "req_xxxx", "timestamp": "ISO-8601", "version": "v1" } }` | Áp dụng cho API lỗi |
| Exception | `204 No Content` | Riêng `DELETE /api/commerce/cart/items/:id` không trả body |

---

## 2. Auth API

| Trạng thái hiện tại | Method | Endpoint | Auth | Request payload | Response payload |
|---|---|---|---|---|---|
| Đã có | POST | `/api/auth/register` | Không | `email: string`<br>`password: string`<br>`fullName: string`<br>`role?: CUSTOMER, SELLER` | `user: { id, email, fullName, role, status, createdAt }` |
| Đã có | POST | `/api/auth/login` | Không | `email: string`<br>`password: string` | `user: { id, email, fullName, role }`<br>`tokens: { accessToken, accessExpiresAt, refreshExpiresAt }` |
| Đã có | POST | `/api/auth/refresh` | Cookie `refreshToken` | Không có body | `tokens: { accessToken, accessExpiresAt, refreshExpiresAt }` |
| Đã có | POST | `/api/auth/logout` | Bearer token + Cookie `refreshToken` | Không có body | `revoked: true` |
| Đã có | GET | `/api/auth/me` | Bearer token | Không có body | `user: { id, email, fullName, role, status }` |

---

## 3. Lưu ý riêng cho Auth

| Nội dung | Quy ước |
|---|---|
| Access token | Trả về trong response body tại `data.tokens.accessToken` |
| Refresh token | Server set vào cookie `refreshToken` |
| Login response | Không trả `refreshToken` trong body |
| Refresh token API | Frontend cần gửi cookie bằng `credentials: "include"` |
| Logout API | Cần gửi cả `Authorization: Bearer <accessToken>` và cookie `refreshToken` |

---

## 4. Shop API

| Trạng thái hiện tại | Method | Endpoint | Auth / Role | Request payload | Response payload |
|---|---|---|---|---|---|
| Đã có | POST | `/api/catalog/shops` | SELLER | `name: string`<br>`address: string`<br>`logoUrl?: string`<br>`description?: string` | `shop: { id, sellerId, name, slug, logoUrl, description, address, status, createdAt, updatedAt }` |
| Chưa có | GET | `/api/catalog/shops` | Public | Query optional:<br>`page?: number`<br>`limit?: number`<br>`q?: string`<br>`status?: ACTIVE, INACTIVE` | `[ { id, name, slug, logoUrl, status } ]`<br>`meta.pagination: { page, limit, total, totalPages }` |
| Chưa có | GET | `/api/catalog/shops/:id` | Public | Path param:<br>`id: number` | `shop: { id, sellerId, name, slug, logoUrl, description, address, status, createdAt }`<br>`stats: { productCount, followerCount }` |
| Đã có | GET | `/api/catalog/shops/my-shop` | SELLER | Không có body | `shop: { id, sellerId, name, slug, logoUrl, description, address, status, createdAt, updatedAt }` |
| Đã có | PUT | `/api/catalog/shops/my-shop` | SELLER | Ít nhất 1 field:<br>`name?: string`<br>`address?: string`<br>`logoUrl?: string`<br>`description?: string` | `shop: { id, sellerId, name, slug, logoUrl, description, address, status, createdAt, updatedAt }` |
| Chưa có | GET | `/api/catalog/admin/shops` | ADMIN | Query optional:<br>`page?: number`<br>`limit?: number`<br>`status?: ACTIVE, INACTIVE` | `[ { id, sellerId, name, status } ]`<br>`meta.pagination: { page, limit, total, totalPages }` |

---

## 5. Category API

| Trạng thái hiện tại | Method | Endpoint | Auth / Role | Request payload | Response payload |
|---|---|---|---|---|---|
| Đã có | GET | `/api/catalog/categories` | Public | Query optional:<br>`q?: string`<br>`status?: ACTIVE, INACTIVE` | `[ { id, name, slug, status } ]` |
| Đã có | POST | `/api/catalog/categories` | ADMIN | `name: string`<br>`status?: ACTIVE, INACTIVE` | `category: { id, name, slug, status }` |
| Chưa có | PUT | `/api/catalog/categories/:id` | ADMIN | Path param:<br>`id: number`<br><br>Body dự kiến:<br>`name?: string`<br>`status?: ACTIVE, INACTIVE` | Dự kiến:<br>`category: { id, name, slug, status }` |
| Chưa có | DELETE | `/api/catalog/categories/:id` | ADMIN | Path param:<br>`id: number`<br><br>Không có body | Dự kiến:<br>`category: { id, name, slug, status }` hoặc `{ deleted: true }` |

---

## 6. Product API

| Trạng thái hiện tại | Method | Endpoint | Auth / Role | Request payload | Response payload |
|---|---|---|---|---|---|
| Đã có | GET | `/api/catalog/products` | Public | Query optional:<br>`page?: number`<br>`limit?: number`<br>`shopId?: number`<br>`categoryId?: number`<br>`keyword?: string`<br>`q?: string`<br>`sortBy?: latest, oldest, price_asc, price_desc` | `[ { id, shopId, categoryId, name, slug, price, stockQuantity, thumbnailUrl, status } ]`<br>`meta.pagination: { page, limit, total, totalPages }`<br>`meta.filters: { keyword, shopId, categoryId, sortBy }` |
| Đã có | GET | `/api/catalog/products/:id` | Public | Path param:<br>`id: number` | `product: { id, shopId, categoryId, name, slug, description, price, stockQuantity, thumbnailUrl, status, createdAt, updatedAt }`<br>`images: [ { id, imageUrl, sortOrder } ]`<br>`shop: { id, name }` |
| Đã có | POST | `/api/catalog/products` | SELLER | `shopId: number`<br>`categoryId: number`<br>`name: string`<br>`description?: string`<br>`price: number`<br>`stockQuantity?: number`<br>`thumbnailUrl?: string`<br>`status?: ACTIVE, INACTIVE, OUT_OF_STOCK`<br>`images?: [ { imageUrl, sortOrder } ]` | `product: { id, shopId, categoryId, name, slug, description, price, stockQuantity, thumbnailUrl, status, deletedAt, createdAt, updatedAt, shop, category, images }` |
| Đã có | PUT | `/api/catalog/products/:id` | SELLER | Path param:<br>`id: number`<br><br>Body ít nhất 1 field:<br>`categoryId?: number`<br>`name?: string`<br>`description?: string`<br>`price?: number`<br>`stockQuantity?: number`<br>`thumbnailUrl?: string`<br>`status?: ACTIVE, INACTIVE, OUT_OF_STOCK`<br>`images?: [ { imageUrl, sortOrder } ]` | `product: { id, shopId, categoryId, name, slug, description, price, stockQuantity, thumbnailUrl, status, deletedAt, createdAt, updatedAt, shop, category, images }` |
| Đã có | DELETE | `/api/catalog/products/:id` | SELLER | Path param:<br>`id: number`<br><br>Không có body | `product: { id, status: DELETED, deletedAt }` |
| Đã có | PATCH | `/api/catalog/products/:id/stock` | SELLER | Path param:<br>`id: number`<br><br>Body:<br>`stockQuantity: number` | `product: { id, shopId, categoryId, name, slug, description, price, stockQuantity, thumbnailUrl, status, deletedAt, createdAt, updatedAt, shop, category, images }`<br>`previousStock: number`<br>`currentStock: number`<br>`updatedAt: ISO-8601` |

---

## 7. Cart API

| Trạng thái hiện tại | Method | Endpoint | Auth / Role | Request payload | Response payload |
|---|---|---|---|---|---|
| Đã có | GET | `/api/commerce/cart` | User đã đăng nhập | Không có body | Khi có cart:<br>`cartId: string`<br>`customerId: string`<br>`shops: [ { shopId, items: [ { id, productId, productName, thumbnailUrl, price, quantity, lineTotal } ], totalQuantity, subtotal } ]`<br>`totalQuantity: number`<br><br>Khi chưa có cart:<br>`cartId: null`<br>`customerId: string`<br>`shops: []`<br>`totalQuantity: 0` |
| Đã có | POST | `/api/commerce/cart/items` | User đã đăng nhập | `productId: number`<br>`quantity?: number` | `id: string`<br>`cartId: string`<br>`productId: string`<br>`shopId: string`<br>`quantity: number`<br>`createdAt: ISO-8601`<br>`updatedAt: ISO-8601` |
| Đã có | PATCH | `/api/commerce/cart/items/:id` | User đã đăng nhập | Path param:<br>`id: number`<br><br>Body:<br>`quantity: number` | `id: string`<br>`cartId: string`<br>`productId: string`<br>`shopId: string`<br>`quantity: number`<br>`createdAt: ISO-8601`<br>`updatedAt: ISO-8601` |
| Đã có | DELETE | `/api/commerce/cart/items/:id` | User đã đăng nhập | Path param:<br>`id: number`<br><br>Không có body | `204 No Content`<br>Không có response body |
| Đã có | POST | `/api/commerce/cart/checkout-preview` | User đã đăng nhập | `shopId: string`<br>`cartItemIds: string[]` | `shopId: string`<br>`items: [ { cartItemId, productId, productName, unitPrice, quantity, subtotal, valid, invalidReason } ]`<br>`pricing: { subtotal, shippingFee, grandTotal }`<br>`canCheckout: boolean` |

---

## 8. Ghi chú riêng cho Checkout Preview

| Nội dung | Ghi chú |
|---|---|
| Endpoint | `/api/commerce/cart/checkout-preview` |
| Trạng thái | **Đã có** |

---

## 9. Order API

| Trạng thái hiện tại | Method | Endpoint | Auth / Role | Request payload | Response payload |
|---|---|---|---|---|---|
| Đã có | POST | `/api/commerce/orders/checkout` | CUSTOMER | `shopId: string`<br>`cartItemIds: string[]`<br>`paymentMethod: COD, VNPAY`<br>`receiverName: string`<br>`receiverPhone: string`<br>`receiverAddress: string`<br>`note?: string` | `orderId: string`<br>`orderCode: string`<br>`orderStatus: OrderStatus`<br>`paymentStatus: PaymentStatus`<br><br>Nếu VNPAY: `meta.warnings` có hướng dẫn gọi `/payments/create-vnpay-url` |
| Đã có | GET | `/api/commerce/orders/my` | CUSTOMER | Query optional:<br>`status?: OrderStatus`<br>`page?: number`<br>`limit?: number` (tối đa 50) | `[ { id, orderCode, customerId, shopId, totalAmount, shippingFee, paymentMethod, paymentStatus, orderStatus, receiverName, receiverPhone, receiverAddress, note, createdAt, updatedAt, items[] } ]`<br>`meta.pagination: { page, limit, total, totalPages }` |
| Đã có | GET | `/api/commerce/orders/:id` | CUSTOMER | Path param:<br>`id: string` | `{ id, orderCode, customerId, shopId, totalAmount, shippingFee, paymentMethod, paymentStatus, orderStatus, receiverName, receiverPhone, receiverAddress, note, createdAt, updatedAt }`<br>`items: [ { id, orderId, productId, productNameSnapshot, priceSnapshot, quantity, subtotal } ]`<br>`payments: [ { id, method, amount, status, transactionRef, createdAt } ]` (payment mới nhất) |
| Đã có | PATCH | `/api/commerce/orders/:id/cancel` | CUSTOMER | Path param:<br>`id: string`<br><br>Không có body | `{ id: string, orderStatus: CANCELLED, updatedAt }` |
| Đã có | GET | `/api/commerce/seller/orders` | SELLER | Query optional:<br>`status?: OrderStatus`<br>`page?: number`<br>`limit?: number` (tối đa 50) | `[ { id, orderCode, customerId, shopId, totalAmount, paymentMethod, paymentStatus, orderStatus, createdAt, items[] } ]`<br>`meta.pagination: { page, limit, total, totalPages }` |
| Đã có | PATCH | `/api/commerce/seller/orders/:id/status` | SELLER | Path param:<br>`id: string`<br><br>Body:<br>`status: OrderStatus` | `{ id, orderCode, customerId, shopId, orderStatus, updatedAt, items[] }` |

### 9.1 Ghi chú riêng cho Order API

| Nội dung | Ghi chú |
|---|---|
| shopId lấy từ JWT | `PATCH /seller/orders/:id/status` và `GET /seller/orders` đọc `shopId` từ JWT payload. Auth Service cần gắn `shopId` vào token khi seller login |
| State machine hợp lệ (Seller) | `CONFIRMED → PROCESSING → SHIPPING → DELIVERED` |
| Customer cancel được khi | `orderStatus` là `PENDING` hoặc `CONFIRMED` |
| COD khởi tạo với | `orderStatus = CONFIRMED`, `paymentStatus = COD_PENDING` |
| VNPAY khởi tạo với | `orderStatus = AWAITING_PAYMENT`, `paymentStatus = PENDING` |
| Snapshot giá | `priceSnapshot` và `productNameSnapshot` trong `order_items` là bản sao tại lúc đặt hàng, không đổi kể cả khi Catalog thay đổi |

---

## 10. Payment API

| Trạng thái hiện tại | Method | Endpoint | Auth / Role | Request payload | Response payload |
|---|---|---|---|---|---|
| Chưa có | POST | `/api/commerce/payments/create-vnpay-url` | User đã đăng nhập | `orderId: number`<br>`returnUrl?: string` | `payment: { orderId, method: VNPAY, status, amount, transactionRef }`<br>`paymentUrl: string` |
| Chưa có | GET | `/api/commerce/payments/vnpay-return` | Public / VNPay callback | Query params từ VNPay:<br>`vnp_Amount`<br>`vnp_BankCode`<br>`vnp_ResponseCode`<br>`vnp_TxnRef`<br>`vnp_SecureHash`<br>`...` | Thành công:<br>`payment: { orderId, transactionRef, status: PAID, paidAt }`<br>`order: { id, orderStatus, paymentStatus }`<br><br>Thất bại dùng error wrapper với `error.code = PAYMENT_FAILED` |
| Chưa có | GET | `/api/commerce/payments/order/:orderId` | User đã đăng nhập | Path param:<br>`orderId: number` | `payment: { orderId, method, status, amount, transactionRef, providerResponse }` |

---

## 11. Notification API

| Trạng thái hiện tại | Method | Endpoint | Auth / Role | Request payload | Response payload |
|---|---|---|---|---|---|
| Chưa có | GET | `/api/notifications/me` | User đã đăng nhập | Query optional:<br>`page?: number`<br>`limit?: number`<br>`isRead?: boolean` | `notifications: [ { id, type, title, content, isRead, createdAt } ]`<br>`unreadCount: number`<br>`meta.pagination: { page, limit, total, totalPages }` |
| Chưa có | PATCH | `/api/notifications/:id/read` | User đã đăng nhập | Path param:<br>`id: number`<br><br>Không có body | `notification: { id, isRead: true, readAt }` |

---

## 12. Error response dùng chung

| Trường | Kiểu dữ liệu | Mô tả |
|---|---|---|
| `success` | boolean | Luôn là `false` khi lỗi |
| `message` | string | Thông báo lỗi ngắn gọn |
| `error.code` | string | Mã lỗi để frontend xử lý |
| `error.details` | array | Chi tiết lỗi nghiệp vụ |
| `error.fieldErrors` | array | Lỗi validate theo từng field |
| `error.hint` | string hoặc null | Gợi ý xử lý |
| `meta.requestId` | string | ID trace request |
| `meta.timestamp` | string | Thời điểm response |
| `meta.version` | string | Version response format |

---

## 13. Danh sách error code chuẩn

| Error code | Ý nghĩa | Service |
|---|---|---|
| `VALIDATION_ERROR` | Dữ liệu gửi lên không hợp lệ | Chung |
| `UNAUTHORIZED` | Chưa đăng nhập hoặc thiếu token | Chung |
| `FORBIDDEN` | Không có quyền truy cập | Chung |
| `INVALID_TOKEN` | Token không hợp lệ hoặc hết hạn | Auth |
| `RESOURCE_NOT_FOUND` | Không tìm thấy tài nguyên | Chung |
| `SHOP_ALREADY_EXISTS` | Seller đã có shop | Catalog |
| `SHOP_NOT_FOUND` | Không tìm thấy shop (thường khi seller chưa tạo shop) | Catalog / Commerce |
| `PRODUCT_NOT_FOUND` | Không tìm thấy sản phẩm | Catalog |
| `INSUFFICIENT_STOCK` | Không đủ tồn kho | Catalog |
| `NOT_ENOUGH_STOCK` | Số lượng yêu cầu vượt quá tồn kho (dùng trong Commerce) | Commerce |
| `OUT_OF_STOCK` | Sản phẩm đã hết hàng | Catalog |
| `CART_ITEM_NOT_FOUND` | Không tìm thấy mục trong giỏ hàng | Commerce |
| `CART_ITEM_LIMIT_REACHED` | Giỏ hàng đã đạt giới hạn số lượng mục | Commerce |
| `INVALID_CART_ITEMS` | Một số cart item không thuộc giỏ/shop của user | Commerce |
| `CHECKOUT_NOT_ALLOWED` | Không thể tạo đơn do một số sản phẩm không hợp lệ (hết hàng, ngừng bán) | Commerce |
| `ORDER_NOT_FOUND` | Không tìm thấy đơn hàng (hoặc không thuộc quyền truy cập) | Commerce |
| `CANCEL_NOT_ALLOWED` | Không thể hủy đơn ở trạng thái hiện tại | Commerce |
| `INVALID_STATUS_TRANSITION` | Chuyển trạng thái đơn hàng không hợp lệ theo state machine | Commerce |
| `CATALOG_SERVICE_ERROR` | Catalog Service không phản hồi (502) | Commerce |
| `PAYMENT_FAILED` | Thanh toán thất bại | Commerce |
| `INTERNAL_SERVER_ERROR` | Lỗi server không xác định | Chung |

---

## 14. Enum chuẩn

| Enum | Giá trị |
|---|---|
| `UserRole` | `CUSTOMER`, `SELLER`, `ADMIN` |
| `PaymentMethod` | `COD`, `VNPAY` |
| `PaymentStatus` | `PENDING`, `PAID`, `FAILED`, `COD_PENDING` |
| `OrderStatus` | `PENDING`, `AWAITING_PAYMENT`, `CONFIRMED`, `PROCESSING`, `SHIPPING`, `DELIVERED`, `CANCELLED` |
| `ProductStatus` | `ACTIVE`, `INACTIVE`, `OUT_OF_STOCK`, `DELETED` |
| `CategoryStatus` | `ACTIVE`, `INACTIVE` |
| `ShopStatus` | `ACTIVE`, `INACTIVE` |

---

## 15. Header dùng chung

| Header / Cookie | Khi nào dùng | Ví dụ |
|---|---|---|
| `Content-Type` | Request có body JSON | `application/json` |
| `Authorization` | API cần đăng nhập | `Bearer <accessToken>` |
| `Cookie` | Refresh/logout auth flow | `refreshToken=<token>` |
| `x-request-id` | Optional để trace log | `req_client_001` |

---

## 16. Tổng hợp nhanh trạng thái endpoint

| Nhóm API | Đã có | Chưa có | Lệch path |
|---|---:|---:|---:|
| Auth | 5 | 0 | 0 |
| Shop | 3 | 3 | 0 |
| Category | 2 | 2 | 0 |
| Product | 6 | 0 | 0 |
| Cart | 5 | 0 | 0 |
| Order | 6 | 0 | 0 |
| Payment | 0 | 3 | 0 |
| Notification | 0 | 2 | 0 |
| **Tổng** | **27** | **10** | **0** |

---

## 17. Quy tắc frontend cần nhớ

| Quy tắc | Nội dung |
|---|---|
| API public | Không cần `Authorization` |
| API user/seller/admin | Cần `Authorization: Bearer <accessToken>` |
| Refresh token | Không đọc từ response body |
| Refresh/logout | Cần gửi cookie bằng `credentials: "include"` |
| List API | Pagination nằm trong `meta.pagination` |
| Error handling | Frontend nên xử lý theo `error.code`, không chỉ dựa vào `message` |
| DELETE cart item | Response là `204 No Content`, không parse JSON |
| Checkout preview | Cần thống nhất lại path: docs 2 dùng `/api/commerce/cart/checkout-preview`, backend hiện tại dùng `/api/commerce/checkout-preview` |
