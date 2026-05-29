import axios from 'axios';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const axiosClient = axios.create({
  baseURL: apiBaseUrl,
  // withCredentials: true, 
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

const clearAuthAndRedirect = ({ redirect = true } = {}) => {
  // Khi refresh thất bại, xóa toàn bộ dấu vết phiên đăng nhập phía FE.
  localStorage.removeItem('accessToken');
  localStorage.removeItem('userRole');

  if (redirect && window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
};

const getAccessTokenFromResponse = (response) => {
  // refreshClient không đi qua response interceptor, nên response vẫn là raw Axios response.
  return response?.data?.data?.tokens?.accessToken || response?.data?.tokens?.accessToken;
};

axiosClient.interceptors.request.use((config) => {
  // Access token được lưu ở localStorage và gửi qua Authorization theo api-inventory.
  // Refresh token vẫn nằm trong httpOnly cookie và tự gửi nhờ withCredentials.
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
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
  async (error) => {
    const originalRequest = error.config;
    const errRes = error.response?.data;
    const errorCode = errRes?.error?.code;
    const status = error.response?.status;
    const isAuthError = status === 401 || errorCode === 'UNAUTHORIZED' || errorCode === 'INVALID_TOKEN';
    const isRefreshRequest = originalRequest?.url?.includes('/auth/refresh');
    const isPublicAuthRequest = ['/auth/login', '/auth/register'].some((path) => originalRequest?.url?.includes(path));
    const shouldSkipAuthRedirect = Boolean(originalRequest?.skipAuthRedirect);

    // Nếu access token hết hạn/không hợp lệ, chỉ refresh một lần rồi retry request cũ.
    // refreshPromise giúp nhiều request 401 cùng lúc dùng chung một lần refresh.
    if (isAuthError && originalRequest && !originalRequest._retry && !isRefreshRequest && !isPublicAuthRequest) {
      originalRequest._retry = true;

      try {
        if (!refreshPromise) {
          refreshPromise = refreshClient.post('/auth/refresh').then((response) => {
            const accessToken = getAccessTokenFromResponse(response);
            if (accessToken) {
              localStorage.setItem('accessToken', accessToken);
            }
            return response;
          }).finally(() => {
            // Reset promise để lần 401 sau có thể tạo request refresh mới.
            refreshPromise = null;
          });
        }

        await refreshPromise;
        return axiosClient(originalRequest);
      } catch (refreshError) {
        clearAuthAndRedirect({ redirect: !shouldSkipAuthRedirect });
        return Promise.reject(refreshError.response?.data || refreshError);
      }
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