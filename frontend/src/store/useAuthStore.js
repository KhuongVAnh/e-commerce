import { create } from 'zustand';
import { authService } from '../services/authService';

const useAuthStore = create((set) => ({
  user: null, // Sẽ chứa data user từ API { id, email, fullName, role }
  isAuthenticated: false,
  isAuthReady: false,

  //1: Lưu thông tin khi Login thành công
  setAuthData: (userData, accessToken) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('userRole', userData.role);
    
    set({ user: userData, isAuthenticated: true });
  },

  //2: Xóa thông tin khi Logout
  clearAuthData: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userRole');
    set({ user: null, isAuthenticated: false, isAuthReady: true });
  },

  initializeAuth: async () => {
    const token = localStorage.getItem('accessToken');

    if (!token) {
      set({ user: null, isAuthenticated: false, isAuthReady: true });
      return;
    }

    try {
      const res = await authService.getMe();
      set({ user: res.data.user, isAuthenticated: true, isAuthReady: true });
    } catch {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('userRole');
      set({ user: null, isAuthenticated: false, isAuthReady: true });
    }
  },
}));

export default useAuthStore;
