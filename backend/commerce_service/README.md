# Commerce Service

## Mục đích

`commerce_service` là service trung tâm của luồng mua hàng, phụ trách cart, checkout, order và payment.

## Thông tin hiện tại

- Port mặc định: `3003`
- File chạy chính: `server.js`
- Biến môi trường hiện có: `PORT`
- Có khung `src/` theo hướng MVC

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

## Bảng dữ liệu dự kiến

- `carts`
- `cart_items`
- `orders`
- `order_items`
- `payments`
