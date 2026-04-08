# Backend Services

Backend của dự án đang được tổ chức theo hướng microservice

## Danh sách service hiện có

| Service | Thư mục | Port mặc định | Vai trò hiện tại |
| --- | --- | --- | --- |
| API Gateway | `api_gateway` | `3000` | Cổng vào chung cho backend |
| Auth Service | `auth_service` | `3001` | Xác thực và quản lý tài khoản |
| Catalog Service | `catalog_service` | `3002` | Quản lý shop, category, product |
| Commerce Service | `commerce_service` | `3003` | Quản lý cart, order, payment |

## Cấu trúc MVC chung

Mỗi service hiện đã có khung thư mục:

- `src/controllers`
- `src/routes`
- `src/middlewares`
- `src/services`
- `src/utils`

## Cách chạy nhanh

Chạy trong từng thư mục service:

```bash
npm run dev
```

Hoặc:

```bash
npm start
```
