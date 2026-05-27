import axiosClient from '../utils/axiosClient';

export const notificationService = {
  getMyNotifications: ({ page = 1, limit = 12, isRead } = {}) => {
    const params = { page, limit };

    if (typeof isRead === 'boolean') {
      params.isRead = isRead;
    }

    return axiosClient.get('/notifications/me', { params });
  },

  getNotificationDetail: (id) => axiosClient.get(`/notifications/${id}`),

  markAsRead: (id) => axiosClient.patch(`/notifications/${id}/read`),

  markAllAsRead: () => axiosClient.patch('/notifications/read-all'),
};
