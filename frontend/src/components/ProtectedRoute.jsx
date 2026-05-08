import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = ({ allowedRoles }) => {
  const userRole = localStorage.getItem('userRole'); 
  const token = localStorage.getItem('accessToken');

  // TRƯỜNG HỢP 1: Khách vãng lai (Chưa có token)
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // TRƯỜNG HỢP 2: Đã đăng nhập nhưng đi lạc vào khu cấm (Sai Role)
  if (allowedRoles) {
    // Biến tất cả về chữ thường để so sánh, triệt tiêu hoàn toàn lỗi hoa/thường
    const isRoleValid = allowedRoles.some(
      (role) => role.toLowerCase() === (userRole || '').toLowerCase()
    );

    if (!isRoleValid) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // TRƯỜNG HỢP 3: Mọi thứ hợp lệ -> Mở cửa sổ cho đi tiếp
  return <Outlet />;
};

export default ProtectedRoute;