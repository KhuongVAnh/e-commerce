import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../../utils/axiosClient';
import { formatCurrency, formatDate, getDateRangeForCurrentMonth, getErrorMessage, getPagination } from '../../utils/adminApi';
import {
  AdminDataTable,
  AdminPageHeader,
  AdminStatCard,
  AdminStatusBadge,
} from '../../components/admin/AdminComponents';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalShops: 0,
    totalOrders: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    pendingOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    // Dashboard gom dữ liệu từ 3 service khác nhau, nên gọi song song để giảm thời gian chờ.
    const fetchDashboard = async () => {
      setLoading(true);
      setErrorMsg('');
      try {
        const range = getDateRangeForCurrentMonth();
        const [usersRes, shopsRes, summaryRes, ordersRes] = await Promise.all([
          axiosClient.get('/auth/admin/users?page=1&limit=1'),
          axiosClient.get('/catalog/admin/shops?page=1&limit=1'),
          axiosClient.get(`/commerce/admin/dashboard-summary?from=${range.from}&to=${range.to}`),
          axiosClient.get('/commerce/admin/orders?page=1&limit=5'),
        ]);

        // axiosClient trả thẳng body API; data mới là payload nghiệp vụ của sendSuccess.
        const summary = summaryRes?.data || {};
        setStats({
          totalUsers: getPagination(usersRes).total,
          totalShops: getPagination(shopsRes).total,
          totalOrders: summary.totalOrders || 0,
          totalRevenue: summary.totalRevenue || 0,
          monthlyRevenue: summary.monthlyRevenue || 0,
          pendingOrders: summary.pendingOrders || 0,
          deliveredOrders: summary.deliveredOrders || 0,
          cancelledOrders: summary.cancelledOrders || 0,
        });
        setRecentOrders(Array.isArray(ordersRes?.data?.orders) ? ordersRes.data.orders : []);
      } catch (error) {
        setErrorMsg(getErrorMessage(error, 'Không thể tải dashboard admin.'));
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  // Dữ liệu nhỏ cho card breakdown, giữ tách riêng khỏi JSX để phần render dễ đọc.
  const breakdown = [
    { label: 'Pending', value: stats.pendingOrders, status: 'PENDING' },
    { label: 'Delivered', value: stats.deliveredOrders, status: 'DELIVERED' },
    { label: 'Cancelled', value: stats.cancelledOrders, status: 'CANCELLED' },
  ];

  return (
    <div className="min-h-full bg-[#f8fafc] p-4 font-sans md:p-6 lg:p-8">
      <AdminPageHeader
        title="Admin Dashboard"
        description="Tổng quan vận hành hệ thống, doanh thu tháng và các đơn hàng mới nhất."
      />

      {errorMsg && <div className="mb-4 rounded-lg border border-rose-100 bg-rose-50 p-4 text-sm font-bold text-rose-700">{errorMsg}</div>}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard icon="group" label="Users" value={stats.totalUsers.toLocaleString('vi-VN')} tone="primary" />
        <AdminStatCard icon="storefront" label="Shops" value={stats.totalShops.toLocaleString('vi-VN')} />
        <AdminStatCard icon="receipt_long" label="Orders This Month" value={stats.totalOrders.toLocaleString('vi-VN')} tone="warning" />
        <AdminStatCard icon="payments" label="Monthly Revenue" value={formatCurrency(stats.monthlyRevenue)} tone="success" />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Link to="/admin/shops?status=PENDING" className="rounded-lg border border-slate-100 bg-white p-5 shadow-sm transition hover:border-[#2e3785]">
          <p className="text-[11px] font-black uppercase text-slate-400">Shop Approval</p>
          <p className="mt-2 text-sm font-bold text-slate-600">Mở trang shop để xử lý các gian hàng pending.</p>
        </Link>
        <Link to="/admin/users?status=BLOCKED" className="rounded-lg border border-slate-100 bg-white p-5 shadow-sm transition hover:border-[#2e3785]">
          <p className="text-[11px] font-black uppercase text-slate-400">User Access</p>
          <p className="mt-2 text-sm font-bold text-slate-600">Kiểm tra tài khoản bị khóa hoặc cần mở lại.</p>
        </Link>
        <Link to="/admin/orders?status=PENDING" className="rounded-lg border border-slate-100 bg-white p-5 shadow-sm transition hover:border-[#2e3785]">
          <p className="text-[11px] font-black uppercase text-slate-400">Pending Orders</p>
          <p className="mt-2 text-sm font-bold text-slate-600">Theo dõi các đơn hàng chưa xử lý.</p>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900">Recent Orders</h2>
            <Link to="/admin/orders" className="text-sm font-black text-[#2e3785] hover:underline">Xem tất cả</Link>
          </div>
          <AdminDataTable
            columns={[
              { key: 'order', label: 'Order' },
              { key: 'customer', label: 'Customer' },
              { key: 'amount', label: 'Amount' },
              { key: 'date', label: 'Date' },
              { key: 'status', label: 'Status' },
            ]}
            rows={recentOrders}
            loading={loading}
            error=""
            emptyMessage="Chưa có đơn hàng gần đây."
            renderRow={(order) => (
              <tr key={order.id} className="hover:bg-slate-50">
                <td className="px-5 py-4 text-sm font-black text-[#2e3785]">#{order.orderCode}</td>
                <td className="px-5 py-4 text-sm font-bold text-slate-700">{order.receiverName || `Customer #${order.customerId}`}</td>
                <td className="px-5 py-4 text-sm font-black text-slate-900">{formatCurrency(order.totalAmount)}</td>
                <td className="px-5 py-4 text-sm font-medium text-slate-500">{formatDate(order.createdAt)}</td>
                <td className="px-5 py-4"><AdminStatusBadge status={order.orderStatus} /></td>
              </tr>
            )}
          />
        </div>

        <div className="rounded-lg border border-slate-100 bg-white p-5 shadow-sm">
          <h2 className="mb-5 text-lg font-black text-slate-900">Order Status</h2>
          <div className="space-y-5">
            {breakdown.map((item) => {
              const percentage = stats.totalOrders > 0 ? Math.round((item.value / stats.totalOrders) * 100) : 0;
              return (
                <div key={item.status}>
                  <div className="mb-2 flex items-center justify-between">
                    <AdminStatusBadge status={item.status} />
                    <span className="text-sm font-black text-slate-700">{item.value.toLocaleString('vi-VN')} ({percentage}%)</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-[#2e3785]" style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-6 rounded-lg bg-slate-50 p-4">
            <p className="text-[11px] font-black uppercase text-slate-400">Delivered Revenue</p>
            <p className="mt-2 text-2xl font-black text-slate-900">{formatCurrency(stats.totalRevenue)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
