import { create } from 'zustand';

const useAuthStore = create((set) => ({
  user: null, // Sẽ chứa data user từ API { id, email, fullName, role }
  isAuthenticated: false,

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
    set({ user: null, isAuthenticated: false });
  }
}));

export default useAuthStore;