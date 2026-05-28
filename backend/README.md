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

Chạy toàn bộ backend từ thư mục `backend`:

```bash
npm run dev
```

Lệnh này sẽ chạy song song 4 service:

- `api_gateway`
- `auth_service`
- `catalog_service`
- `commerce_service`

Nếu chỉ muốn chạy một service riêng lẻ, vào thư mục service đó:

```bash
npm run dev
```

Hoặc:

```bash
npm start
```

## Prisma Guide

Project hiện đang dùng **Prisma 7 + PostgreSQL + `@prisma/adapter-pg`**.

### Các package cần có

Trong service dùng Prisma:

```bash
npm install @prisma/client @prisma/adapter-pg pg dotenv
npm install -D prisma
```

### Cấu trúc file Prisma trong mỗi service

```txt
prisma/
  schema.prisma
  seed.js                # nếu có seed
src/
  config/
    prisma.ts
prisma.config.ts
.env
```

### Vai trò từng file

- `prisma/schema.prisma`: định nghĩa model database
- `prisma.config.ts`: nơi Prisma 7 đọc `DATABASE_URL`
- `src/config/prisma.ts`: nơi app tạo `PrismaClient`
- `.env`: chứa `DATABASE_URL`
- `prisma/seed.js`: dữ liệu mẫu ban đầu nếu cần

### Ví dụ `prisma.config.ts`

```ts
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
```

Nếu service có seed, thêm:

```ts
migrations: {
  path: "prisma/migrations",
  seed: "node prisma/seed.js",
},
```

### Ví dụ `src/config/prisma.ts`

```ts
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL || "" });

export const prisma = new PrismaClient({ adapter });
```

### Cách import Prisma trong code

Ví dụ trong service hoặc controller:

```ts
import { prisma } from "../config/prisma";

const users = await prisma.user.findMany();
```

Ví dụ tạo dữ liệu:

```ts
import { prisma } from "../config/prisma";

const user = await prisma.user.create({
  data: {
    email: "admin@example.com",
    passwordHash: "hash_value",
    fullName: "System Admin",
    role: "ADMIN",
  },
});
```

### Các lệnh Prisma hay dùng

Trong thư mục service:

```bash
npm run prisma:format
```

Format `schema.prisma`

```bash
npm run prisma:validate
```

Kiểm tra schema có hợp lệ không

```bash
npm run prisma:generate
```

Generate Prisma Client theo schema hiện tại

```bash
npm run prisma:migrate -- --name ten_migration
```

Tạo và apply migration mới

```bash
npx prisma migrate deploy
```

Chạy toàn bộ migration đã có sẵn lên database hiện tại

```bash
npx prisma migrate reset
```

Reset schema hiện tại, chạy lại toàn bộ migration và seed

```bash
npx prisma migrate status
```

Xem trạng thái migration hiện tại

Nếu service có seed:

```bash
npm run prisma:seed
```

### Thứ tự làm việc khuyến nghị

Khi bắt đầu thêm bảng mới cho một service:

1. Sửa `prisma/schema.prisma`
2. Chạy `npm run prisma:format`
3. Chạy `npm run prisma:validate`
4. Chạy `npm run prisma:generate`
5. Chạy `npm run prisma:migrate -- --name ten_migration`
6. Nếu có seed thì chạy `npm run prisma:seed`

### Khi nào dùng từng lệnh migration

- `npm run prisma:migrate -- --name ten_migration`
  dùng khi bạn vừa sửa `schema.prisma` và muốn tạo migration mới trong môi trường dev

- `npx prisma migrate deploy`
  dùng khi đã có sẵn migration trong thư mục `prisma/migrations` và chỉ muốn apply chúng lên DB

- `npx prisma migrate reset`
  dùng khi muốn làm sạch schema hiện tại rồi chạy lại toàn bộ migration từ đầu

- `npx prisma migrate status`
  dùng để kiểm tra DB đã apply tới migration nào

### Lưu ý quan trọng với Prisma 7

- `DATABASE_URL` không đặt trong `schema.prisma`
- URL được đọc từ `prisma.config.ts`
- Với PostgreSQL runtime, `PrismaClient` cần `@prisma/adapter-pg`
- `prisma validate` pass mới nên tin, vì editor có thể báo đỏ sai

### Ví dụ đang hoạt động

Service mẫu đã cấu hình đầy đủ:

- [auth_service](c:/Users/Dell/OneDrive/Desktop/cnweb/backend/auth_service)

Các file tham chiếu:

- [backend/auth_service/prisma/schema.prisma](c:/Users/Dell/OneDrive/Desktop/cnweb/backend/auth_service/prisma/schema.prisma)
- [backend/auth_service/prisma.config.ts](c:/Users/Dell/OneDrive/Desktop/cnweb/backend/auth_service/prisma.config.ts)
- [backend/auth_service/src/config/prisma.ts](c:/Users/Dell/OneDrive/Desktop/cnweb/backend/auth_service/src/config/prisma.ts)
- [backend/auth_service/prisma/seed.js](c:/Users/Dell/OneDrive/Desktop/cnweb/backend/auth_service/prisma/seed.js)
