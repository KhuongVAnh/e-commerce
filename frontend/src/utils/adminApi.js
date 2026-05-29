export const DEFAULT_PAGINATION = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
};

// Tạo query string an toàn: bỏ qua field rỗng để backend không phải xử lý filter vô nghĩa.
export const buildQueryString = (params = {}) => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      query.set(key, String(value).trim());
    }
  });

  return query.toString();
};

// Một số service trả pagination trong payload, một số trả trong meta; helper này gom về một shape.
export const getPagination = (res) => ({
  ...DEFAULT_PAGINATION,
  ...(res?.pagination || {}),
  ...(res?.data?.pagination || {}),
  ...(res?.meta?.pagination || {}),
  ...(res?.data?.meta?.pagination || {}),
});

// Axios interceptor có thể trả về error gốc hoặc body API lỗi; helper này đọc cả hai dạng.
export const getErrorMessage = (error, fallback = 'Không thể tải dữ liệu.') => (
  error?.response?.data?.message ||
  error?.message ||
  error?.error?.fieldErrors?.[0]?.message ||
  error?.error?.hint ||
  fallback
);

// Format ngày hiển thị trong bảng, tránh crash khi backend trả null hoặc date không hợp lệ.
export const formatDate = (value) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString('vi-VN');
};

export const formatCurrency = (value) => `${Number(value || 0).toLocaleString('vi-VN')} ₫`;

// Dashboard mặc định lấy số liệu trong tháng hiện tại theo API dashboard-summary.
export const getDateRangeForCurrentMonth = () => {
  const now = new Date();
  return {
    from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
    to: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString(),
  };
};
