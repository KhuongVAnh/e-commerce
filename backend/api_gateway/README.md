# API Gateway

## Mục đích

`api_gateway` là cổng vào chung cho frontend khi làm việc với backend. Theo thiết kế trong `backend/structure.md`, service này sẽ chịu trách nhiệm nhận request từ client và chuyển tiếp đến các service phù hợp.

## Thông tin hiện tại

- Port mặc định: `3000`
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

- `src/controllers`: xử lý request
- `src/routes`: khai báo route
- `src/middlewares`: middleware dùng chung
- `src/services`: logic nghiệp vụ / gọi service khác
- `src/utils`: hàm hỗ trợ

## Vai trò dự kiến

API Gateway sẽ dần phụ trách:

- Route request đến đúng service
- Kiểm tra access token sơ bộ
- Chuẩn hóa điểm truy cập cho frontend
- Logging request cơ bản
- Bổ sung rate limit khi cần

## Định tuyến dự kiến

- `/api/auth/*` -> Auth Service
- `/api/catalog/*` -> Catalog Service
- `/api/commerce/*` -> Commerce Service
- `/api/notifications/*` -> Notification Service
