import axios from 'axios';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
const healthUrls = (import.meta.env.VITE_BACKEND_SERVICE_URLS || import.meta.env.VITE_BACKEND_HEALTH_URLS || '')
  .split(',')
  .map((url) => url.trim())
  .filter(Boolean)
  .map((url) => {
    try {
      return new URL('/health', url).toString();
    } catch {
      return url;
    }
  });

const wakeClient = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: false,
  headers: {
    'Content-Type': 'application/json',
  },
});

const wakeHealthUrl = async (url) => {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 30000);

  try {
    // no-cors vẫn gửi request để đánh thức Render service, kể cả khi service chưa bật CORS.
    await fetch(url, {
      method: 'GET',
      mode: 'no-cors',
      cache: 'no-store',
      signal: controller.signal,
    });
    return { url, ok: true };
  } catch (error) {
    return {
      url,
      ok: false,
      error: error instanceof Error ? error.message : 'Không thể ping service',
    };
  } finally {
    window.clearTimeout(timeoutId);
  }
};

// Dùng client/request riêng để wake-up không kích hoạt refresh-token/redirect của axiosClient chính.
export const wakeService = {
  wakeGatewayAndServices: async () => {
    if (healthUrls.length > 0) {
      const services = await Promise.all(healthUrls.map(wakeHealthUrl));
      const failedServices = services.filter((service) => !service.ok);

      if (failedServices.length > 0) {
        throw new Error('Một số backend services chưa nhận được health request');
      }

      return {
        success: true,
        data: { services },
      };
    }

    const response = await wakeClient.get('/wake', {
      timeout: 30000,
    });

    return response.data;
  },
};
