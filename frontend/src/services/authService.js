import axiosClient from '../utils/axiosClient';

export const authService = {
  // Gọi API Đăng nhập
  login: (email, password) => {
    return axiosClient.post('/auth/login', { email, password });
  },

  // Gọi API Đăng ký
  register: (userData) => {
    return axiosClient.post('/auth/register', userData);
  },

  // Gọi API Lấy thông tin user hiện tại (dùng để check lúc load trang)
  getMe: () => {
    return axiosClient.get('/auth/me');
  },

  // Gọi API Đăng xuất
  logout: () => {
    return axiosClient.post('/auth/logout');
  }
};