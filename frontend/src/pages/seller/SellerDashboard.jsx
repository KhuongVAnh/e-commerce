import React, { useState, useEffect } from 'react';
import axiosClient from '../../utils/axiosClient';

const SellerDashboard = () => {
  const [isApiReady, setIsApiReady] = useState(true);

  const defaultStats = { totalOrders: 245, orderGrowth: "+12%", totalRevenue: 42500000, totalProducts: 18, pendingOrders: 12 };
  const defaultOrders = [
    { id: 101, orderCode: "MOCK-001", createdAt: "2023-10-29T10:00:00Z", grandTotal: 1250000, orderStatus: "CONFIRMED" },
    { id: 102, orderCode: "MOCK-002", createdAt: "2023-10-28T14:30:00Z", grandTotal: 3400000, orderStatus: "PROCESSING" },
  ];

  const [stats, setStats] = useState(defaultStats);
  const [recentOrders, setRecentOrders] = useState(defaultOrders);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const ordersData = await axiosClient.get('/api/orders/my');
        setRecentOrders(ordersData);
        setIsApiReady(true);
      } catch (error) {
        console.error("🔴 [SellerDashboard] API Lỗi:", error);
        setIsApiReady(false);
        setStats(defaultStats);
        setRecentOrders(defaultOrders);
      }
    };
    fetchDashboardData();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-emerald-100 text-emerald-700';
      case 'PROCESSING': return 'bg-indigo-100 text-indigo-700';
      case 'PENDING': return 'bg-orange-100 text-orange-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-6 text-slate-800">
      
      {!isApiReady && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md shadow-sm">
          <div className="flex">
            <span className="material-symbols-outlined text-yellow-500 mr-3">warning</span>
            <div>
              <p className="text-sm font-bold text-yellow-800">Chưa nhận được dữ liệu từ Backend!</p>
              <p className="text-sm text-yellow-700 mt-1">
                Hệ thống đang tạm hiển thị giao diện bằng <b>Dữ liệu mẫu (Mock Data)</b>. F12 để xem chi tiết lỗi.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-400 tracking-wider mb-2">TOTAL ORDERS</span>
          <div className="flex items-end gap-3"><span className="text-3xl font-bold">{stats.totalOrders}</span></div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-400 tracking-wider mb-2">TOTAL REVENUE</span>
          <div className="flex items-end gap-3"><span className="text-3xl font-bold">{stats.totalRevenue.toLocaleString()} ₫</span></div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-400 tracking-wider mb-2">TOTAL PRODUCTS</span>
          <div className="flex items-end gap-3"><span className="text-3xl font-bold">{stats.totalProducts}</span></div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-indigo-100 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500"></div>
          <span className="text-xs font-semibold text-slate-400 tracking-wider mb-2">PENDING ORDERS</span>
          <div className="flex items-end gap-3"><span className="text-3xl font-bold text-indigo-900">{stats.pendingOrders}</span></div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-lg font-bold text-indigo-900 mb-6">Weekly Sales Performance</h2>
        <div className="h-64 w-full bg-slate-50 flex items-center justify-center rounded-xl border border-dashed border-slate-200">
            <span className="text-slate-400 font-medium">Khu vực Render Biểu Đồ (Đợi Chart.js)</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 flex justify-between items-center border-b border-slate-50">
          <h2 className="text-lg font-bold text-indigo-900">Recent Orders</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-xs font-semibold text-slate-400 tracking-wider">
                <th className="px-6 py-4">ORDER ID</th>
                <th className="px-6 py-4">DATE</th>
                <th className="px-6 py-4">TOTAL AMOUNT</th>
                <th className="px-6 py-4">STATUS</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {recentOrders.map((order) => (
                <tr key={order.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="px-6 py-4 font-medium text-indigo-900">#{order.orderCode}</td>
                  <td className="px-6 py-4 text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 font-bold">{order.grandTotal.toLocaleString()} ₫</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.orderStatus)}`}>
                      {order.orderStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SellerDashboard;