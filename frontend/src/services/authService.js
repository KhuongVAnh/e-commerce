import axiosClient from '../utils/axiosClient';

export const authService = {
  // Gọi API Đăng nhập
  login: (email, password, role) => {
    return axiosClient.post('/auth/login', { email, password, role });
  },

  // Gọi API Đăng ký
  register: (userData) => {
    return axiosClient.post('/auth/register', userData);
  },

  // Gọi API Lấy thông tin user hiện tại (dùng để check lúc load trang)
  getMe: (config = {}) => {
    return axiosClient.get('/auth/me', config);
  },

  // Gọi API Đăng xuất
  logout: () => {
    return axiosClient.post('/auth/logout');
  },

  refresh: () => {
    return axiosClient.post('/auth/refresh');
  }
};
