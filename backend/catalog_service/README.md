# Catalog Service

## Mục đích

`catalog_service` quản lý phần dữ liệu hiển thị của sàn thương mại điện tử, bao gồm shop, category và product.

## Thông tin hiện tại

- Port mặc định: `3002`
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

- `src/controllers`: xử lý request shop, category, product
- `src/routes`: route catalog
- `src/middlewares`: middleware kiểm tra quyền truy cập
- `src/services`: business logic catalog
- `src/utils`: helper và tiện ích dùng chung

## Phạm vi nghiệp vụ dự kiến

Service này sẽ phát triển các nhóm chức năng:

- Quản lý shop
- Quản lý category
- Quản lý product
- Hiển thị catalog cho customer
- Quản trị shop và sản phẩm cho admin

## Bảng dữ liệu dự kiến

- `shops`
- `categories`
- `products`
- `product_images`
