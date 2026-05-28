import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axiosClient from '../../utils/axiosClient';
import useAuthStore from '../../store/useAuthStore';
import { buildQueryString, DEFAULT_PAGINATION, formatDate, getErrorMessage, getPagination } from '../../utils/adminApi';
import {
  AdminConfirmDialog,
  AdminDataTable,
  AdminPageHeader,
  AdminPagination,
  AdminSearchInput,
  AdminSelect,
  AdminStatCard,
  AdminStatusBadge,
  AdminToolbar,
} from '../../components/admin/AdminComponents';

const UserManagement = () => {
  const currentUser = useAuthStore((state) => state.user);
  const [searchParams] = useSearchParams();
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
  const [filters, setFilters] = useState(() => ({
    q: searchParams.get('q') || '',
    role: searchParams.get('role') || '',
    status: searchParams.get('status') || '',
  }));
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Danh sách user là API phân trang thật, nên filters/page/limit đều gửi thẳng xuống backend.
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const query = buildQueryString({ ...filters, page: pagination.page, limit: pagination.limit });
      const res = await axiosClient.get(`/auth/admin/users?${query}`);
      setUsers(Array.isArray(res?.data?.users) ? res.data.users : []);
      setPagination(getPagination(res));
    } catch (error) {
      setUsers([]);
      setErrorMsg(getErrorMessage(error, 'Không thể tải danh sách người dùng.'));
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const updateFilter = (key, value) => {
    // Đổi filter phải quay về trang 1 để tránh page hiện tại vượt quá số trang mới.
    setFilters((current) => ({ ...current, [key]: value }));
    setPagination((current) => ({ ...current, page: 1 }));
  };

  const requestStatusChange = (user, nextStatus) => {
    const isSelf = String(user.id) === String(currentUser?.id);
    // Chỉ mở dialog ở bước này; request thật chỉ chạy khi admin xác nhận.
    setConfirmAction({
      user,
      nextStatus,
      danger: nextStatus !== 'ACTIVE',
      title: nextStatus === 'ACTIVE' ? 'Mở khóa người dùng?' : 'Khóa người dùng?',
      description: isSelf
        ? 'Bạn đang thao tác trên chính tài khoản đang đăng nhập. Backend sẽ chặn thao tác tự khóa.'
        : `${user.fullName} sẽ được chuyển sang trạng thái ${nextStatus}.`,
    });
  };

  const confirmStatusChange = async () => {
    if (!confirmAction) return;
    setActionLoading(true);
    try {
      await axiosClient.patch(`/auth/admin/users/${confirmAction.user.id}`, { status: confirmAction.nextStatus });
      setConfirmAction(null);
      fetchUsers();
    } catch (error) {
      alert(getErrorMessage(error, 'Không thể cập nhật trạng thái người dùng.'));
    } finally {
      setActionLoading(false);
    }
  };

  const stats = {
    // Total lấy từ backend; các số còn lại là thống kê nhanh trên page hiện tại.
    total: pagination.total,
    active: users.filter((user) => user.status === 'ACTIVE').length,
    blocked: users.filter((user) => user.status === 'BLOCKED').length,
    admins: users.filter((user) => user.role === 'ADMIN').length,
  };

  return (
    <div className="min-h-full bg-[#f8fafc] p-4 font-sans md:p-6 lg:p-8">
      <AdminPageHeader
        title="User Management"
        description="Quản lý tài khoản, vai trò và trạng thái truy cập của người dùng."
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard icon="group" label="Total Results" value={stats.total.toLocaleString('vi-VN')} tone="primary" />
        <AdminStatCard icon="verified_user" label="Active On Page" value={stats.active} tone="success" />
        <AdminStatCard icon="block" label="Blocked On Page" value={stats.blocked} tone="danger" />
        <AdminStatCard icon="admin_panel_settings" label="Admins On Page" value={stats.admins} />
      </div>

      <AdminToolbar>
        <AdminSearchInput value={filters.q} onChange={(value) => updateFilter('q', value)} placeholder="Tìm tên hoặc email..." />
        <AdminSelect label="Role" value={filters.role} onChange={(value) => updateFilter('role', value)}>
          <option value="">Tất cả role</option>
          <option value="CUSTOMER">Customer</option>
          <option value="SELLER">Seller</option>
          <option value="ADMIN">Admin</option>
        </AdminSelect>
        <AdminSelect label="Status" value={filters.status} onChange={(value) => updateFilter('status', value)}>
          <option value="">Tất cả trạng thái</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="BLOCKED">Blocked</option>
        </AdminSelect>
      </AdminToolbar>

      <AdminDataTable
        columns={[
          { key: 'identity', label: 'User Identity' },
          { key: 'role', label: 'Role' },
          { key: 'status', label: 'Status' },
          { key: 'createdAt', label: 'Created' },
          { key: 'actions', label: 'Actions' },
        ]}
        rows={users}
        loading={loading}
        error={errorMsg}
        emptyMessage="Không có người dùng phù hợp."
        renderRow={(user) => (
          <tr key={user.id} className="hover:bg-slate-50">
            <td className="px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm font-black uppercase text-slate-500">
                  {user.fullName?.charAt(0) || 'U'}
                </div>
                <div>
                  <p className="text-sm font-black text-slate-900">{user.fullName}</p>
                  <p className="text-xs font-medium text-slate-400">{user.email}</p>
                </div>
              </div>
            </td>
            <td className="px-5 py-4"><AdminStatusBadge status={user.role} /></td>
            <td className="px-5 py-4"><AdminStatusBadge status={user.status} /></td>
            <td className="px-5 py-4 text-sm font-medium text-slate-500">{formatDate(user.createdAt)}</td>
            <td className="px-5 py-4">
              {user.status === 'ACTIVE' ? (
                <button onClick={() => requestStatusChange(user, 'BLOCKED')} className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-3 py-2 text-xs font-black text-rose-700 hover:bg-rose-100">
                  <span className="material-symbols-outlined text-[16px]">block</span>
                  Khóa
                </button>
              ) : (
                <button onClick={() => requestStatusChange(user, 'ACTIVE')} className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700 hover:bg-emerald-100">
                  <span className="material-symbols-outlined text-[16px]">lock_open</span>
                  Mở
                </button>
              )}
            </td>
          </tr>
        )}
      />

      <AdminPagination
        pagination={pagination}
        onPageChange={(page) => setPagination((current) => ({ ...current, page }))}
        onLimitChange={(limit) => setPagination((current) => ({ ...current, page: 1, limit }))}
      />

      <AdminConfirmDialog
        open={Boolean(confirmAction)}
        title={confirmAction?.title}
        description={confirmAction?.description}
        danger={confirmAction?.danger}
        confirmText={confirmAction?.nextStatus === 'ACTIVE' ? 'Mở khóa' : 'Khóa user'}
        loading={actionLoading}
        onCancel={() => setConfirmAction(null)}
        onConfirm={confirmStatusChange}
      />
    </div>
  );
};

export default UserManagement;
