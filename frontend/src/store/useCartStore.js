import { create } from 'zustand';

const useCartStore = create((set) => ({
  totalQuantity: 0,

  fetchCartTotal: async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      set({ totalQuantity: 0 });
      return;
    }

    try {
      const res = await fetch('http://localhost:3000/api/commerce/cart', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await res.json();
      
      if (res.ok && result.success && result.data) {
        set({ totalQuantity: result.data.totalQuantity || 0 });
      }
    } catch (error) {
      console.error("Lỗi lấy tổng giỏ hàng:", error);
    }
  }
}));

export default useCartStore;