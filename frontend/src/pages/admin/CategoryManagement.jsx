import { useCallback, useEffect, useMemo, useState } from 'react';
import axiosClient from '../../utils/axiosClient';
import { buildQueryString, DEFAULT_PAGINATION, getErrorMessage } from '../../utils/adminApi';
import {
  AdminConfirmDialog,
  AdminDataTable,
  AdminModal,
  AdminPageHeader,
  AdminPagination,
  AdminSearchInput,
  AdminSelect,
  AdminStatCard,
  AdminStatusBadge,
  AdminToolbar,
} from '../../components/admin/AdminComponents';

const emptyForm = { id: null, name: '', status: 'ACTIVE' };

const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
  const [filters, setFilters] = useState({ q: '', status: '' });
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [formOpen, setFormOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });

  // Category API hiện chưa có page/limit, nên lấy list theo filter rồi phân trang ở client.
  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const query = buildQueryString({ ...filters, status: filters.status || 'ALL' });
      const res = await axiosClient.get(`/catalog/categories${query ? `?${query}` : ''}`);
      const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setCategories(list);
      setPagination((current) => ({
        ...current,
        total: list.length,
        totalPages: Math.max(1, Math.ceil(list.length / current.limit)),
      }));
    } catch (error) {
      setCategories([]);
      setErrorMsg(getErrorMessage(error, 'Không thể tải danh mục.'));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await axiosClient.get('/catalog/admin/categories/stats');
      const data = res?.data || {};

      setStats({
        total: data.total || 0,
        active: data.statuses?.ACTIVE || 0,
        inactive: data.statuses?.INACTIVE || 0,
      });
    } catch (error) {
      console.warn('Không thể tải category stats:', error);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const pagedCategories = useMemo(() => {
    // Cắt dữ liệu theo page hiện tại để category vẫn có UX giống các bảng admin khác.
    const start = (pagination.page - 1) * pagination.limit;
    return categories.slice(start, start + pagination.limit);
  }, [categories, pagination.page, pagination.limit]);

  const updateFilter = (key, value) => {
    // Filter mới làm thay đổi tổng list, vì vậy luôn quay về page đầu.
    setFilters((current) => ({ ...current, [key]: value }));
    setPagination((current) => ({ ...current, page: 1 }));
  };

  const openCreate = () => {
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (category) => {
    setForm({ id: category.id, name: category.name || '', status: category.status || 'ACTIVE' });
    setFormOpen(true);
  };

  const submitForm = async (event) => {
    event.preventDefault();
    setFormLoading(true);
    try {
      // Cùng một form phục vụ cả create và update; form.id quyết định HTTP method.
      const payload = { name: form.name.trim(), status: form.status };
      if (form.id) {
        await axiosClient.put(`/catalog/categories/${form.id}`, payload);
      } else {
        await axiosClient.post('/catalog/categories', payload);
      }
      setFormOpen(false);
      setForm(emptyForm);
      fetchCategories();
      fetchStats();
    } catch (error) {
      alert(getErrorMessage(error, 'Không thể lưu danh mục.'));
    } finally {
      setFormLoading(false);
    }
  };

  const requestStatusChange = (category) => {
    // ACTIVE/INACTIVE là toggle nhẹ, nhưng vẫn confirm vì ảnh hưởng public catalog.
    const nextStatus = category.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setConfirmAction({
      type: 'status',
      category,
      nextStatus,
      danger: nextStatus === 'INACTIVE',
      title: nextStatus === 'ACTIVE' ? 'Bật danh mục?' : 'Tắt danh mục?',
      description: `${category.name} sẽ được chuyển sang trạng thái ${nextStatus}.`,
    });
  };

  const requestDelete = (category) => {
    // Backend sẽ chặn xóa nếu category còn product; UI chỉ cảnh báo trước cho admin.
    setConfirmAction({
      type: 'delete',
      category,
      danger: true,
      title: 'Xóa danh mục?',
      description: `Danh mục ${category.name} chỉ xóa được khi không còn sản phẩm liên kết.`,
    });
  };

  const confirmCategoryAction = async () => {
    if (!confirmAction) return;
    setActionLoading(true);
    try {
      if (confirmAction.type === 'delete') {
        await axiosClient.delete(`/catalog/categories/${confirmAction.category.id}`);
      } else {
        await axiosClient.put(`/catalog/categories/${confirmAction.category.id}`, { status: confirmAction.nextStatus });
      }
      setConfirmAction(null);
      fetchCategories();
      fetchStats();
    } catch (error) {
      alert(getErrorMessage(error, 'Không thể thao tác danh mục.'));
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-full bg-[#f8fafc] p-4 font-sans md:p-6 lg:p-8">
      <AdminPageHeader
        title="Category Management"
        description="Tổ chức danh mục sản phẩm và trạng thái hiển thị."
        action={(
          <button onClick={openCreate} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#2e3785] px-4 text-sm font-black text-white hover:bg-[#252d70]">
            <span className="material-symbols-outlined text-[18px]">add</span>
            Thêm danh mục
          </button>
        )}
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <AdminStatCard icon="category" label="Total System Categories" value={stats.total.toLocaleString('vi-VN')} tone="primary" />
        <AdminStatCard icon="visibility" label="Total Active" value={stats.active.toLocaleString('vi-VN')} tone="success" />
        <AdminStatCard icon="visibility_off" label="Total Inactive" value={stats.inactive.toLocaleString('vi-VN')} />
      </div>

      <AdminToolbar>
        <AdminSearchInput value={filters.q} onChange={(value) => updateFilter('q', value)} placeholder="Tìm danh mục..." />
        <AdminSelect label="Status" value={filters.status} onChange={(value) => updateFilter('status', value)}>
          <option value="">Tất cả trạng thái</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </AdminSelect>
      </AdminToolbar>

      <AdminDataTable
        columns={[
          { key: 'name', label: 'Category' },
          { key: 'slug', label: 'Slug' },
          { key: 'status', label: 'Status' },
          { key: 'actions', label: 'Actions' },
        ]}
        rows={pagedCategories}
        loading={loading}
        error={errorMsg}
        emptyMessage="Không có danh mục phù hợp."
        renderRow={(category) => (
          <tr key={category.id} className="hover:bg-slate-50">
            <td className="px-5 py-4 text-sm font-black text-[#2e3785]">{category.name}</td>
            <td className="px-5 py-4 text-xs font-bold text-slate-400">{category.slug}</td>
            <td className="px-5 py-4"><AdminStatusBadge status={category.status} /></td>
            <td className="px-5 py-4">
              <div className="flex items-center gap-2">
                <button onClick={() => openEdit(category)} className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-100">
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                </button>
                <button onClick={() => requestStatusChange(category)} className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-100">
                  <span className="material-symbols-outlined text-[18px]">{category.status === 'ACTIVE' ? 'visibility_off' : 'visibility'}</span>
                </button>
                <button onClick={() => requestDelete(category)} className="rounded-lg bg-rose-50 p-2 text-rose-700 hover:bg-rose-100">
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
            </td>
          </tr>
        )}
      />

      <AdminPagination
        pagination={pagination}
        onPageChange={(page) => setPagination((current) => ({ ...current, page }))}
        onLimitChange={(limit) => setPagination((current) => ({
          ...current,
          page: 1,
          limit,
          totalPages: Math.max(1, Math.ceil(categories.length / limit)),
        }))}
      />

      <AdminModal open={formOpen} title={form.id ? 'Sửa danh mục' : 'Thêm danh mục'} onClose={() => setFormOpen(false)}>
        <form onSubmit={submitForm} className="space-y-5">
          <div>
            <label className="mb-2 block text-[10px] font-black uppercase text-slate-400">Tên danh mục</label>
            <input
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              required
              className="h-11 w-full rounded-lg border border-slate-200 px-4 text-sm font-bold outline-none focus:border-[#2e3785] focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          <div>
            <label className="mb-2 block text-[10px] font-black uppercase text-slate-400">Trạng thái</label>
            <select
              value={form.status}
              onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
              className="h-11 w-full rounded-lg border border-slate-200 px-4 text-sm font-bold outline-none focus:border-[#2e3785] focus:ring-2 focus:ring-indigo-100"
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setFormOpen(false)} className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700">Hủy</button>
            <button type="submit" disabled={formLoading} className="rounded-lg bg-[#2e3785] px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
              {formLoading ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        </form>
      </AdminModal>

      <AdminConfirmDialog
        open={Boolean(confirmAction)}
        title={confirmAction?.title}
        description={confirmAction?.description}
        danger={confirmAction?.danger}
        confirmText={confirmAction?.type === 'delete' ? 'Xóa' : 'Cập nhật'}
        loading={actionLoading}
        onCancel={() => setConfirmAction(null)}
        onConfirm={confirmCategoryAction}
      />
    </div>
  );
};

export default CategoryManagement;
