import { useCallback, useEffect, useState } from 'react';
import axiosClient from '../../utils/axiosClient';
import { buildQueryString, DEFAULT_PAGINATION, formatCurrency, formatDate, getErrorMessage, getPagination } from '../../utils/adminApi';
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

const productStatuses = ['ACTIVE', 'INACTIVE', 'OUT_OF_STOCK', 'DELETED'];

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
  const [filters, setFilters] = useState({ q: '', status: '', shopId: '', categoryId: '' });
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [filterShops, setFilterShops] = useState([]);
  const [filterCategories, setFilterCategories] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [stats, setStats] = useState({ total: 0, active: 0, outOfStock: 0, deleted: 0 });

  useEffect(() => {
    // Dropdown filter cần danh sách shop/category phụ trợ, tách khỏi API list product chính.
    const fetchFilters = async () => {
      try {
        const [shopsRes, categoriesRes] = await Promise.allSettled([
          axiosClient.get('/catalog/admin/shops?limit=100'),
          axiosClient.get('/catalog/categories'),
        ]);
        if (shopsRes.status === 'fulfilled') {
          setFilterShops(Array.isArray(shopsRes.value?.data?.shops) ? shopsRes.value.data.shops : []);
        }
        if (categoriesRes.status === 'fulfilled') {
          setFilterCategories(Array.isArray(categoriesRes.value?.data) ? categoriesRes.value.data : []);
        }
      } catch {
        setFilterShops([]);
        setFilterCategories([]);
      }
    };
    fetchFilters();
  }, []);

  const fetchProducts = useCallback(async () => {
    // Product admin API hỗ trợ filter + pagination thật, nên query được build từ state UI.
    setLoading(true);
    setErrorMsg('');
    try {
      const query = buildQueryString({ ...filters, page: pagination.page, limit: pagination.limit });
      const res = await axiosClient.get(`/catalog/admin/products?${query}`);
      setProducts(Array.isArray(res?.data?.products) ? res.data.products : []);
      setPagination(getPagination(res));
    } catch (error) {
      setProducts([]);
      setErrorMsg(getErrorMessage(error, 'Không thể tải danh sách sản phẩm.'));
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await axiosClient.get('/catalog/admin/products/stats');
      const data = res?.data || {};

      setStats({
        total: data.total || 0,
        active: data.statuses?.ACTIVE || 0,
        outOfStock: data.statuses?.OUT_OF_STOCK || 0,
        deleted: data.statuses?.DELETED || 0,
      });
    } catch (error) {
      console.warn('Không thể tải product stats:', error);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const updateFilter = (key, value) => {
    // Reset page để kết quả filter mới luôn bắt đầu từ đầu danh sách.
    setFilters((current) => ({ ...current, [key]: value }));
    setPagination((current) => ({ ...current, page: 1 }));
  };

  const openProductDetail = async (product) => {
    // Hiển thị tạm row đang có trước, sau đó thay bằng detail đầy đủ từ API.
    setSelectedProduct(product);
    setDetailLoading(true);
    try {
      const res = await axiosClient.get(`/catalog/admin/products/${product.id}`);
      setSelectedProduct(res?.data?.product || product);
    } catch {
      setSelectedProduct(product);
    } finally {
      setDetailLoading(false);
    }
  };

  const requestStatusChange = (product, nextStatus) => {
    // Đổi status qua PUT admin product; DELETED dùng endpoint delete mềm riêng.
    setConfirmAction({
      type: 'status',
      product,
      nextStatus,
      danger: nextStatus !== 'ACTIVE',
      title: 'Cập nhật trạng thái sản phẩm?',
      description: `${product.name} sẽ được chuyển sang trạng thái ${nextStatus}.`,
    });
  };

  const requestDelete = (product) => {
    // Delete trong catalog là soft delete, không xóa record vật lý.
    setConfirmAction({
      type: 'delete',
      product,
      danger: true,
      title: 'Xóa mềm sản phẩm?',
      description: `${product.name} sẽ chuyển sang trạng thái DELETED và không hiển thị với khách hàng.`,
    });
  };

  const confirmProductAction = async () => {
    if (!confirmAction) return;
    setActionLoading(true);
    try {
      if (confirmAction.type === 'delete') {
        await axiosClient.delete(`/catalog/admin/products/${confirmAction.product.id}`);
      } else {
        await axiosClient.put(`/catalog/admin/products/${confirmAction.product.id}`, { status: confirmAction.nextStatus });
      }
      setConfirmAction(null);
      setSelectedProduct(null);
      fetchProducts();
      fetchStats();
    } catch (error) {
      alert(getErrorMessage(error, 'Không thể cập nhật sản phẩm.'));
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-full bg-[#f8fafc] p-4 font-sans md:p-6 lg:p-8">
      <AdminPageHeader
        title="Product Management"
        description="Kiểm duyệt và quản lý danh sách sản phẩm toàn hệ thống."
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard icon="inventory_2" label="Total System Products" value={stats.total.toLocaleString('vi-VN')} tone="primary" />
        <AdminStatCard icon="check_circle" label="Total Active" value={stats.active.toLocaleString('vi-VN')} tone="success" />
        <AdminStatCard icon="production_quantity_limits" label="Total Out Of Stock" value={stats.outOfStock.toLocaleString('vi-VN')} tone="warning" />
        <AdminStatCard icon="delete" label="Total Deleted" value={stats.deleted.toLocaleString('vi-VN')} tone="danger" />
      </div>

      <AdminToolbar>
        <AdminSearchInput value={filters.q} onChange={(value) => updateFilter('q', value)} placeholder="Tìm sản phẩm..." />
        <AdminSelect label="Shop" value={filters.shopId} onChange={(value) => updateFilter('shopId', value)}>
          <option value="">Tất cả shop</option>
          {filterShops.map((shop) => <option key={shop.id} value={shop.id}>{shop.name}</option>)}
        </AdminSelect>
        <AdminSelect label="Category" value={filters.categoryId} onChange={(value) => updateFilter('categoryId', value)}>
          <option value="">Tất cả danh mục</option>
          {filterCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </AdminSelect>
        <AdminSelect label="Status" value={filters.status} onChange={(value) => updateFilter('status', value)}>
          <option value="">Tất cả trạng thái</option>
          {productStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
        </AdminSelect>
      </AdminToolbar>

      <AdminDataTable
        columns={[
          { key: 'product', label: 'Product' },
          { key: 'shop', label: 'Shop' },
          { key: 'category', label: 'Category' },
          { key: 'price', label: 'Price / Stock' },
          { key: 'status', label: 'Status' },
          { key: 'actions', label: 'Actions' },
        ]}
        rows={products}
        loading={loading}
        error={errorMsg}
        emptyMessage="Không có sản phẩm phù hợp."
        renderRow={(product) => (
          <tr key={product.id} className="hover:bg-slate-50">
            <td className="px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100 font-black text-slate-400">
                  {product.thumbnailUrl ? <img src={product.thumbnailUrl} alt={product.name} className="h-full w-full object-cover" /> : product.name?.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-black text-slate-900">{product.name}</p>
                  <p className="text-xs font-medium text-slate-400">#{product.id} - {product.slug}</p>
                </div>
              </div>
            </td>
            <td className="px-5 py-4 text-sm font-bold text-[#2e3785]">{product.shop?.name || `Shop #${product.shopId}`}</td>
            <td className="px-5 py-4 text-sm font-bold text-slate-600">{product.category?.name || product.categoryId}</td>
            <td className="px-5 py-4">
              <p className="text-sm font-black text-slate-900">{formatCurrency(product.price)}</p>
              <p className="text-xs font-medium text-slate-400">{product.stockQuantity || 0} tồn kho</p>
            </td>
            <td className="px-5 py-4"><AdminStatusBadge status={product.status} /></td>
            <td className="px-5 py-4">
              <div className="flex items-center gap-2">
                <button onClick={() => openProductDetail(product)} className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-100">
                  <span className="material-symbols-outlined text-[18px]">visibility</span>
                </button>
                {product.status !== 'DELETED' && (
                  <>
                    <select
                      value={product.status}
                      onChange={(event) => requestStatusChange(product, event.target.value)}
                      className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs font-bold text-slate-600 outline-none"
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                      <option value="OUT_OF_STOCK">OUT_OF_STOCK</option>
                    </select>
                    <button onClick={() => requestDelete(product)} className="rounded-lg bg-rose-50 p-2 text-rose-700 hover:bg-rose-100">
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </>
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

      <AdminModal open={Boolean(selectedProduct)} title="Product Detail" onClose={() => setSelectedProduct(null)}>
        {detailLoading ? (
          <p className="text-sm font-bold text-slate-400">Đang tải chi tiết...</p>
        ) : (
          <div className="space-y-5">
            <div className="flex items-start gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100 text-xl font-black text-slate-500">
                {selectedProduct?.thumbnailUrl ? <img src={selectedProduct.thumbnailUrl} alt={selectedProduct.name} className="h-full w-full object-cover" /> : selectedProduct?.name?.charAt(0)}
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">{selectedProduct?.name}</h3>
                <p className="text-sm font-medium text-slate-500">{selectedProduct?.shop?.name} - {selectedProduct?.category?.name}</p>
                <div className="mt-2"><AdminStatusBadge status={selectedProduct?.status} /></div>
              </div>
            </div>
            <div className="grid gap-4 rounded-lg bg-slate-50 p-4 md:grid-cols-2">
              <div><p className="text-[10px] font-black uppercase text-slate-400">Price</p><p className="text-sm font-black text-slate-700">{formatCurrency(selectedProduct?.price)}</p></div>
              <div><p className="text-[10px] font-black uppercase text-slate-400">Stock</p><p className="text-sm font-black text-slate-700">{selectedProduct?.stockQuantity || 0}</p></div>
              <div><p className="text-[10px] font-black uppercase text-slate-400">Created</p><p className="text-sm font-bold text-slate-700">{formatDate(selectedProduct?.createdAt)}</p></div>
              <div><p className="text-[10px] font-black uppercase text-slate-400">Updated</p><p className="text-sm font-bold text-slate-700">{formatDate(selectedProduct?.updatedAt)}</p></div>
              <div className="md:col-span-2"><p className="text-[10px] font-black uppercase text-slate-400">Description</p><p className="text-sm font-medium text-slate-600">{selectedProduct?.description || 'N/A'}</p></div>
            </div>
          </div>
        )}
      </AdminModal>

      <AdminConfirmDialog
        open={Boolean(confirmAction)}
        title={confirmAction?.title}
        description={confirmAction?.description}
        danger={confirmAction?.danger}
        confirmText={confirmAction?.type === 'delete' ? 'Xóa mềm' : 'Cập nhật'}
        loading={actionLoading}
        onCancel={() => setConfirmAction(null)}
        onConfirm={confirmProductAction}
      />
    </div>
  );
};

export default ProductManagement;
