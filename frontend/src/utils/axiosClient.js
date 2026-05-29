import axios from 'axios';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const axiosClient = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

const refreshClient = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

let refreshPromise = null;

const clearAuthAndRedirect = () => {
  localStorage.removeItem('userRole');

  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
};

axiosClient.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

axiosClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;
    const errRes = error.response?.data;
    const errorCode = errRes?.error?.code;
    const status = error.response?.status;
    const isAuthError = status === 401 || errorCode === 'UNAUTHORIZED' || errorCode === 'INVALID_TOKEN';
    const isRefreshRequest = originalRequest?.url?.includes('/auth/refresh');
    const isPublicAuthRequest = ['/auth/login', '/auth/register'].some((path) => originalRequest?.url?.includes(path));

    if (isAuthError && originalRequest && !originalRequest._retry && !isRefreshRequest && !isPublicAuthRequest) {
      originalRequest._retry = true;

      try {
        if (!refreshPromise) {
          refreshPromise = refreshClient.post('/auth/refresh').finally(() => {
            refreshPromise = null;
          });
        }

        await refreshPromise;
        return axiosClient(originalRequest);
      } catch (refreshError) {
        clearAuthAndRedirect();
        return Promise.reject(refreshError.response?.data || refreshError);
      }
    }

    if (errRes && errRes.success === false) {
      console.error(`Lỗi API: ${errRes.message}`, errRes.error);
      return Promise.reject(errRes);
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
