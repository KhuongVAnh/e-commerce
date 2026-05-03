# Catalog Service

## Mục đích

`catalog_service` quản lý phần dữ liệu hiển thị của sàn thương mại điện tử, bao gồm shop, category và product.

## Thông tin hiện tại

- Port mặc định: `3002`
- File nguồn chính: `src/server.ts`
- File build: `dist/server.js`
- Biến môi trường hiện có: `PORT`, `DATABASE_URL`
- Có khung `src/` theo hướng MVC

## Cấu hình database

- Prisma đã được setup theo PostgreSQL.
- Service sử dụng Prisma migrations trong `prisma/migrations`.
- Khi pull code mới có thay đổi schema, cần chạy migration để đồng bộ DB.

```bash
npx prisma generate
npx prisma migrate deploy
```

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

## Test nhanh Product listing (public)

Endpoint: `GET /api/catalog/products`

Query optional:
- `page`: số trang (>= 1)
- `limit`: số record/trang (1-100), mặc định 12
- `shopId`: lọc theo shop
- `categoryId`: lọc theo category
- `keyword`: từ khóa chính
- `q`: alias (chỉ dùng nếu không có `keyword`)
- `sortBy`: `latest` | `oldest` | `price_asc` | `price_desc` (mặc định `latest`)

Ghi chú:
- Public listing chỉ trả product `ACTIVE` và `deletedAt = null`.
- Search chạy case-insensitive theo `name` (và nếu có thì `description`, `slug`).

Ví dụ test (PowerShell):

1) Default (latest + page=1 + limit=12)
```powershell
Invoke-WebRequest -Uri "http://localhost:3002/api/catalog/products" -UseBasicParsing
```

2) keyword
```powershell
Invoke-WebRequest -Uri "http://localhost:3002/api/catalog/products?keyword=ao%20thun" -UseBasicParsing
```

3) q (chỉ dùng khi không có keyword)
```powershell
Invoke-WebRequest -Uri "http://localhost:3002/api/catalog/products?q=ao%20thun" -UseBasicParsing
```

4) shopId
```powershell
Invoke-WebRequest -Uri "http://localhost:3002/api/catalog/products?shopId=1" -UseBasicParsing
```

5) categoryId
```powershell
Invoke-WebRequest -Uri "http://localhost:3002/api/catalog/products?categoryId=2" -UseBasicParsing
```

6) keyword + categoryId
```powershell
Invoke-WebRequest -Uri "http://localhost:3002/api/catalog/products?keyword=ao&categoryId=2" -UseBasicParsing
```

7) sortBy
```powershell
Invoke-WebRequest -Uri "http://localhost:3002/api/catalog/products?sortBy=latest" -UseBasicParsing
Invoke-WebRequest -Uri "http://localhost:3002/api/catalog/products?sortBy=oldest" -UseBasicParsing
Invoke-WebRequest -Uri "http://localhost:3002/api/catalog/products?sortBy=price_asc" -UseBasicParsing
Invoke-WebRequest -Uri "http://localhost:3002/api/catalog/products?sortBy=price_desc" -UseBasicParsing
```

8) pagination
```powershell
Invoke-WebRequest -Uri "http://localhost:3002/api/catalog/products?page=1&limit=5" -UseBasicParsing
Invoke-WebRequest -Uri "http://localhost:3002/api/catalog/products?page=2&limit=5" -UseBasicParsing
```

Response format:
- `data`: danh sách product
- `meta.pagination`: `{ page, limit, total, totalPages }`
- `meta.filters`: `{ keyword, shopId, categoryId, sortBy }`

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
