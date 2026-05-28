 # API INVENTORY - TÀI LIỆU API CHÍNH

 > Đây là tài liệu API chính thức của hệ thống backend. Cập nhật file này mỗi khi thêm hoặc thay đổi endpoint.
 >
 > Các API bên dưới được phân nhóm theo vai trò sử dụng: **Public API**, **Customer**, **Seller**, **Admin**. Nếu một API được dùng bởi nhiều vai trò, API đó có thể được liệt kê lặp lại trong nhiều nhóm.

 ---

 ## 1. Quy ước chung

 | Nội dung | Quy ước |
 |---|---|
 | Success response | `{ "success": true, "message": "Thông báo nghiệp vụ", "data": {}, "meta": { "requestId": "req_xxxx", "timestamp": "ISO-8601", "pagination": null, "version": "v1", "warnings": [] } }` |
 | Error response | `{ "success": false, "message": "Thông báo lỗi", "error": { "code": "ERROR_CODE", "details": [], "fieldErrors": [], "hint": "Gợi ý xử lý" }, "meta": { "requestId": "req_xxxx", "timestamp": "ISO-8601", "version": "v1" } }` |
 | Auth header | `Authorization: Bearer <accessToken>` cho API cần đăng nhập |
 | Refresh token | Server set cookie `refreshToken`; frontend gửi bằng `credentials: "include"` |
 | DELETE cart item | Riêng `DELETE /api/commerce/cart/items/:id` trả `204 No Content`, không có body |

 ---

 ## 2. Public API

 | Endpoint | Tác dụng / mục đích | Request body | Response body |
 |---|---|---|---|
 | `POST /api/auth/register` | Đăng ký tài khoản customer hoặc seller | `email: string`<br>`password: string`<br>`fullName: string`<br>`role?: CUSTOMER, SELLER` | `user: { id, email, fullName, role, status, createdAt }` |
 | `POST /api/auth/login` | Đăng nhập và lấy access token | `email: string`<br>`password: string` | `user: { id, email, fullName, role }`<br>`tokens: { accessToken, accessExpiresAt, refreshExpiresAt }` |
| `POST /api/auth/refresh` | Làm mới access token bằng cookie refresh token | Không có body | `tokens: { accessToken, accessExpiresAt, refreshExpiresAt }` |
| `GET /api/wake` | Đánh thức API Gateway và kiểm tra 3 service backend phía sau khi deploy trên Render | Không có body | `gateway: { ok, service }`<br>`services: [ { name, url, ok, status?, error? } ]` |
| `POST /api/uploads/images` | Upload ảnh lên Cloudinary | `multipart/form-data`<br>Field file: `image` | `url: string`<br>`publicId: string`<br>`width: number`<br>`height: number`<br>`format: string`<br>`bytes: number` |
 | `GET /api/catalog/shops?page&limit&q&status` | Xem danh sách shop public; mặc định chỉ lấy shop `ACTIVE` | Không có body | `shops: [ { id, sellerId, name, slug, logoUrl, description, address, status, createdAt, updatedAt } ]`<br>`pagination: { page, limit, total, totalPages }` |
 | `GET /api/catalog/shops/:id` | Xem chi tiết shop public | Không có body | `shop: { id, sellerId, name, slug, logoUrl, description, address, status, createdAt, updatedAt }`<br>`stats: { productCount }` |
 | `GET /api/catalog/categories?q&status` | Xem danh sách category public | Không có body | `[ { id, name, slug, status } ]` |
 | `GET /api/catalog/products?page&limit&shopId&categoryId&keyword&q&minPrice&maxPrice&sortBy` | Xem danh sách sản phẩm public, có lọc và sắp xếp | Không có body | `[ { id, shopId, categoryId, name, slug, price, stockQuantity, thumbnailUrl, status } ]`<br>`meta.pagination: { page, limit, total, totalPages }`<br>`meta.filters: { keyword, shopId, categoryId, minPrice, maxPrice, sortBy }` |
 | `GET /api/catalog/products/:productId` | Xem chi tiết sản phẩm public | Không có body | `product: { id, shopId, categoryId, name, slug, description, price, stockQuantity, thumbnailUrl, status, createdAt, updatedAt }`<br>`images: [ { id, imageUrl, sortOrder } ]`<br>`shop: { id, name }` |
 | `POST /api/catalog/products/by-ids` | Lấy danh sách sản phẩm public theo nhiều id | `productIds: string[]` hoặc `number[]` | Danh sách product public theo các id truyền vào |
 | `GET /api/commerce/payments/vnpay-return?<vnpay params>` | VNPay server callback/IPN để cập nhật trạng thái thanh toán | Không có body | `{ "RspCode": "00", "Message": "Confirm Success" }` |
 | `GET /api/commerce/payments/check-result?<vnpay params>` | Frontend forward query VNPay Return URL để backend verify chữ ký và trả kết quả thanh toán | Không có body | `order: { id, orderCode, orderStatus, paymentStatus }`<br>`payment: { id, status, amount, transactionRef, paidAt }`<br>`result: { isPaid, isFailed, isPending }` |

 ---

 ## 3. Customer API

 | Endpoint | Tác dụng / mục đích | Request body | Response body |
 |---|---|---|---|
 | `POST /api/auth/logout` | Đăng xuất, thu hồi refresh token | Không có body | `revoked: true` |
 | `GET /api/auth/me` | Lấy thông tin user đang đăng nhập | Không có body | `user: { id, email, fullName, role, status }` |
 | `POST /api/uploads/images` | Upload ảnh nếu customer flow cần gửi ảnh | `multipart/form-data`<br>Field file: `image` | `url, publicId, width, height, format, bytes` |
 | `GET /api/commerce/cart` | Lấy giỏ hàng hiện tại của customer | Không có body | Khi có cart:<br>`cartId, customerId, shops: [ { shopId, items, totalQuantity, subtotal } ], totalQuantity`<br>Khi chưa có cart:<br>`cartId: null, customerId: null, shops: [], totalQuantity: 0` |
 | `POST /api/commerce/cart/items` | Thêm sản phẩm vào giỏ hàng | `productId: number`<br>`quantity?: number` | `id, cartId, productId, shopId, quantity, createdAt, updatedAt` |
 | `PATCH /api/commerce/cart/items/:id` | Cập nhật số lượng item trong giỏ | `quantity: number` | `id, cartId, productId, shopId, quantity, createdAt, updatedAt` |
 | `DELETE /api/commerce/cart/items/:id` | Xóa item khỏi giỏ hàng | Không có body | `204 No Content` |
 | `POST /api/commerce/cart/checkout-preview` | Tính tổng tiền và validate giỏ hàng trước checkout | `shopId: string`<br>`cartItemIds: string[]` | `shopId`<br>`items: [ { cartItemId, productId, productName, unitPrice, quantity, subtotal, valid, invalidReason } ]`<br>`pricing: { subtotal, shippingFee, grandTotal }`<br>`canCheckout: boolean` |
 | `POST /api/commerce/orders/checkout` | Tạo đơn hàng từ giỏ hàng theo một shop | `shopId: string`<br>`cartItemIds: string[]`<br>`paymentMethod: COD, VNPAY`<br>`receiverName: string`<br>`receiverPhone: string`<br>`receiverAddress: string`<br>`note?: string` | `orderId, orderCode, orderStatus, paymentStatus, totalAmount`<br>`paymentUrl?: string`<br>`paymentUrlExpiresAt?: ISO-8601` |
 | `GET /api/commerce/orders/my?status&page&limit` | Lấy lịch sử đơn hàng của customer | Không có body | Danh sách đơn hàng của customer và thông tin phân trang |
 | `GET /api/commerce/orders/:id` | Lấy chi tiết đơn hàng của customer | Không có body | Chi tiết đơn hàng và các mục hàng |
 | `GET /api/commerce/orders/:orderCode/payment-url` | Lấy hoặc làm mới link thanh toán VNPay | Không có body | `orderId, orderCode, paymentUrl, expiresAt` |
 | `GET /api/commerce/orders/:orderCode/check-result` | Kiểm tra kết quả thanh toán theo orderCode sau đăng nhập | Không có body | `order: { id, orderCode, orderStatus, paymentStatus }`<br>`payment: { id, status, amount, transactionRef, paidAt }`<br>`result: { isPaid, isFailed, isPending }` |
 | `POST /api/commerce/orders/:orderCode/cancel` | Hủy đơn hàng của customer | Không có body | `orderId, orderCode, orderStatus: CANCELLED` |
 | `GET /api/commerce/payments/order/:orderId` | Xem thông tin payment của order mà customer sở hữu | Không có body | `payment: { orderId, method, status, amount, transactionRef, providerResponse, checkoutUrlExpiresAt, createdAt, updatedAt }` |
 | `GET /api/notifications/me?page&limit&isRead` | Lấy danh sách notification của user | Không có body | `notifications: [ { id, userId, type, title, content, metadata, isRead, readAt, createdAt } ]`<br>`unreadCount: number`<br>`meta.pagination: { page, limit, total, totalPages }` |
 | `GET /api/notifications/:id` | Xem chi tiết notification | Không có body | `notification: { id, userId, type, title, content, metadata, isRead, readAt, createdAt }` |
 | `PATCH /api/notifications/read-all` | Đánh dấu tất cả notification là đã đọc | Không có body | `updatedCount: number` |
 | `PATCH /api/notifications/:id/read` | Đánh dấu một notification là đã đọc | Không có body | `notification: { id, isRead: true, readAt }` |

 ---

 ## 4. Seller API

 | Endpoint | Tác dụng / mục đích | Request body | Response body |
 |---|---|---|---|
 | `POST /api/auth/logout` | Đăng xuất seller | Không có body | `revoked: true` |
 | `GET /api/auth/me` | Lấy thông tin seller đang đăng nhập | Không có body | `user: { id, email, fullName, role, status }` |
 | `POST /api/uploads/images` | Upload ảnh sản phẩm, logo shop hoặc tài nguyên seller | `multipart/form-data`<br>Field file: `image` | `url, publicId, width, height, format, bytes` |
 | `POST /api/catalog/shops` | Tạo shop cho seller | `name: string`<br>`address: string`<br>`logoUrl?: string`<br>`description?: string` | `shop: { id, sellerId, name, slug, logoUrl, description, address, status, createdAt, updatedAt }` |
 | `GET /api/catalog/shops/my-shop` | Lấy shop của seller đang đăng nhập | Không có body | `shop: { id, sellerId, name, slug, logoUrl, description, address, status, createdAt, updatedAt }` |
 | `PUT /api/catalog/shops/my-shop` | Cập nhật thông tin shop của seller | Ít nhất 1 field:<br>`name?: string`<br>`address?: string`<br>`logoUrl?: string`<br>`description?: string` | `shop: { id, sellerId, name, slug, logoUrl, description, address, status, createdAt, updatedAt }` |
 | `POST /api/catalog/products` | Tạo sản phẩm mới cho shop của seller | `shopId: number`<br>`categoryId: number`<br>`name: string`<br>`description?: string`<br>`price: number`<br>`stockQuantity?: number`<br>`thumbnailUrl?: string`<br>`status?: ACTIVE, INACTIVE, OUT_OF_STOCK`<br>`images?: [ { imageUrl, sortOrder } ]` | `product: { id, shopId, categoryId, name, slug, description, price, stockQuantity, thumbnailUrl, status, deletedAt, createdAt, updatedAt, shop, category, images }` |
 | `PUT /api/catalog/products/:productId` | Cập nhật sản phẩm của seller | Ít nhất 1 field:<br>`categoryId?: number`<br>`name?: string`<br>`description?: string`<br>`price?: number`<br>`stockQuantity?: number`<br>`thumbnailUrl?: string`<br>`status?: ACTIVE, INACTIVE, OUT_OF_STOCK`<br>`images?: [ { imageUrl, sortOrder } ]` | `product: { id, shopId, categoryId, name, slug, description, price, stockQuantity, thumbnailUrl, status, deletedAt, createdAt, updatedAt, shop, category, images }` |
 | `DELETE /api/catalog/products/:productId` | Xóa mềm sản phẩm của seller | Không có body | `product: { id, status: DELETED, deletedAt }` |
 | `PATCH /api/catalog/products/:productId/stock` | Cập nhật tồn kho sản phẩm của seller | `stockQuantity: number` | `product: { id, shopId, categoryId, name, slug, description, price, stockQuantity, thumbnailUrl, status, deletedAt, createdAt, updatedAt, shop, category, images }`<br>`previousStock, currentStock, updatedAt` |
 | `GET /api/commerce/seller/orders?status` | Lấy danh sách đơn hàng của shop | Không có body | Danh sách đơn hàng của shop |
 | `GET /api/commerce/seller/orders/:id` | Lấy chi tiết đơn hàng của shop | Không có body | `order, items, payments` |
 | `PATCH /api/commerce/seller/orders/:id/status` | Cập nhật trạng thái đơn hàng của shop | `status: OrderStatus` | Đơn hàng sau khi cập nhật trạng thái |
 | `GET /api/commerce/seller/revenue-summary?from&to` | Tổng hợp doanh thu và đơn hàng của seller | Không có body | `shopId, totalOrders, totalRevenue, pendingOrders, processingOrders, deliveredOrders, cancelledOrders`<br>`recentOrders: [ ... ]`<br>`revenueSeries: [ { date, revenue } ]` |
 | `GET /api/commerce/payments/order/:orderId` | Xem payment của order thuộc shop seller | Không có body | `payment: { orderId, method, status, amount, transactionRef, providerResponse, checkoutUrlExpiresAt, createdAt, updatedAt }` |
 | `GET /api/notifications/me?page&limit&isRead` | Lấy notification của seller | Không có body | `notifications: [ { id, userId, type, title, content, metadata, isRead, readAt, createdAt } ]`<br>`unreadCount, meta.pagination` |
 | `GET /api/notifications/:id` | Xem chi tiết notification | Không có body | `notification: { id, userId, type, title, content, metadata, isRead, readAt, createdAt }` |
 | `PATCH /api/notifications/read-all` | Đánh dấu tất cả notification là đã đọc | Không có body | `updatedCount: number` |
 | `PATCH /api/notifications/:id/read` | Đánh dấu một notification là đã đọc | Không có body | `notification: { id, isRead: true, readAt }` |

 ---

 ## 5. Admin API

 | Endpoint | Tác dụng / mục đích | Request body | Response body |
 |---|---|---|---|
 | `POST /api/auth/logout` | Đăng xuất admin | Không có body | `revoked: true` |
 | `GET /api/auth/me` | Lấy thông tin admin đang đăng nhập | Không có body | `user: { id, email, fullName, role, status }` |
 | `GET /api/auth/admin/users?q&role&status&page&limit` | Quản lý danh sách user | Không có body | `users: [ { id, email, fullName, role, status, createdAt, updatedAt } ]`<br>`pagination: { page, limit, total, totalPages }` |
 | `GET /api/auth/admin/users/:userId` | Xem chi tiết user | Không có body | `user: { id, email, fullName, role, status, createdAt, updatedAt }` |
 | `PATCH /api/auth/admin/users/:userId` | Cập nhật thông tin, role hoặc trạng thái user | Ít nhất 1 field:<br>`fullName?: string`<br>`role?: CUSTOMER, SELLER, ADMIN`<br>`status?: ACTIVE, INACTIVE, BLOCKED` | `user: { id, email, fullName, role, status, createdAt, updatedAt }` |
 | `DELETE /api/auth/admin/users/:userId` | Block user | Không có body | `user: { id, email, fullName, role, status: BLOCKED, createdAt, updatedAt }` |
 | `POST /api/uploads/images` | Upload ảnh nếu admin flow cần tài nguyên | `multipart/form-data`<br>Field file: `image` | `url, publicId, width, height, format, bytes` |
 | `GET /api/catalog/admin/shops?q&status&page&limit` | Quản lý danh sách shop | Không có body | `shops: [ { id, sellerId, name, slug, logoUrl, description, address, status, createdAt, updatedAt } ]`<br>`pagination: { page, limit, total, totalPages }` |
 | `GET /api/catalog/admin/shops/:shopId` | Xem chi tiết shop cho admin | Không có body | `shop: { id, sellerId, name, slug, logoUrl, description, address, status, createdAt, updatedAt }` |
 | `PATCH /api/catalog/admin/shops/:shopId/status` | Duyệt, khóa hoặc cập nhật trạng thái shop | `status: ACTIVE, INACTIVE, PENDING` | `shop: { id, sellerId, name, slug, logoUrl, description, address, status, createdAt, updatedAt }` |
 | `POST /api/catalog/categories` | Tạo category | `name: string`<br>`status?: ACTIVE, INACTIVE` | `category: { id, name, slug, status }` |
 | `PUT /api/catalog/categories/:categoryId` | Cập nhật category | Ít nhất 1 field:<br>`name?: string`<br>`status?: ACTIVE, INACTIVE` | `category: { id, name, slug, status }` |
 | `DELETE /api/catalog/categories/:categoryId` | Xóa category | Không có body | `category: { id, name, slug, status }` |
 | `GET /api/catalog/admin/products?q&status&shopId&categoryId&page&limit` | Quản lý danh sách sản phẩm | Không có body | `products: [ { id, shopId, categoryId, name, slug, description, price, stockQuantity, thumbnailUrl, status, deletedAt, createdAt, updatedAt, shop, category, images } ]`<br>`pagination: { page, limit, total, totalPages }` |
 | `GET /api/catalog/admin/products/:productId` | Xem chi tiết sản phẩm cho admin | Không có body | `product: { id, shopId, categoryId, name, slug, description, price, stockQuantity, thumbnailUrl, status, deletedAt, createdAt, updatedAt, shop, category, images }` |
 | `PUT /api/catalog/admin/products/:productId` | Cập nhật sản phẩm bằng quyền admin | Ít nhất 1 field:<br>`categoryId?: number`<br>`name?: string`<br>`description?: string`<br>`price?: number`<br>`stockQuantity?: number`<br>`thumbnailUrl?: string`<br>`status?: ACTIVE, INACTIVE, OUT_OF_STOCK`<br>`images?: [ { imageUrl, sortOrder } ]` | `product: { id, shopId, categoryId, name, slug, description, price, stockQuantity, thumbnailUrl, status, deletedAt, createdAt, updatedAt, shop, category, images }` |
 | `DELETE /api/catalog/admin/products/:productId` | Xóa mềm sản phẩm bằng quyền admin | Không có body | `product: { id, status: DELETED, deletedAt }` |
 | `GET /api/commerce/admin/orders?q&status&paymentStatus&paymentMethod&shopId&customerId&from&to&page&limit` | Quản lý danh sách đơn hàng toàn hệ thống | Không có body | `orders: [ { id, orderCode, customerId, shopId, totalAmount, shippingFee, paymentMethod, paymentStatus, orderStatus, receiverName, receiverPhone, receiverAddress, createdAt, updatedAt } ]`<br>`pagination: { page, limit, total, totalPages }` |
 | `GET /api/commerce/admin/orders/:orderId` | Xem chi tiết đơn hàng cho admin | Không có body | `order: { id, orderCode, customerId, shopId, totalAmount, shippingFee, paymentMethod, paymentStatus, orderStatus, receiverName, receiverPhone, receiverAddress, note, createdAt, updatedAt, items, payments }` |
 | `PATCH /api/commerce/admin/orders/:orderId/status` | Cập nhật trạng thái đơn hàng bằng quyền admin | `status: OrderStatus` | `order: { id, orderCode, orderStatus, updatedAt }` |
 | `GET /api/commerce/admin/dashboard-summary?from&to` | Lấy thống kê dashboard admin | Không có body | `totalOrders, totalRevenue, pendingOrders, deliveredOrders, cancelledOrders, monthlyRevenue`<br>`recentOrders: [ ... ]` |
 | `GET /api/commerce/payments/order/:orderId` | Xem payment của order bất kỳ bằng quyền admin | Không có body | `payment: { orderId, method, status, amount, transactionRef, providerResponse, checkoutUrlExpiresAt, createdAt, updatedAt }` |
 | `GET /api/notifications/me?page&limit&isRead` | Lấy notification của admin | Không có body | `notifications: [ { id, userId, type, title, content, metadata, isRead, readAt, createdAt } ]`<br>`unreadCount, meta.pagination` |
 | `GET /api/notifications/:id` | Xem chi tiết notification | Không có body | `notification: { id, userId, type, title, content, metadata, isRead, readAt, createdAt }` |
 | `PATCH /api/notifications/read-all` | Đánh dấu tất cả notification là đã đọc | Không có body | `updatedCount: number` |
 | `PATCH /api/notifications/:id/read` | Đánh dấu một notification là đã đọc | Không có body | `notification: { id, isRead: true, readAt }` |

 ---

 ## 6. Internal Service API

 | Endpoint | Tác dụng / mục đích | Request body | Response body |
 |---|---|---|---|
 | `GET /api/catalog/shops/internal/by-seller/:sellerId` | Service nội bộ lấy shop theo sellerId | Không có body | `shop: { id, sellerId, name, slug, logoUrl, description, address, status, createdAt, updatedAt }` |
 | `GET /api/catalog/shops/internal/:shopId` | Service nội bộ lấy shop theo shopId | Không có body | `shop: { id, sellerId, name, slug, logoUrl, description, address, status, createdAt, updatedAt }` |
 | `POST /api/catalog/internal/products/decrement-stock` | Commerce service trừ tồn kho khi checkout | `items: [ { productId: string, quantity: number } ]` | Kết quả trừ tồn kho cho các product được truyền vào |
 | `POST /api/catalog/internal/products/increment-stock` | Commerce service hoàn tồn kho khi hủy/rollback đơn | `items: [ { productId: string, quantity: number } ]` | Kết quả hoàn tồn kho cho các product được truyền vào |

 ---

 ## 7. Ghi chú nghiệp vụ

 | Nội dung | Ghi chú |
 |---|---|
 | Checkout VNPay | `POST /api/commerce/orders/checkout` trả `paymentUrl` ngay nếu `paymentMethod = VNPAY`; payment URL được lưu kèm payment record để lấy lại bằng `/api/commerce/orders/:orderCode/payment-url` khi còn hiệu lực |
 | Payment result public | FE nhận query params từ VNPay Return URL rồi forward sang `GET /api/commerce/payments/check-result` để backend verify chữ ký |
 | Payment result auth | Customer có thể gọi `GET /api/commerce/orders/:orderCode/check-result` sau đăng nhập |
 | Snapshot giá | `priceSnapshot` và `productNameSnapshot` trong `order_items` là bản sao tại lúc đặt hàng |
 | Notification | `api_gateway` consume các topic `user.registered`, `order.created`, `order.status.updated`, `payment.succeeded`, `payment.failed` để tạo notification |

 ---

 ## 8. Enum chuẩn

 | Enum | Giá trị |
 |---|---|
 | `UserRole` | `CUSTOMER`, `SELLER`, `ADMIN` |
 | `UserStatus` | `ACTIVE`, `INACTIVE`, `BLOCKED` |
 | `PaymentMethod` | `COD`, `VNPAY` |
 | `PaymentStatus` | `PENDING`, `PAID`, `FAILED`, `COD_PENDING` |
 | `OrderStatus` | `PENDING`, `AWAITING_PAYMENT`, `CONFIRMED`, `PROCESSING`, `SHIPPING`, `DELIVERED`, `CANCELLED` |
 | `ProductStatus` | `ACTIVE`, `INACTIVE`, `OUT_OF_STOCK`, `DELETED` |
 | `CategoryStatus` | `ACTIVE`, `INACTIVE` |
 | `ShopStatus` | `ACTIVE`, `INACTIVE`, `PENDING` |

 ---

 ## 9. Error code chuẩn

 | Error code | Ý nghĩa | Service |
 |---|---|---|
 | `VALIDATION_ERROR` | Dữ liệu gửi lên không hợp lệ | Chung |
 | `UNAUTHORIZED` | Chưa đăng nhập hoặc thiếu token | Chung |
 | `FORBIDDEN` | Không có quyền truy cập | Chung |
 | `INVALID_TOKEN` | Token không hợp lệ hoặc hết hạn | Auth |
 | `RESOURCE_NOT_FOUND` | Không tìm thấy tài nguyên | Chung |
 | `USER_NOT_FOUND` | Không tìm thấy người dùng | Auth |
 | `LAST_ADMIN_PROTECTED` | Không thể hạ quyền admin active cuối cùng | Auth |
 | `ROLE_NOT_CONFIGURED` | Hệ thống chưa cấu hình role cần dùng | Auth |
 | `SHOP_ALREADY_EXISTS` | Seller đã có shop | Catalog |
 | `SHOP_NOT_FOUND` | Không tìm thấy shop | Catalog / Commerce |
 | `PRODUCT_NOT_FOUND` | Không tìm thấy sản phẩm | Catalog |
 | `INSUFFICIENT_STOCK` | Không đủ tồn kho | Catalog |
 | `NOT_ENOUGH_STOCK` | Số lượng yêu cầu vượt qua tồn kho | Commerce |
 | `OUT_OF_STOCK` | Sản phẩm đã hết hàng | Catalog |
 | `CART_ITEM_NOT_FOUND` | Không tìm thấy mục trong giỏ hàng | Commerce |
 | `CART_ITEM_LIMIT_REACHED` | Giỏ hàng đã đạt giới hạn số lượng mục | Commerce |
 | `INVALID_CART_ITEMS` | Một số cart item không thuộc giỏ/shop của user | Commerce |
 | `CHECKOUT_NOT_ALLOWED` | Không thể tạo đơn do sản phẩm không hợp lệ | Commerce |
 | `ORDER_NOT_FOUND` | Không tìm thấy đơn hàng hoặc không thuộc quyền truy cập | Commerce |
 | `CANCEL_NOT_ALLOWED` | Không thể hủy đơn ở trạng thái hiện tại | Commerce |
 | `INVALID_STATUS_TRANSITION` | Chuyển trạng thái đơn hàng không hợp lệ | Commerce |
 | `CATALOG_SERVICE_ERROR` | Catalog Service không phản hồi | Commerce |
 | `PAYMENT_FAILED` | Thanh toán thất bại | Commerce |
 | `INTERNAL_SERVER_ERROR` | Lỗi server không xác định | Chung |

 ---

 ## 10. Tổng hợp endpoint theo nhóm

 | Nhóm | Số dòng API trong tài liệu | Ghi chú |
 |---|---:|---|
| Public API | 13 | Không cần bearer token |
 | Customer | 19 | Có tính cả API dùng chung với user đăng nhập |
 | Seller | 19 | Có tính cả API dùng chung với user đăng nhập |
 | Admin | 27 | Có tính cả API dùng chung với user đăng nhập |
 | Internal Service | 4 | API nội bộ giữa các service |
