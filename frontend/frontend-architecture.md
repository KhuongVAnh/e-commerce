# THIẾT KẾ KIẾN TRÚC FRONTEND - E-COMMERCE MICROSERVICES

> **Đề tài:** Sàn thương mại điện tử mini hỗ trợ nhiều shop, giỏ hàng và thanh toán trực tuyến

## 1. Tổng quan
Frontend của hệ thống Thương mại Điện tử mini được thiết kế theo hướng Single Page Application (SPA), đảm bảo tốc độ phản hồi nhanh và trải nghiệm mượt mà. 

Giao diện được phân tách rõ ràng thành các luồng (flow) chuyên biệt nhằm phục vụ 3 nhóm đối tượng chính: Customer (Khách hàng), Seller (Người bán) và Admin (Quản trị viên).

## 2. Công nghệ và Thư viện sử dụng
- **React & Vite:** Xây dựng giao diện người dùng theo hướng component, kết hợp Vite làm công cụ build và dev server cho tốc độ tối ưu.
- **TypeScript:** Tăng an toàn kiểu dữ liệu trong quá trình phát triển, giảm thiểu lỗi runtime.
- **TailwindCSS:** Framework utility-first giúp xây dựng giao diện nhanh, đảm bảo tính thống nhất và responsive trên nhiều thiết bị.
- **React Router:** Xử lý điều hướng (routing) giữa các trang trong ứng dụng.
- **Zustand:** Quản lý trạng thái (State Management) nhẹ và linh hoạt, đặc biệt cho trạng thái đăng nhập (Auth) và giỏ hàng (Cart).
- **Axios:** Xử lý các HTTP request gọi đến API Gateway của Backend.
- **Recharts & Lucide React:** Recharts hỗ trợ trực quan hóa dữ liệu trên Dashboard, Lucide React cung cấp hệ thống icon đồng bộ.

## 3. Kiến trúc Phân luồng Giao diện (Routing Flow)
Dựa trên phân quyền người dùng, hệ thống định tuyến các luồng giao diện độc lập:

* **Luồng Khách (Guest):**
  * Trang chủ → Danh sách sản phẩm → Chi tiết sản phẩm → Đăng nhập/Đăng ký.
* **Luồng Khách hàng (Customer):**
  * Đăng nhập → Xem sản phẩm → Thêm giỏ hàng → Checkout → Thanh toán (COD/VNPay) → Lịch sử đơn hàng → Đánh giá sản phẩm.
* **Luồng Người bán (Seller):**
  * Đăng nhập → Seller Dashboard → Quản lý thông tin shop → Quản lý sản phẩm (thêm/sửa/xóa mềm/tồn kho) → Quản lý đơn hàng → Xem thống kê doanh thu.
* **Luồng Quản trị viên (Admin):**
  * Đăng nhập → Admin Dashboard → Quản lý toàn bộ hệ thống: User, Shop, Category, Product, Order.

## 4. Quản lý Trạng thái (State Management) & Gọi API
- **Global State:** Sử dụng `Zustand` để lưu trữ thông tin user hiện tại, access token và số lượng sản phẩm trong giỏ hàng (cập nhật realtime khi user thêm/xóa).
- **API Client:** Sử dụng `Axios` instance được cấu hình sẵn base URL (trỏ tới API Gateway). Tích hợp interceptors để tự động đính kèm JWT Access Token vào header và xử lý logic Refresh Token tự động khi token hết hạn.

## 5. UI/UX và Yêu cầu Phi chức năng
- **Responsive Design:** Giao diện được thiết kế tương thích hoàn toàn trên các thiết bị desktop, laptop, tablet và điện thoại di động.
- **Xử lý lỗi (Error Handling):** Hệ thống bắt và hiển thị thông báo lỗi cụ thể qua popup/toast khi người dùng nhập sai dữ liệu (sai email, mật khẩu, thiếu thông tin nhận hàng, v.v.).
- **Trực quan hóa Dữ liệu:** Dashboard của Seller và Admin trình bày dữ liệu dạng bảng, card thống kê và biểu đồ (sử dụng Recharts) giúp việc theo dõi kinh doanh và quản trị hệ thống trực quan, dễ hiểu.
- **Tối ưu hiệu suất hiển thị:** Tối ưu việc tải ảnh sản phẩm và áp dụng phân trang (pagination) cho các danh sách dữ liệu lớn để tránh tình trạng quá tải (overload) phía client.