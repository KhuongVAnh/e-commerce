import { create } from 'zustand';
import axiosClient from '../utils/axiosClient';
import useAuthStore from './useAuthStore';

const useCartStore = create((set) => ({
  totalQuantity: 0,

  fetchCartTotal: async () => {
    const isAuthenticated = useAuthStore.getState().isAuthenticated;
    if (!isAuthenticated) {
      set({ totalQuantity: 0 });
      return;
    }

    try {
      const res = await axiosClient.get('/commerce/cart');
      set({ totalQuantity: res.data.totalQuantity || 0 });
    } catch (error) {
      console.error("Lỗi lấy tổng giỏ hàng:", error);
    }
  }
}));

export default useCartStore;
