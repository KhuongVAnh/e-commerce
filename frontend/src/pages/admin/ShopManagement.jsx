import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axiosClient from '../../utils/axiosClient';
import { buildQueryString, DEFAULT_PAGINATION, formatDate, getErrorMessage, getPagination } from '../../utils/adminApi';
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

const ShopManagement = () => {
  const [shops, setShops] = useState([]);
  const [searchParams] = useSearchParams();
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
  const [filters, setFilters] = useState(() => ({
    q: searchParams.get('q') || '',
    status: searchParams.get('status') || '',
  }));
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedShop, setSelectedShop] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [stats, setStats] = useState({ total: 0, pending: 0, active: 0, inactive: 0 });

  // Shop admin API hỗ trợ q/status/page/limit, nên bảng lấy dữ liệu trực tiếp từ server.
  const fetchShops = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const query = buildQueryString({ ...filters, page: pagination.page, limit: pagination.limit });
      const res = await axiosClient.get(`/catalog/admin/shops?${query}`);
      setShops(Array.isArray(res?.data?.shops) ? res.data.shops : []);
      setPagination(getPagination(res));
    } catch (error) {
      setShops([]);
      setErrorMsg(getErrorMessage(error, 'Không thể tải danh sách shop.'));
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchShops();
  }, [fetchShops]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await axiosClient.get('/catalog/admin/shops/stats');
      const data = res?.data || {};

      setStats({
        total: data.total || 0,
        pending: data.statuses?.PENDING || 0,
        active: data.statuses?.ACTIVE || 0,
        inactive: data.statuses?.INACTIVE || 0,
      });
    } catch (error) {
      console.warn('Không thể tải shop stats:', error);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const updateFilter = (key, value) => {
    // Reset page khi filter đổi để tránh gọi một page không còn dữ liệu.
    setFilters((current) => ({ ...current, [key]: value }));
    setPagination((current) => ({ ...current, page: 1 }));
  };

  const openShopDetail = async (shop) => {
    // Mở modal ngay bằng dữ liệu list, sau đó hydrate thêm chi tiết nếu API thành công.
    setSelectedShop(shop);
    setDetailLoading(true);
    try {
      const res = await axiosClient.get(`/catalog/admin/shops/${shop.id}`);
      setSelectedShop(res?.data?.shop || shop);
    } catch {
      setSelectedShop(shop);
    } finally {
      setDetailLoading(false);
    }
  };

  const requestStatusChange = (shop, nextStatus) => {
    // Action trạng thái cần confirm vì ảnh hưởng trực tiếp việc shop được bán hàng hay không.
    setConfirmAction({
      shop,
      nextStatus,
      danger: nextStatus === 'INACTIVE',
      title: nextStatus === 'ACTIVE' ? 'Duyệt hoặc mở lại shop?' : 'Khóa shop?',
      description: `${shop.name} sẽ được chuyển sang trạng thái ${nextStatus}.`,
    });
  };

  const confirmStatusChange = async () => {
    if (!confirmAction) return;
    setActionLoading(true);
    try {
      await axiosClient.patch(`/catalog/admin/shops/${confirmAction.shop.id}/status`, { status: confirmAction.nextStatus });
      setConfirmAction(null);
      setSelectedShop(null);
      fetchShops();
      fetchStats();
    } catch (error) {
      alert(getErrorMessage(error, 'Không thể cập nhật trạng thái shop.'));
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-full bg-[#f8fafc] p-4 font-sans md:p-6 lg:p-8">
      <AdminPageHeader
        title="Shop Management"
        description="Duyệt, khóa và theo dõi các gian hàng trên hệ thống."
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard icon="storefront" label="Total System Shops" value={stats.total.toLocaleString('vi-VN')} tone="primary" />
        <AdminStatCard icon="pending_actions" label="Total Pending" value={stats.pending.toLocaleString('vi-VN')} tone="warning" />
        <AdminStatCard icon="verified" label="Total Active" value={stats.active.toLocaleString('vi-VN')} tone="success" />
        <AdminStatCard icon="pause_circle" label="Total Inactive" value={stats.inactive.toLocaleString('vi-VN')} tone="danger" />
      </div>

      <AdminToolbar>
        <AdminSearchInput value={filters.q} onChange={(value) => updateFilter('q', value)} placeholder="Tìm tên hoặc slug shop..." />
        <AdminSelect label="Status" value={filters.status} onChange={(value) => updateFilter('status', value)}>
          <option value="">Tất cả trạng thái</option>
          <option value="PENDING">Pending</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </AdminSelect>
      </AdminToolbar>

      <AdminDataTable
        columns={[
          { key: 'shop', label: 'Shop' },
          { key: 'seller', label: 'Seller ID' },
          { key: 'address', label: 'Address' },
          { key: 'createdAt', label: 'Created' },
          { key: 'status', label: 'Status' },
          { key: 'actions', label: 'Actions' },
        ]}
        rows={shops}
        loading={loading}
        error={errorMsg}
        emptyMessage="Không có shop phù hợp."
        renderRow={(shop) => (
          <tr key={shop.id} className="hover:bg-slate-50">
            <td className="px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100 font-black text-slate-500">
                  {shop.logoUrl ? <img src={shop.logoUrl} alt={shop.name} className="h-full w-full object-cover" /> : shop.name?.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-black text-slate-900">{shop.name}</p>
                  <p className="text-xs font-medium text-slate-400">{shop.slug}</p>
                </div>
              </div>
            </td>
            <td className="px-5 py-4 text-sm font-bold text-[#2e3785]">#{shop.sellerId}</td>
            <td className="max-w-xs truncate px-5 py-4 text-sm font-medium text-slate-500">{shop.address || 'N/A'}</td>
            <td className="px-5 py-4 text-sm font-medium text-slate-500">{formatDate(shop.createdAt)}</td>
            <td className="px-5 py-4"><AdminStatusBadge status={shop.status} /></td>
            <td className="px-5 py-4">
              <div className="flex items-center gap-2">
                <button onClick={() => openShopDetail(shop)} className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-100">
                  <span className="material-symbols-outlined text-[18px]">visibility</span>
                </button>
                {shop.status !== 'ACTIVE' && (
                  <button onClick={() => requestStatusChange(shop, 'ACTIVE')} className="rounded-lg bg-emerald-50 p-2 text-emerald-700 hover:bg-emerald-100">
                    <span className="material-symbols-outlined text-[18px]">check</span>
                  </button>
                )}
                {shop.status !== 'INACTIVE' && (
                  <button onClick={() => requestStatusChange(shop, 'INACTIVE')} className="rounded-lg bg-rose-50 p-2 text-rose-700 hover:bg-rose-100">
                    <span className="material-symbols-outlined text-[18px]">block</span>
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

      <AdminModal open={Boolean(selectedShop)} title="Shop Detail" onClose={() => setSelectedShop(null)}>
        {detailLoading ? (
          <p className="text-sm font-bold text-slate-400">Đang tải chi tiết...</p>
        ) : (
          <div className="space-y-5">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100 text-xl font-black text-slate-500">
                {selectedShop?.logoUrl ? <img src={selectedShop.logoUrl} alt={selectedShop.name} className="h-full w-full object-cover" /> : selectedShop?.name?.charAt(0)}
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">{selectedShop?.name}</h3>
                <p className="text-sm font-medium text-slate-500">Seller #{selectedShop?.sellerId}</p>
                <div className="mt-2"><AdminStatusBadge status={selectedShop?.status} /></div>
              </div>
            </div>
            <div className="grid gap-4 rounded-lg bg-slate-50 p-4 md:grid-cols-2">
              <div><p className="text-[10px] font-black uppercase text-slate-400">Slug</p><p className="text-sm font-bold text-slate-700">{selectedShop?.slug}</p></div>
              <div><p className="text-[10px] font-black uppercase text-slate-400">Created</p><p className="text-sm font-bold text-slate-700">{formatDate(selectedShop?.createdAt)}</p></div>
              <div className="md:col-span-2"><p className="text-[10px] font-black uppercase text-slate-400">Address</p><p className="text-sm font-bold text-slate-700">{selectedShop?.address || 'N/A'}</p></div>
              <div className="md:col-span-2"><p className="text-[10px] font-black uppercase text-slate-400">Description</p><p className="text-sm font-medium text-slate-600">{selectedShop?.description || 'N/A'}</p></div>
            </div>
          </div>
        )}
      </AdminModal>

      <AdminConfirmDialog
        open={Boolean(confirmAction)}
        title={confirmAction?.title}
        description={confirmAction?.description}
        danger={confirmAction?.danger}
        confirmText={confirmAction?.nextStatus === 'ACTIVE' ? 'Chuyển ACTIVE' : 'Chuyển INACTIVE'}
        loading={actionLoading}
        onCancel={() => setConfirmAction(null)}
        onConfirm={confirmStatusChange}
      />
    </div>
  );
};

export default ShopManagement;
