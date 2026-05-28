import axios from 'axios';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const wakeClient = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: false,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Dùng axios client riêng để request wake-up không kích hoạt refresh-token/redirect của axiosClient chính.
export const wakeService = {
  wakeGatewayAndServices: async () => {
    const response = await wakeClient.get('/wake', {
      timeout: 30000,
    });

    return response.data;
  },
};
