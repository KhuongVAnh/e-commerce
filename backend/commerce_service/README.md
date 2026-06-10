# Commerce Service

## Mục đích

`commerce_service` là service trung tâm của luồng mua hàng, phụ trách cart, checkout, order và payment.

## Thông tin hiện tại

- Port mặc định: `3003`
- File nguồn chính: `src/server.ts`
- File build: `dist/server.js`
- Biến môi trường hiện có: `PORT`, `DB_SCHEMA`
- Có khung `src/` theo hướng MVC

## Cấu hình database

- Prisma đã được setup theo PostgreSQL.
- Chưa có model/migration thật được apply lên DB.
- Seed hiện là placeholder để test cơ chế Prisma.

## Cách chạy

```bash
npm run dev
```

Hoặc:

```bash
npm start
```

## Endpoint khởi tạo

- `GET /`: kiểm tra service đang chạy
- `GET /health`: health check cơ bản

## Cấu trúc thư mục

- `src/controllers`: xử lý request cart, order, payment
- `src/routes`: route commerce
- `src/middlewares`: middleware xác thực và kiểm tra role
- `src/services`: business logic checkout, order, payment
- `src/utils`: helper và tiện ích dùng chung

## Phạm vi nghiệp vụ dự kiến

Service này sẽ phát triển các nhóm chức năng:

- Quản lý giỏ hàng
- Checkout theo từng shop
- Quản lý đơn hàng
- Thanh toán COD và VNPay
- Thống kê doanh thu cơ bản
- Đánh giá sản phẩm sau khi đơn hàng đã giao

## Bảng dữ liệu dự kiến

- `carts`
- `cart_items`
- `orders`
- `order_items`
- `payments`
- `product_reviews`

### Bảng `product_reviews`

`product_reviews` thuộc `commerce_service` vì điều kiện tạo review phụ thuộc vào dữ liệu mua hàng trong `orders` và `order_items`.

| Trường | Ý nghĩa |
| --- | --- |
| `id` | ID đánh giá |
| `customer_id` | Người mua viết đánh giá |
| `shop_id` | Shop bán sản phẩm, dùng cho lọc/quản trị theo shop |
| `product_id` | Sản phẩm được đánh giá |
| `order_item_id` | Item đã mua; unique để mỗi order item chỉ được đánh giá một lần |
| `rating` | Số sao từ 0 đến 5 |
| `comment_text` | Nội dung bình luận dạng text |
| `image_urls` | Danh sách URL ảnh bình luận, không hỗ trợ video |
| `created_at` | Thời gian tạo |
| `updated_at` | Thời gian cập nhật |
