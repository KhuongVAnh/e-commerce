import React, { useState, useEffect } from 'react';
import axiosClient from '../../utils/axiosClient';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0, totalShops: 0, totalRevenue: 0,
    monthlyRevenue: 0, totalOrders: 0, ordersByStatus: {}
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setErrorMsg('');
      try {
        // Tạo filter lấy dữ liệu tháng hiện tại
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

      const [usersRes, shopsRes, summaryRes, ordersRes] = await Promise.allSettled([
        axiosClient.get('/auth/admin/users?page=1&limit=1'),
        axiosClient.get('/catalog/admin/shops?page=1&limit=1'),
        axiosClient.get(`/commerce/admin/dashboard-summary?from=${firstDay}&to=${lastDay}`),
        axiosClient.get('/commerce/admin/orders?page=1&limit=5')
      ]);

        // 1. Xử lý Tổng Users
        const totalUsers = usersRes.status === 'fulfilled'
          ? usersRes.value.data.pagination?.total || 0
          : 0;

        // 2. Xử lý Tổng Shops
        const totalShops = shopsRes.status === 'fulfilled'
          ? shopsRes.value.data.pagination?.total || 0
          : 0;

        // 3. Xử lý Summary (Revenue, Orders, Statuses)
        let summaryData = { totalRevenue: 0, monthlyRevenue: 0, totalOrders: 0, ordersByStatus: {} };
        if (summaryRes.status === 'fulfilled' && summaryRes.value.data) {
          summaryData = summaryRes.value.data;
        }

        setStats({
          totalUsers,
          totalShops,
          ...summaryData,
          ordersByStatus: {
            PENDING: summaryData.pendingOrders || 0,
            DELIVERED: summaryData.deliveredOrders || 0,
            CANCELLED: summaryData.cancelledOrders || 0,
          },
        });

        // 4. Xử lý Recent Orders
        if (ordersRes.status === 'fulfilled' && ordersRes.value.data) {
          setRecentOrders(ordersRes.value.data.orders || []);
        } else {
          setRecentOrders([]);
        }

      } catch (error) {
        console.error("Lỗi lấy dữ liệu Dashboard:", error);
        setErrorMsg(error.message || "Không thể tải dữ liệu dashboard.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING': return <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-[10px] font-black uppercase">Pending</span>;
      case 'AWAITING_PAYMENT': return <span className="px-2.5 py-1 bg-orange-50 text-orange-600 rounded-md text-[10px] font-black uppercase">Awaiting Payment</span>;
      case 'CONFIRMED': return <span className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-md text-[10px] font-black uppercase">Confirmed</span>;
      case 'PROCESSING': return <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-md text-[10px] font-black uppercase">Processing</span>;
      case 'SHIPPING': return <span className="px-2.5 py-1 bg-purple-50 text-purple-600 rounded-md text-[10px] font-black uppercase">Shipping</span>;
      case 'DELIVERED': return <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-md text-[10px] font-black uppercase">Delivered</span>;
      case 'CANCELLED': return <span className="px-2.5 py-1 bg-rose-50 text-rose-600 rounded-md text-[10px] font-black uppercase">Cancelled</span>;
      default: return <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-md text-[10px] font-black uppercase">{status || 'UNKNOWN'}</span>;
    }
  };

  if (loading) {
    return <div className="p-10 text-center text-slate-500 font-bold">Đang phân tích dữ liệu hệ thống...</div>;
  }

  if (errorMsg) {
    return <div className="p-10 text-center text-rose-500 font-bold">{errorMsg}</div>;
  }

  return (
    <div className="p-6 md:p-10 font-sans bg-[#f8fafc] min-h-full">
      <header className="mb-10">
        <h1 className="text-3xl md:text-4xl font-black text-[#2e3785] tracking-tight mb-2">Network Overview</h1>
        <p className="text-slate-500 font-medium text-sm">Tổng quan dữ liệu hệ thống từ Backend.</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl w-fit mb-4"><span className="material-symbols-outlined">group</span></div>
          <h3 className="text-slate-500 font-bold text-[10px] uppercase tracking-widest mb-1">Tổng Users</h3>
          <div className="text-3xl font-black text-slate-900 tracking-tighter">{stats.totalUsers.toLocaleString()}</div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl w-fit mb-4"><span className="material-symbols-outlined">storefront</span></div>
          <h3 className="text-slate-500 font-bold text-[10px] uppercase tracking-widest mb-1">Tổng Shops</h3>
          <div className="text-3xl font-black text-slate-900 tracking-tighter">{stats.totalShops.toLocaleString()}</div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="p-3 bg-orange-50 text-orange-600 rounded-xl w-fit mb-4"><span className="material-symbols-outlined">local_mall</span></div>
          <h3 className="text-slate-500 font-bold text-[10px] uppercase tracking-widest mb-1">Tổng Đơn Hàng</h3>
          <div className="text-3xl font-black text-slate-900 tracking-tighter">{stats.totalOrders.toLocaleString()}</div>
        </div>
        <div className="bg-[#2e3785] p-6 rounded-3xl shadow-lg relative overflow-hidden text-white">
          <div className="p-3 bg-white/20 rounded-xl w-fit mb-4"><span className="material-symbols-outlined">payments</span></div>
          <h3 className="text-indigo-200 font-bold text-[10px] uppercase tracking-widest mb-1">Doanh thu tháng (VND)</h3>
          <div className="text-3xl font-black tracking-tighter">{stats.monthlyRevenue.toLocaleString()}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-50">
            <h2 className="text-lg font-black text-slate-900 mb-1">Đơn hàng gần đây</h2>
          </div>
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Mã Đơn</th>
                  <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Tổng Tiền</th>
                  <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Trạng Thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentOrders.length === 0 ? (
                  <tr><td colSpan="3" className="p-6 text-center text-slate-400 font-medium text-sm">Chưa có giao dịch nào</td></tr>
                ) : recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-bold text-[#2e3785] text-sm">{order.orderCode}</td>
                    <td className="px-6 py-4 font-black text-slate-900 text-sm">{order.totalAmount?.toLocaleString()} ₫</td>
                    <td className="px-6 py-4">{getStatusBadge(order.orderStatus)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-1 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-base font-black mb-6 text-slate-900">Phân bố trạng thái đơn</h3>
          <div className="space-y-5">
            {Object.keys(stats.ordersByStatus).length === 0 ? (
              <p className="text-sm text-slate-500">Chưa có dữ liệu trạng thái.</p>
            ) : Object.entries(stats.ordersByStatus).map(([status, count]) => {
              const total = stats.totalOrders || 1; 
              const percentage = Math.round((count / total) * 100);
              let colorClass = 'bg-slate-400';
              if (status === 'DELIVERED') colorClass = 'bg-emerald-500';
              if (status === 'AWAITING_PAYMENT') colorClass = 'bg-orange-400';
              if (status === 'PENDING') colorClass = 'bg-slate-500';
              if (status === 'SHIPPING' || status === 'PROCESSING' || status === 'CONFIRMED') colorClass = 'bg-[#2e3785]';
              if (status === 'CANCELLED') colorClass = 'bg-rose-500';
              return (
                <div key={status}>
                  <div className="flex justify-between mb-2">
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{status}</span>
                    <div className="flex gap-2 items-center">
                      <span className="text-xs font-black text-slate-900">{Number(count).toLocaleString()}</span>
                      <span className="text-[10px] text-slate-400">({percentage}%)</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className={`${colorClass} h-full rounded-full`} style={{ width: `${percentage}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
export default AdminDashboard;
