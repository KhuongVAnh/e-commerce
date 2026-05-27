import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';

const ProtectedRoute = ({ allowedRoles }) => {
  const { isAuthenticated, isAuthReady, user } = useAuthStore();

  if (!isAuthReady) {
    return <div className="p-10 text-center text-gray-500 font-bold">Đang kiểm tra phiên đăng nhập...</div>;
  }

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
