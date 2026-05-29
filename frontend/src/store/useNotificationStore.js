import { create } from 'zustand';
import axiosClient from '../utils/axiosClient';

const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,

  // 1. Gọi API lấy danh sách thông báo
  fetchNotifications: async () => {
    try {
      const res = await axiosClient.get('/notifications/me');
      
      const rawNotifs = res?.data?.notifications || res?.notifications || [];
      
      const mappedNotifs = rawNotifs.map(n => ({
        id: n.id,
        type: n.type,
        title: n.title,
        content: n.content,
        isRead: n.is_read === 1 || n.is_read === true,
        createdAt: n.created_at
      }));

      const unread = mappedNotifs.filter(n => !n.isRead).length;

      set({ 
        notifications: mappedNotifs, 
        unreadCount: unread 
      });
    } catch (error) {
      console.error("Lỗi khi tải thông báo từ API:", error);
    }
  },

  // 2. Gọi API đánh dấu 1 thông báo đã đọc
  markAsRead: async (id) => {
    try {
      await axiosClient.patch(`/notifications/${id}/read`);
      
      set((state) => ({
        notifications: state.notifications.map((n) => 
          n.id === id ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      }));
    } catch (error) {
      console.error("Lỗi khi đánh dấu đã đọc:", error);
    }
  },

  // 3. Đánh dấu tất cả đã đọc
  markAllAsRead: async () => {
    try {
      const { notifications } = get();
      const unreadNotifs = notifications.filter(n => !n.isRead);
      
      if (unreadNotifs.length > 0) {
        await Promise.all(
          unreadNotifs.map(n => axiosClient.patch(`/notifications/${n.id}/read`))
        );
      }

      // Cập nhật UI
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0
      }));
    } catch (error) {
      console.error("Lỗi khi đánh dấu tất cả thông báo:", error);
    }
  }
}));

export default useNotificationStore;