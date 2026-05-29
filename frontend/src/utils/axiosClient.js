import axios from 'axios';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const axiosClient = axios.create({
  baseURL: apiBaseUrl,
  // withCredentials: true, 
  headers: {
    'Content-Type': 'application/json',
  },
});

// 1. TỰ ĐỘNG LẤY TOKEN GẮN VÀO HEADER TRƯỚC KHI GỌI API
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 2. XỬ LÝ LỖI KHI API TRẢ VỀ
axiosClient.interceptors.response.use(
  (response) => {
    const res = response.data;
    if (res && res.success) {
      return res.data;
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401 || error.response?.data?.error?.code === 'UNAUTHORIZED') {
         localStorage.removeItem('accessToken');
         localStorage.removeItem('auth-storage'); // Xóa state của Zustand
         window.location.href = '/login';
    }
    
    const errRes = error.response?.data;
    if (errRes && errRes.success === false) {
      console.error(`Lỗi API: ${errRes.message}`, errRes.error);
      return Promise.reject(errRes);
    }
    return Promise.reject(error);
  }
);

export default axiosClient;