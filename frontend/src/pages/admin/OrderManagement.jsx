import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axiosClient from '../../utils/axiosClient';
import { buildQueryString, DEFAULT_PAGINATION, formatCurrency, formatDate, getErrorMessage, getPagination } from '../../utils/adminApi';
import {
  AdminConfirmDialog,
  AdminDataTable,
  AdminDateInput,
  AdminModal,
  AdminPageHeader,
  AdminPagination,
  AdminSearchInput,
  AdminSelect,
  AdminStatCard,
  AdminStatusBadge,
  AdminToolbar,
} from '../../components/admin/AdminComponents';

const orderStatuses = ['PENDING', 'AWAITING_PAYMENT', 'CONFIRMED', 'PROCESSING', 'SHIPPING', 'DELIVERED', 'CANCELLED'];
const paymentStatuses = ['PENDING', 'PAID', 'FAILED', 'COD_PENDING'];
const paymentMethods = ['COD', 'VNPAY'];

// Date input chỉ có yyyy-mm-dd; API cần ISO datetime để lọc đủ đầu/cuối ngày.
const toIsoDateStart = (value) => (value ? new Date(`${value}T00:00:00`).toISOString() : '');
const toIsoDateEnd = (value) => (value ? new Date(`${value}T23:59:59.999`).toISOString() : '');

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [searchParams] = useSearchParams();
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
  const [filters, setFilters] = useState(() => ({
    q: searchParams.get('q') || '',
    status: searchParams.get('status') || '',
    paymentStatus: searchParams.get('paymentStatus') || '',
    paymentMethod: searchParams.get('paymentMethod') || '',
    shopId: searchParams.get('shopId') || '',
    customerId: searchParams.get('customerId') || '',
    from: searchParams.get('from') || '',
    to: searchParams.get('to') || '',
  }));
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchOrders = useCallback(async () => {
    // Order admin API hỗ trợ nhiều filter; chỉ field có giá trị mới được đưa vào query.
    setLoading(true);
    setErrorMsg('');
    try {
      const query = buildQueryString({
        ...filters,
        from: toIsoDateStart(filters.from),
        to: toIsoDateEnd(filters.to),
        page: pagination.page,
        limit: pagination.limit,
      });
      const res = await axiosClient.get(`/commerce/admin/orders?${query}`);
      setOrders(Array.isArray(res?.data?.orders) ? res.data.orders : []);
      setPagination(getPagination(res));
    } catch (error) {
      setOrders([]);
      setErrorMsg(getErrorMessage(error, 'Không thể tải danh sách đơn hàng.'));
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const updateFilter = (key, value) => {
    // Filter mới reset page để tránh gọi page không tồn tại sau khi thu hẹp kết quả.
    setFilters((current) => ({ ...current, [key]: value }));
    setPagination((current) => ({ ...current, page: 1 }));
  };

  const openOrderDetail = async (order) => {
    // Modal mở ngay với dữ liệu row, sau đó hydrate items/payments từ detail endpoint.
    setSelectedOrder(order);
    setDetailLoading(true);
    try {
      const res = await axiosClient.get(`/commerce/admin/orders/${order.id}`);
      setSelectedOrder(res?.data?.order || order);
    } catch {
      setSelectedOrder(order);
    } finally {
      setDetailLoading(false);
    }
  };

  const requestStatusChange = (order, nextStatus) => {
    // Đổi trạng thái đơn hàng là thao tác nghiệp vụ quan trọng nên luôn cần confirm.
    setConfirmAction({
      order,
      nextStatus,
      danger: nextStatus === 'CANCELLED',
      title: 'Cập nhật trạng thái đơn hàng?',
      description: `Đơn #${order.orderCode} sẽ được chuyển sang trạng thái ${nextStatus}.`,
    });
  };

  const confirmOrderAction = async () => {
    if (!confirmAction) return;
    setActionLoading(true);
    try {
      await axiosClient.patch(`/commerce/admin/orders/${confirmAction.order.id}/status`, { status: confirmAction.nextStatus });
      setConfirmAction(null);
      setSelectedOrder(null);
      fetchOrders();
    } catch (error) {
      alert(getErrorMessage(error, 'Không thể cập nhật trạng thái đơn hàng.'));
    } finally {
      setActionLoading(false);
    }
  };

  const stats = {
    // Total là tổng kết quả backend; các count còn lại giúp admin scan nhanh page hiện tại.
    total: pagination.total,
    pending: orders.filter((order) => order.orderStatus === 'PENDING' || order.orderStatus === 'AWAITING_PAYMENT').length,
    paid: orders.filter((order) => order.paymentStatus === 'PAID').length,
    cancelled: orders.filter((order) => order.orderStatus === 'CANCELLED').length,
  };

  return (
    <div className="min-h-full bg-[#f8fafc] p-4 font-sans md:p-6 lg:p-8">
      <AdminPageHeader
        title="Order Management"
        description="Theo dõi, lọc và cập nhật trạng thái đơn hàng toàn hệ thống."
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard icon="receipt_long" label="Total Results" value={stats.total.toLocaleString('vi-VN')} tone="primary" />
        <AdminStatCard icon="pending_actions" label="Pending On Page" value={stats.pending} tone="warning" />
        <AdminStatCard icon="payments" label="Paid On Page" value={stats.paid} tone="success" />
        <AdminStatCard icon="cancel" label="Cancelled On Page" value={stats.cancelled} tone="danger" />
      </div>

      <AdminToolbar>
        <AdminSearchInput value={filters.q} onChange={(value) => updateFilter('q', value)} placeholder="Tìm mã đơn..." />
        <AdminSelect label="Order Status" value={filters.status} onChange={(value) => updateFilter('status', value)}>
          <option value="">Tất cả trạng thái</option>
          {orderStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
        </AdminSelect>
        <AdminSelect label="Payment" value={filters.paymentStatus} onChange={(value) => updateFilter('paymentStatus', value)}>
          <option value="">Tất cả thanh toán</option>
          {paymentStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
        </AdminSelect>
        <AdminSelect label="Method" value={filters.paymentMethod} onChange={(value) => updateFilter('paymentMethod', value)}>
          <option value="">Tất cả phương thức</option>
          {paymentMethods.map((method) => <option key={method} value={method}>{method}</option>)}
        </AdminSelect>
        <div className="grid grid-cols-2 gap-2">
          <AdminDateInput label="From" value={filters.from} onChange={(value) => updateFilter('from', value)} />
          <AdminDateInput label="To" value={filters.to} onChange={(value) => updateFilter('to', value)} />
        </div>
        <input
          value={filters.shopId}
          onChange={(event) => updateFilter('shopId', event.target.value)}
          placeholder="Shop ID"
          className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-[#2e3785] focus:ring-2 focus:ring-indigo-100"
        />
        <input
          value={filters.customerId}
          onChange={(event) => updateFilter('customerId', event.target.value)}
          placeholder="Customer ID"
          className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-[#2e3785] focus:ring-2 focus:ring-indigo-100"
        />
      </AdminToolbar>

      <AdminDataTable
        columns={[
          { key: 'order', label: 'Order' },
          { key: 'customer', label: 'Customer' },
          { key: 'shop', label: 'Shop' },
          { key: 'payment', label: 'Payment' },
          { key: 'date', label: 'Date' },
          { key: 'total', label: 'Total' },
          { key: 'status', label: 'Status' },
          { key: 'actions', label: 'Actions' },
        ]}
        rows={orders}
        loading={loading}
        error={errorMsg}
        emptyMessage="Không có đơn hàng phù hợp."
        renderRow={(order) => (
          <tr key={order.id} className="hover:bg-slate-50">
            <td className="px-5 py-4 text-sm font-black text-[#2e3785]">#{order.orderCode}</td>
            <td className="px-5 py-4">
              <p className="text-sm font-black text-slate-900">{order.receiverName}</p>
              <p className="text-xs font-medium text-slate-400">Customer #{order.customerId}</p>
            </td>
            <td className="px-5 py-4 text-sm font-bold text-slate-600">Shop #{order.shopId}</td>
            <td className="px-5 py-4">
              <p className="text-xs font-black text-slate-700">{order.paymentMethod}</p>
              <AdminStatusBadge status={order.paymentStatus} />
            </td>
            <td className="px-5 py-4 text-sm font-medium text-slate-500">{formatDate(order.createdAt)}</td>
            <td className="px-5 py-4 text-sm font-black text-slate-900">{formatCurrency(order.totalAmount)}</td>
            <td className="px-5 py-4"><AdminStatusBadge status={order.orderStatus} /></td>
            <td className="px-5 py-4">
              <div className="flex items-center gap-2">
                <button onClick={() => openOrderDetail(order)} className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-100">
                  <span className="material-symbols-outlined text-[18px]">visibility</span>
                </button>
                <select
                  value={order.orderStatus}
                  onChange={(event) => requestStatusChange(order, event.target.value)}
                  className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs font-bold text-slate-600 outline-none"
                >
                  {orderStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
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

      <AdminModal open={Boolean(selectedOrder)} title="Order Detail" onClose={() => setSelectedOrder(null)}>
        {detailLoading ? (
          <p className="text-sm font-bold text-slate-400">Đang tải chi tiết...</p>
        ) : (
          <div className="space-y-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900">#{selectedOrder?.orderCode}</h3>
                <p className="text-sm font-medium text-slate-500">{selectedOrder?.receiverName} - {selectedOrder?.receiverPhone}</p>
              </div>
              <div className="flex gap-2">
                <AdminStatusBadge status={selectedOrder?.orderStatus} />
                <AdminStatusBadge status={selectedOrder?.paymentStatus} />
              </div>
            </div>
            <div className="grid gap-4 rounded-lg bg-slate-50 p-4 md:grid-cols-2">
              <div><p className="text-[10px] font-black uppercase text-slate-400">Total</p><p className="text-sm font-black text-slate-700">{formatCurrency(selectedOrder?.totalAmount)}</p></div>
              <div><p className="text-[10px] font-black uppercase text-slate-400">Shipping Fee</p><p className="text-sm font-black text-slate-700">{formatCurrency(selectedOrder?.shippingFee)}</p></div>
              <div><p className="text-[10px] font-black uppercase text-slate-400">Shop</p><p className="text-sm font-bold text-slate-700">#{selectedOrder?.shopId}</p></div>
              <div><p className="text-[10px] font-black uppercase text-slate-400">Customer</p><p className="text-sm font-bold text-slate-700">#{selectedOrder?.customerId}</p></div>
              <div className="md:col-span-2"><p className="text-[10px] font-black uppercase text-slate-400">Address</p><p className="text-sm font-medium text-slate-600">{selectedOrder?.receiverAddress}</p></div>
              <div className="md:col-span-2"><p className="text-[10px] font-black uppercase text-slate-400">Note</p><p className="text-sm font-medium text-slate-600">{selectedOrder?.note || 'N/A'}</p></div>
            </div>
            {Array.isArray(selectedOrder?.items) && (
              <div>
                <h4 className="mb-3 text-sm font-black uppercase text-slate-500">Items</h4>
                <div className="overflow-hidden rounded-lg border border-slate-100">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between border-b border-slate-50 px-4 py-3 last:border-b-0">
                      <div>
                        <p className="text-sm font-black text-slate-900">{item.productNameSnapshot}</p>
                        <p className="text-xs font-medium text-slate-400">Product #{item.productId} x {item.quantity}</p>
                      </div>
                      <p className="text-sm font-black text-slate-700">{formatCurrency(item.subtotal)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </AdminModal>

      <AdminConfirmDialog
        open={Boolean(confirmAction)}
        title={confirmAction?.title}
        description={confirmAction?.description}
        danger={confirmAction?.danger}
        confirmText="Cập nhật"
        loading={actionLoading}
        onCancel={() => setConfirmAction(null)}
        onConfirm={confirmOrderAction}
      />
    </div>
  );
};

export default OrderManagement;
