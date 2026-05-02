import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';

const ProtectedRoute = ({ allowedRoles }) => {
  const { isAuthenticated, user } = useAuthStore();

  // 1. NẾU CHƯA ĐĂNG NHẬP: Lập tức đá văng về trang Login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />; 
  }

  // 2. NẾU ĐÃ ĐĂNG NHẬP NHƯNG KHÔNG ĐÚNG QUYỀN (Dành cho Admin/Seller)
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = user?.role?.toLowerCase();
    const isRoleMatched = allowedRoles.some(role => role.toLowerCase() === userRole);
    
    if (!isRoleMatched) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // 3. HỢP LỆ: Cho phép đi tiếp vào Component bên trong
  return <Outlet />;
};

export default ProtectedRoute;