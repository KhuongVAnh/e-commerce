# Frontend App (React + Vite)

Frontend của dự án đang được tổ chức theo hướng Single Page Application (SPA) với React và Vite.

## Danh sách phân luồng giao diện

| Luồng giao diện | Route mặc định | Vai trò hiện tại |
| --- | --- | --- |
| Customer Flow | `/` | Trải nghiệm mua sắm, giỏ hàng, đặt hàng, thanh toán |
| Seller Flow | `/seller` | Quản lý shop, sản phẩm, xử lý đơn hàng, thống kê |
| Admin Flow | `/admin` | Quản trị toàn hệ thống, quản lý người dùng, kiểm duyệt |
| Auth Flow | `/login`, `/register` | Xác thực, đăng nhập, đăng ký, quên mật khẩu |

## Cấu trúc thư mục chung

Frontend hiện đã có khung thư mục:

* `src/components` (Các UI component tái sử dụng như Button, Input)
* `src/layouts` (Các layout bọc ngoài trang như CustomerLayout, SellerLayout)
* `src/pages` (Các trang giao diện chính)
* `src/services` (Các file xử lý gọi API đến Backend)
* `src/store` (Quản lý trạng thái toàn cục bằng Zustand)
* `src/utils` (Các hàm hỗ trợ, cấu hình Axios)

## Cách chạy nhanh

Cài đặt các gói phụ thuộc từ thư mục `frontend`:

```bash
npm install

```

Chạy frontend môi trường phát triển từ thư mục `frontend`:

```bash
npm run dev

```

Lệnh này sẽ khởi động dev server của Vite (mặc định ở port `5173`).

Nếu muốn build dự án để chuẩn bị deploy:

```bash
npm run build

```

## Vite & React Guide

Project hiện đang dùng **React + Vite + TailwindCSS + Zustand**.

### Các package cần có

Trong frontend project:

```bash
npm install react-router-dom axios zustand react-hot-toast
npm install -D tailwindcss postcss autoprefixer

```

### Cấu trúc file cấu hình trong frontend

```txt
frontend/
  vite.config.js
  tailwind.config.js
  postcss.config.js
  .env
src/
  utils/
    axiosClient.js
  store/
    useAuthStore.js

```

### Vai trò từng file



* `vite.config.js`: Cấu hình dev server, plugin cho Vite
* `tailwind.config.js`: Cấu hình theme, màu sắc, font chữ cho TailwindCSS
* `.env`: Chứa biến môi trường (ví dụ: `VITE_API_URL`)
* `src/utils/axiosClient.js`: Cấu hình instance Axios (Base URL, Interceptors)
* `src/store/useAuthStore.js`: Cấu hình Zustand store để quản lý trạng thái đăng nhập

### Ví dụ `src/utils/axiosClient.js`

```javascript
import axios from 'axios';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default axiosClient;

```

### Ví dụ `src/store/useAuthStore.js`

```javascript
import { create } from 'zustand';

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  login: (userData) => set({ user: userData, isAuthenticated: true }),
  logout: () => set({ user: null, isAuthenticated: false }),
}));

export default useAuthStore;

```

### Cách import và gọi API trong code

Ví dụ trong một Component hoặc Page:

```javascript
import { useEffect, useState } from 'react';
import axiosClient from '../utils/axiosClient';

const fetchProducts = async () => {
  const res = await axiosClient.get('/catalog/products');
  return res.data;
};

```

### Các lệnh Vite hay dùng



Trong thư mục frontend:

```bash
npm run dev

```

Khởi động server phát triển với tính năng Hot Module Replacement (HMR).

```bash
npm run build

```

Biên dịch dự án ra các file tĩnh (HTML, CSS, JS) vào thư mục `dist` để chuẩn bị deploy.

```bash
npm run preview

```

Chạy local server để xem trước bản build trong thư mục `dist`.

```bash
npm run lint

```

Kiểm tra lỗi code theo chuẩn ESLint.

### Thứ tự làm việc khuyến nghị



Khi bắt đầu thêm một tính năng mới (ví dụ: Quản lý giỏ hàng):

1. Khai báo route mới trong `App.jsx`
2. Tạo giao diện UI tĩnh trong `src/pages`
3. Thêm hàm gọi API tương ứng vào `src/services`
4. Khởi tạo hoặc cập nhật trạng thái trong `src/store` (nếu cần quản lý global state)
5. Ráp API vào giao diện và gắn dữ liệu thực tế
6. Kiểm tra Responsive bằng các class của TailwindCSS

### Lưu ý quan trọng với Vite & React



* Biến môi trường trong Vite bắt buộc phải có tiền tố `VITE_` (ví dụ: `VITE_API_URL`).


* Gọi biến môi trường bằng `import.meta.env.VITE_API_URL` thay vì `process.env`.
* Cần đảm bảo Backend API Gateway đã cấu hình CORS cho phép origin của frontend (mặc định là `http://localhost:5173`) truy cập.