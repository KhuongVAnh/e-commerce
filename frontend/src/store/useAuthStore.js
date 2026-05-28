import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      // Nhận 2 tham số: user và token. Lưu token ra ngoài LocalStorage
      setAuthData: (user, token) => {
        if (token) {
          localStorage.setItem('accessToken', token);
        }
        set({ user: user, isAuthenticated: true });
      },
      
      // Khi đăng xuất thì xóa hết
      logout: () => {
        localStorage.removeItem('accessToken');
        set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);

export default useAuthStore;