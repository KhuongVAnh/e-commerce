# Auth Service

## Mục đích

`auth_service` phụ trách xác thực, phân quyền và quản lý tài khoản người dùng trong hệ thống.

## Thông tin hiện tại

- Port mặc định: `3001`
- File nguồn chính: `src/server.ts`
- File build: `dist/server.js`
- Biến môi trường hiện có: `PORT`, `DB_SCHEMA`
- Có khung `src/` theo hướng MVC

## Cấu hình database

- Prisma đã được setup theo PostgreSQL.
- Runtime Prisma nằm ở `src/config/prisma.ts`.
- Seed test hiện nằm ở `prisma/seed.js`.

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

- `src/controllers`: xử lý request auth
- `src/routes`: route đăng ký, đăng nhập, refresh, logout
- `src/middlewares`: auth middleware, role middleware
- `src/services`: business logic xác thực
- `src/utils`: helper và constant

## Phạm vi nghiệp vụ dự kiến

Service này sẽ phát triển các nhóm chức năng:

- Đăng ký tài khoản customer hoặc seller
- Đăng nhập
- Refresh access token
- Logout
- Lấy thông tin user hiện tại
- Phân quyền theo role `CUSTOMER`, `SELLER`, `ADMIN`

## Bảng dữ liệu dự kiến

- `users`
- `refresh_tokens`
