import { create } from 'zustand';
import { authService } from '../services/authService';

const useAuthStore = create((set) => ({
  user: null, // Sẽ chứa data user từ API { id, email, fullName, role }
  isAuthenticated: false,
  isAuthReady: false,

  //1: Lưu thông tin khi Login thành công
  setAuthData: (userData, accessToken) => {
    // accessToken dùng cho Authorization header; role chỉ dùng để điều hướng/UI nhanh.
    if (accessToken) {
      localStorage.setItem('accessToken', accessToken);
    }
    localStorage.setItem('userRole', userData.role);
    set({ user: userData, isAuthenticated: true, isAuthReady: true });
  },

  //2: Xóa thông tin khi Logout
  clearAuthData: () => {
    // Logout chủ động hoặc refresh thất bại đều đưa store về trạng thái chưa đăng nhập.
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userRole');
    set({ user: null, isAuthenticated: false, isAuthReady: true });
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userRole');
    set({ user: null, isAuthenticated: false, isAuthReady: true });
  },

  initializeAuth: async () => {
    try {
      // Khi reload app, /auth/me xác thực bằng accessToken hiện có.
      // Nếu token hết hạn, axiosClient sẽ tự gọi /auth/refresh bằng refreshToken cookie.
      const res = await authService.getMe({ skipAuthRedirect: true });
      // axiosClient trả về res.data là payload nghiệp vụ chứa user
      const user = res.data?.user || res.data;
      if (user) {
        localStorage.setItem('userRole', user.role);
        set({ user, isAuthenticated: true, isAuthReady: true });
      } else {
        throw new Error("No user data found");
      }
    } catch {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('userRole');
      set({ user: null, isAuthenticated: false, isAuthReady: true });
    }
  },
}));

export default useAuthStore;
