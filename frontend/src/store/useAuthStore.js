import { create } from 'zustand';
import { authService } from '../services/authService';

const useAuthStore = create((set) => ({
  user: null, // Sẽ chứa data user từ API { id, email, fullName, role }
  isAuthenticated: false,
  isAuthReady: false,

  //1: Lưu thông tin khi Login thành công
  setAuthData: (userData) => {
    localStorage.setItem('userRole', userData.role);
    set({ user: userData, isAuthenticated: true });
  },

  //2: Xóa thông tin khi Logout
  clearAuthData: () => {
    localStorage.removeItem('userRole');
    set({ user: null, isAuthenticated: false, isAuthReady: true });
  },

  initializeAuth: async () => {
    try {
      const res = await authService.getMe();
      // axiosClient trả về res.data là payload nghiệp vụ chứa user
      const user = res.data?.user || res.data;
      if (user) {
        set({ user, isAuthenticated: true, isAuthReady: true });
      } else {
        throw new Error("No user data found");
      }
    } catch {
      localStorage.removeItem('userRole');
      set({ user: null, isAuthenticated: false, isAuthReady: true });
    }
  },
}));

export default useAuthStore;
