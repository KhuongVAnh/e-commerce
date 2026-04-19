import axios from 'axios';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const axiosClient = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosClient.interceptors.response.use(
  (response) => {
    const res = response.data;
    if (res && res.success) {
      return res.data;
    }
    return response;
  },
  (error) => {
    const errRes = error.response?.data;
    if (errRes && errRes.success === false) {
      console.error(`Lỗi API: ${errRes.message}`, errRes.error);
      if (errRes.error?.code === 'UNAUTHORIZED' || errRes.error?.code === 'INVALID_TOKEN') {
         localStorage.removeItem('accessToken');
         localStorage.removeItem('userRole');
         window.location.href = '/login';
      }
      return Promise.reject(errRes);
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
