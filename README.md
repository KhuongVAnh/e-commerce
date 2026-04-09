# CNWeb Project

## Giới thiệu

Đây là đồ án xây dựng **sàn thương mại điện tử mini** theo hướng **microservice**.
Hệ thống hỗ trợ nhiều shop, quản lý sản phẩm, giỏ hàng, đơn hàng và thanh toán trực tuyến.

Tài liệu kiến trúc backend hiện nằm tại:

- [backend/system-architecture.md](c:/Users/Dell/OneDrive/Desktop/cnweb/backend/system-architecture.md)

## Mục tiêu đề tài

- Xây dựng backend theo hướng microservice
- Tách service theo domain nghiệp vụ chính
- Quản lý tài khoản, shop, sản phẩm, giỏ hàng, đơn hàng, thanh toán
- Chuẩn bị khả năng mở rộng cho cache và xử lý bất đồng bộ

## Cấu trúc repo

```txt
backend/
  api_gateway/
  auth_service/
  catalog_service/
  commerce_service/
frontend/
```

## Công nghệ sử dụng

### Backend

- Node.js
- TypeScript
- Express
- Prisma 7
- PostgreSQL
- `@prisma/adapter-pg`
- `ts-node-dev`

### Frontend

Hiện tại frontend **chưa được khởi tạo code thực tế** trong repo.
Dự kiến:
 - React + Vite
 - tailwindcss

## Quy tắc commit chung

```txt
type(scope): short description
```

Ví dụ:

```txt
feat(auth): add login endpoint
fix(catalog): fix product slug validation
chore(backend): configure prisma and initialize schemas
docs(readme): update setup guide
refactor(commerce): split order service logic
```

### Các type nên dùng

- `feat`: thêm tính năng mới
- `fix`: sửa lỗi
- `chore`: cấu hình, dependency, migration, setup
- `docs`: thay đổi tài liệu
- `refactor`: chỉnh cấu trúc code nhưng không đổi behavior chính
- `test`: thêm hoặc sửa test

### Quy tắc viết commit

- Một commit nên tập trung vào một mục đích chính
- Không gộp nhiều việc không liên quan vào cùng một commit
- Message viết bằng tiếng Anh để thống nhất lịch sử git
- Dùng động từ ngắn, rõ nghĩa: `add`, `fix`, `update`, `remove`, `refactor`
- Nếu thay đổi lớn ở backend hoặc DB, mô tả scope rõ: `auth`, `catalog`, `commerce`, `backend`, `frontend`

## Gợi ý chia commit cho team

- `feat(auth): add register api`
- `feat(catalog): add category schema`
- `feat(commerce): add order migration`
- `chore(backend): update postgres env config`
- `docs(architecture): update backend architecture document`
