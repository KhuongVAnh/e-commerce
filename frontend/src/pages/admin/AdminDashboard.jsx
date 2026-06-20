import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axiosClient from '../../utils/axiosClient';
import { formatCurrency, formatDate, getDateRangeForCurrentMonth, getErrorMessage } from '../../utils/adminApi';
import {
  AdminDataTable,
  AdminPageHeader,
  AdminStatCard,
  AdminStatusBadge,
} from '../../components/admin/AdminComponents';

const AdminDashboard = () => {
  const { t } = useTranslation();
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
    const fetchDashboard = async () => {
      setLoading(true);
      setErrorMsg('');
      try {
        const range = getDateRangeForCurrentMonth();
        const [usersRes, shopsRes, summaryRes, ordersRes] = await Promise.all([
          axiosClient.get('/auth/admin/users/stats'),
          axiosClient.get('/catalog/admin/shops/stats'),
          axiosClient.get(`/commerce/admin/dashboard-summary?from=${range.from}&to=${range.to}`),
          axiosClient.get('/commerce/admin/orders?page=1&limit=5'),
        ]);

        const summary = summaryRes?.data || {};
        setStats({
          totalUsers: usersRes?.data?.total || 0,
          totalShops: shopsRes?.data?.total || 0,
          totalOrders: summary.totalOrders || 0,
          totalRevenue: summary.totalRevenue || 0,
          monthlyRevenue: summary.monthlyRevenue || 0,
          pendingOrders: summary.pendingOrders || 0,
          deliveredOrders: summary.deliveredOrders || 0,
          cancelledOrders: summary.cancelledOrders || 0,
        });
        setRecentOrders(Array.isArray(ordersRes?.data?.orders) ? ordersRes.data.orders : []);
      } catch (error) {
        setErrorMsg(getErrorMessage(error, t('Không thể tải bảng tổng quan admin.')));
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [t]);

  const breakdown = [
    { label: t('Chờ xử lý'), value: stats.pendingOrders, status: 'PENDING' },
    { label: t('Đã giao'), value: stats.deliveredOrders, status: 'DELIVERED' },
    { label: t('Đã hủy'), value: stats.cancelledOrders, status: 'CANCELLED' },
  ];

  return (
    <div className="min-h-full bg-[#f8fafc] p-4 font-sans md:p-6 lg:p-8">
      <AdminPageHeader
        title={t('Tổng quan quản trị')}
        description={t('Tổng quan vận hành hệ thống, doanh thu tháng và các đơn hàng mới nhất.')}
      />

      {errorMsg && <div className="mb-4 rounded-lg border border-rose-100 bg-rose-50 p-4 text-sm font-bold text-rose-700">{errorMsg}</div>}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard icon="group" label={t('Người dùng')} value={stats.totalUsers.toLocaleString('vi-VN')} tone="primary" />
        <AdminStatCard icon="storefront" label={t('Cửa hàng')} value={stats.totalShops.toLocaleString('vi-VN')} />
        <AdminStatCard icon="receipt_long" label={t('Đơn hàng tháng này')} value={stats.totalOrders.toLocaleString('vi-VN')} tone="warning" />
        <AdminStatCard icon="payments" label={t('Doanh thu tháng này')} value={formatCurrency(stats.monthlyRevenue)} tone="success" />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Link to="/admin/shops?status=PENDING" className="rounded-lg border border-slate-100 bg-white p-5 shadow-sm transition hover:border-[#2e3785]">
          <p className="text-[11px] font-black uppercase text-slate-400">{t('Duyệt cửa hàng')}</p>
          <p className="mt-2 text-sm font-bold text-slate-600">{t('Mở trang cửa hàng để xử lý các gian hàng đang chờ.')}</p>
        </Link>
        <Link to="/admin/users?status=BLOCKED" className="rounded-lg border border-slate-100 bg-white p-5 shadow-sm transition hover:border-[#2e3785]">
          <p className="text-[11px] font-black uppercase text-slate-400">{t('Truy cập người dùng')}</p>
          <p className="mt-2 text-sm font-bold text-slate-600">{t('Kiểm tra tài khoản bị khóa hoặc cần mở lại.')}</p>
        </Link>
        <Link to="/admin/orders?status=PENDING" className="rounded-lg border border-slate-100 bg-white p-5 shadow-sm transition hover:border-[#2e3785]">
          <p className="text-[11px] font-black uppercase text-slate-400">{t('Đơn chờ xử lý')}</p>
          <p className="mt-2 text-sm font-bold text-slate-600">{t('Theo dõi các đơn hàng chưa xử lý.')}</p>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900">{t('Đơn hàng gần đây')}</h2>
            <Link to="/admin/orders" className="text-sm font-black text-[#2e3785] hover:underline">{t('Xem tất cả')}</Link>
          </div>
          <AdminDataTable
            columns={[
              { key: 'order', label: t('Đơn hàng') },
              { key: 'customer', label: t('Khách hàng') },
              { key: 'amount', label: t('Tổng tiền') },
              { key: 'date', label: t('Ngày đặt') },
              { key: 'status', label: t('Trạng thái') },
            ]}
            rows={recentOrders}
            loading={loading}
            error=""
            emptyMessage={t('Chưa có đơn hàng gần đây.')}
            renderRow={(order) => (
              <tr key={order.id} className="hover:bg-slate-50">
                <td className="px-5 py-4 text-sm font-black text-[#2e3785]">#{order.orderCode}</td>
                <td className="px-5 py-4 text-sm font-bold text-slate-700">{order.receiverName || `${t('Khách hàng')} #${order.customerId}`}</td>
                <td className="px-5 py-4 text-sm font-black text-slate-900">{formatCurrency(order.totalAmount)}</td>
                <td className="px-5 py-4 text-sm font-medium text-slate-500">{formatDate(order.createdAt)}</td>
                <td className="px-5 py-4"><AdminStatusBadge status={order.orderStatus} /></td>
              </tr>
            )}
          />
        </div>

        <div className="rounded-lg border border-slate-100 bg-white p-5 shadow-sm">
          <h2 className="mb-5 text-lg font-black text-slate-900">{t('Trạng thái đơn hàng')}</h2>
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
            <p className="text-[11px] font-black uppercase text-slate-400">{t('Doanh thu đã giao')}</p>
            <p className="mt-2 text-2xl font-black text-slate-900">{formatCurrency(stats.totalRevenue)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;