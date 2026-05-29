const inputClassName = 'h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-[#2e3785] focus:ring-2 focus:ring-indigo-100';

// Header chuẩn cho các trang admin để tiêu đề, mô tả và nút hành động luôn đồng nhất.
export const AdminPageHeader = ({ title, description, action }) => (
  <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
    <div>
      <h1 className="text-2xl font-black text-[#2e3785] md:text-3xl">{title}</h1>
      {description && <p className="mt-2 max-w-2xl text-sm font-medium text-slate-500">{description}</p>}
    </div>
    {action}
  </header>
);

// Card KPI dùng chung trên dashboard và các trang list; tone chỉ đổi màu theo nghiệp vụ.
export const AdminStatCard = ({ icon, label, value, tone = 'default' }) => {
  const tones = {
    default: 'border-slate-100 bg-white text-slate-900',
    primary: 'border-[#2e3785] bg-[#2e3785] text-white',
    success: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    warning: 'border-amber-100 bg-amber-50 text-amber-700',
    danger: 'border-rose-100 bg-rose-50 text-rose-700',
  };

  return (
    <div className={`rounded-lg border p-5 shadow-sm ${tones[tone] || tones.default}`}>
      <div className="mb-3 flex items-center gap-2">
        {icon && <span className="material-symbols-outlined text-[20px]">{icon}</span>}
        <span className="text-[11px] font-black uppercase opacity-70">{label}</span>
      </div>
      <div className="text-3xl font-black">{value}</div>
    </div>
  );
};

// Map enum backend sang màu badge. Nếu backend thêm enum mới, badge vẫn fallback về slate.
const statusToneMap = {
  ACTIVE: 'bg-emerald-50 text-emerald-700',
  INACTIVE: 'bg-slate-100 text-slate-600',
  BLOCKED: 'bg-rose-50 text-rose-700',
  PENDING: 'bg-amber-50 text-amber-700',
  AWAITING_PAYMENT: 'bg-orange-50 text-orange-700',
  CONFIRMED: 'bg-blue-50 text-blue-700',
  PROCESSING: 'bg-indigo-50 text-indigo-700',
  SHIPPING: 'bg-purple-50 text-purple-700',
  DELIVERED: 'bg-emerald-50 text-emerald-700',
  CANCELLED: 'bg-rose-50 text-rose-700',
  PAID: 'bg-emerald-50 text-emerald-700',
  FAILED: 'bg-rose-50 text-rose-700',
  COD_PENDING: 'bg-amber-50 text-amber-700',
  OUT_OF_STOCK: 'bg-orange-50 text-orange-700',
  DELETED: 'bg-rose-50 text-rose-700',
};

// Badge trạng thái/role hiển thị thống nhất cho user, shop, product, order.
export const AdminStatusBadge = ({ status }) => (
  <span className={`inline-flex rounded-md px-2.5 py-1 text-[10px] font-black uppercase ${statusToneMap[status] || 'bg-slate-100 text-slate-600'}`}>
    {status || 'N/A'}
  </span>
);

// Thanh filter/search chung, giữ layout responsive cho các bảng admin.
export const AdminToolbar = ({ children }) => (
  <div className="mb-4 flex flex-col gap-3 rounded-lg border border-slate-100 bg-white p-4 shadow-sm lg:flex-row lg:items-center">
    {children}
  </div>
);

// Input search có icon cố định để các trang không phải lặp lại markup.
export const AdminSearchInput = ({ value, onChange, placeholder = 'Tìm kiếm...' }) => (
  <div className="relative w-full lg:max-w-xs">
    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-slate-400">search</span>
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className={`${inputClassName} w-full pl-10`}
    />
  </div>
);

// Select filter dùng chung. Label nằm trong component để form compact nhưng vẫn rõ nghĩa.
export const AdminSelect = ({ value, onChange, children, label }) => (
  <label className="flex min-w-0 flex-col gap-1">
    {label && <span className="text-[10px] font-black uppercase text-slate-400">{label}</span>}
    <select value={value} onChange={(event) => onChange(event.target.value)} className={`${inputClassName} min-w-36`}>
      {children}
    </select>
  </label>
);

// Date input dùng cho order filter; giữ style giống select/search.
export const AdminDateInput = ({ value, onChange, label }) => (
  <label className="flex min-w-0 flex-col gap-1">
    {label && <span className="text-[10px] font-black uppercase text-slate-400">{label}</span>}
    <input type="date" value={value} onChange={(event) => onChange(event.target.value)} className={inputClassName} />
  </label>
);

// Bảng admin chuẩn hóa 3 trạng thái quan trọng: loading, error, empty.
export const AdminDataTable = ({
  columns,
  rows,
  loading,
  error,
  emptyMessage = 'Không có dữ liệu.',
  renderRow,
  tableClassName = 'w-full min-w-[820px] text-left',
}) => (
  <div className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-sm">
    <div className="overflow-x-auto">
      <table className={tableClassName}>
        <thead className="bg-slate-50">
          <tr>
            {columns.map((column) => (
              <th key={column.key || column} className={`px-5 py-4 text-[10px] font-black uppercase text-slate-400 ${column.headerClassName || ''}`}>
                {column.label || column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {loading && (
            <tr><td colSpan={columns.length} className="px-5 py-10 text-center text-sm font-bold text-slate-400">Đang tải dữ liệu...</td></tr>
          )}
          {!loading && error && (
            <tr><td colSpan={columns.length} className="px-5 py-10 text-center text-sm font-bold text-rose-600">{error}</td></tr>
          )}
          {!loading && !error && rows.length === 0 && (
            <tr><td colSpan={columns.length} className="px-5 py-10 text-center text-sm font-bold text-slate-400">{emptyMessage}</td></tr>
          )}
          {!loading && !error && rows.map(renderRow)}
        </tbody>
      </table>
    </div>
  </div>
);

// Pagination dùng chung cho API có page/limit; category cũng dùng để phân trang client-side.
export const AdminPagination = ({ pagination, onPageChange, onLimitChange }) => {
  const page = pagination?.page || 1;
  const limit = pagination?.limit || 10;
  const total = pagination?.total || 0;
  const totalPages = Math.max(1, pagination?.totalPages || 1);

  return (
    <div className="mt-4 flex flex-col gap-3 rounded-lg border border-slate-100 bg-white px-4 py-3 text-sm font-bold text-slate-600 shadow-sm md:flex-row md:items-center md:justify-between">
      <span>
        Trang {page}/{totalPages} - {total.toLocaleString('vi-VN')} bản ghi
      </span>
      <div className="flex items-center gap-2">
        <select value={limit} onChange={(event) => onLimitChange(Number(event.target.value))} className={inputClassName}>
          {[10, 20, 50, 100].map((item) => <option key={item} value={item}>{item}/trang</option>)}
        </select>
        <button onClick={() => onPageChange(page - 1)} disabled={page <= 1} className="h-10 rounded-lg border border-slate-200 px-3 disabled:cursor-not-allowed disabled:opacity-40">
          <span className="material-symbols-outlined text-[18px]">chevron_left</span>
        </button>
        <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} className="h-10 rounded-lg border border-slate-200 px-3 disabled:cursor-not-allowed disabled:opacity-40">
          <span className="material-symbols-outlined text-[18px]">chevron_right</span>
        </button>
      </div>
    </div>
  );
};

// Dialog xác nhận cho thao tác có side effect như khóa user, xóa mềm product, đổi trạng thái order.
export const AdminConfirmDialog = ({ open, title, description, confirmText = 'Xác nhận', danger, onCancel, onConfirm, loading }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="text-xl font-black text-slate-900">{title}</h2>
        {description && <p className="mt-2 text-sm font-medium leading-6 text-slate-500">{description}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onCancel} disabled={loading} className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 disabled:opacity-50">Hủy</button>
          <button onClick={onConfirm} disabled={loading} className={`rounded-lg px-4 py-2 text-sm font-bold text-white disabled:opacity-50 ${danger ? 'bg-rose-600 hover:bg-rose-700' : 'bg-[#2e3785] hover:bg-[#252d70]'}`}>
            {loading ? 'Đang xử lý...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

// Modal đọc/sửa chi tiết; dùng chung để tránh mỗi trang tự dựng overlay khác nhau.
export const AdminModal = ({ open, title, children, onClose }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-xl font-black text-[#2e3785]">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};
