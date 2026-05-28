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
  const [stats, setStats] = useState({ total: 0, sellers: 0, admins: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

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
      fetchStats();
    } catch (error) {
      alert(getErrorMessage(error, 'Không thể cập nhật trạng thái người dùng.'));
    } finally {
      setActionLoading(false);
    }
  };
  
  const fetchStats = useCallback(async () => {
    try {
      const [allRes, sellerRes, adminRes] = await Promise.allSettled([
        axiosClient.get('/auth/admin/users?limit=1'),
        axiosClient.get('/auth/admin/users?role=SELLER&limit=1'),
        axiosClient.get('/auth/admin/users?role=ADMIN&limit=1'),
      ]);

      const getTotal = (res) =>
        res.status === 'fulfilled'
          ? res.value?.data?.pagination?.total || res.value?.pagination?.total || 0
          : 0;

      setStats({
        total: getTotal(allRes),
        sellers: getTotal(sellerRes),
        admins: getTotal(adminRes),
      });
    } catch (error) {
      console.warn('Không thể tải Stats:', error);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const openEditModal = async (userId) => {
    setIsModalOpen(true);
    setSelectedUser(null);

    try {
      const res = await axiosClient.get(`/auth/admin/users/${userId}`);
      setSelectedUser(res?.data?.user || res?.user || res?.data);
    } catch (error) {
      alert('Lỗi tải chi tiết: ' + getErrorMessage(error));
      setIsModalOpen(false);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;

    setIsSaving(true);

    try {
      await axiosClient.patch(`/auth/admin/users/${selectedUser.id}`, {
        fullName: selectedUser.fullName,
        role: selectedUser.role,
        status: selectedUser.status,
      });

      alert('Cập nhật người dùng thành công!');
      setIsModalOpen(false);
      fetchUsers();
      fetchStats();
    } catch (error) {
      alert(getErrorMessage(error, 'Không thể cập nhật người dùng.'));
    } finally {
      setIsSaving(false);
    }
  };    

  return (
    <div className="min-h-full bg-[#f8fafc] p-4 font-sans md:p-6 lg:p-8">
      <AdminPageHeader
        title="User Management"
        description="Quản lý tài khoản, vai trò và trạng thái truy cập của người dùng."
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          icon="group"
          label="Total System Users"
          value={stats.total.toLocaleString('vi-VN')}
          tone="primary"
        />

        <AdminStatCard
          icon="storefront"
          label="Total Sellers"
          value={stats.sellers.toLocaleString('vi-VN')}
          tone="success"
        />

        <AdminStatCard
          icon="admin_panel_settings"
          label="Total Admins"
          value={stats.admins.toLocaleString('vi-VN')}
        />

        <AdminStatCard
          icon="groups"
          label="Users In Current Page"
          value={users.length.toLocaleString('vi-VN')}
        />
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
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEditModal(user.id)}
                  className="inline-flex items-center gap-1 rounded-lg bg-slate-50 px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-100"
                >
                  <span className="material-symbols-outlined text-[16px]">edit</span>
                  Sửa
                </button>

                {user.status === 'ACTIVE' ? (
                  <button
                    onClick={() => requestStatusChange(user, 'BLOCKED')}
                    className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-3 py-2 text-xs font-black text-rose-700 hover:bg-rose-100"
                  >
                    <span className="material-symbols-outlined text-[16px]">block</span>
                    Khóa
                  </button>
                ) : (
                  <button
                    onClick={() => requestStatusChange(user, 'ACTIVE')}
                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700 hover:bg-emerald-100"
                  >
                    <span className="material-symbols-outlined text-[16px]">lock_open</span>
                    Mở
                  </button>
                )}
              </div>
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
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="relative p-6 md:p-8">
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute right-6 top-6 text-slate-400 hover:text-slate-900"
              >
                <span className="material-symbols-outlined">close</span>
              </button>

              <h2 className="mb-6 text-2xl font-black text-slate-900">Cập nhật người dùng</h2>

              {!selectedUser ? (
                <div className="py-10 text-center font-medium text-slate-500">
                  Đang tải dữ liệu...
                </div>
              ) : (
                <form onSubmit={handleUpdateUser} className="space-y-5">
                  <div>
                    <label className="mb-2 block text-[11px] font-black uppercase tracking-widest text-slate-500">
                      Email
                    </label>
                    <input
                      type="text"
                      value={selectedUser.email || ''}
                      disabled
                      className="w-full cursor-not-allowed rounded-xl bg-slate-100 px-4 py-3.5 text-sm font-medium text-slate-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-[11px] font-black uppercase tracking-widest text-slate-500">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={selectedUser.fullName || ''}
                      onChange={(e) =>
                        setSelectedUser({ ...selectedUser, fullName: e.target.value })
                      }
                      required
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-[#2e3785]/20"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-2 block text-[11px] font-black uppercase tracking-widest text-slate-500">
                        Role
                      </label>
                      <select
                        value={selectedUser.role || 'CUSTOMER'}
                        onChange={(e) =>
                          setSelectedUser({ ...selectedUser, role: e.target.value })
                        }
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-bold text-slate-700 outline-none"
                      >
                        <option value="CUSTOMER">Customer</option>
                        <option value="SELLER">Seller</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-[11px] font-black uppercase tracking-widest text-slate-500">
                        Status
                      </label>
                      <select
                        value={selectedUser.status || 'ACTIVE'}
                        onChange={(e) =>
                          setSelectedUser({ ...selectedUser, status: e.target.value })
                        }
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-bold text-slate-700 outline-none"
                      >
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="INACTIVE">INACTIVE</option>
                        <option value="BLOCKED">BLOCKED</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-2 flex justify-end gap-3 border-t border-slate-100 pt-6">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="rounded-xl bg-slate-100 px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-200"
                    >
                      Hủy
                    </button>

                    <button
                      type="submit"
                      disabled={isSaving}
                      className="rounded-xl bg-[#2e3785] px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-[#252d70] disabled:opacity-70"
                    >
                      {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}    
    </div>
  );
};

export default UserManagement;
