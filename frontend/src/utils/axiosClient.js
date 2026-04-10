import axios from 'axios';

const axiosClient = axios.create({
  baseURL: 'http://localhost:5000/api', // Đổi theo port Backend
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      console.error('Token hết hạn hoặc không hợp lệ, vui lòng đăng nhập lại.');
      // Có thể thêm logic tự động logout hoặc refresh token ở đây
    }
    return Promise.reject(error);
  }
);

export default axiosClient;