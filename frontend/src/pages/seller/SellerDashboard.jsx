import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axiosClient from '../../utils/axiosClient';
import useAuthStore from '../../store/useAuthStore';

const SellerDashboard = () => {
  const { user } = useAuthStore();
  const [recentOrders, setRecentOrders] = useState([]);
  const [summary, setSummary] = useState({
    totalRevenue: 0, totalOrders: 0, pending: 0, processing: 0, delivered: 0, cancelled: 0, chartData: []
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  useEffect(() => { fetchDashboardData(); }, [dateRange]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (dateRange.from) query.append('from', new Date(dateRange.from).toISOString());
      if (dateRange.to) query.append('to', new Date(dateRange.to).toISOString());

      const [summaryRes, ordersRes] = await Promise.allSettled([
        axiosClient.get(`/commerce/seller/revenue-summary?${query.toString()}`),
        axiosClient.get('/commerce/seller/orders?limit=5')
      ]);

      if (summaryRes.status === 'fulfilled' && (summaryRes.value?.data || summaryRes.value)) {
        const data = summaryRes.value.data || summaryRes.value;
        setSummary({
          totalRevenue: data.totalRevenue || 0,
          totalOrders: data.totalOrders || 0,
          pending: data.pendingCount || 0,
          processing: data.processingCount || 0,
          delivered: data.deliveredCount || 0,
          cancelled: data.cancelledCount || 0,
          chartData: data.chartData || []
        });
      }

      if (ordersRes.status === 'fulfilled' && (ordersRes.value?.data || ordersRes.value)) {
        setRecentOrders(ordersRes.value.data || ordersRes.value || []);
      }
    } catch (err) {
      console.error("Lỗi lấy dữ liệu Dashboard Seller", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (e) => { setDateRange({ ...dateRange, [e.target.name]: e.target.value }); };

  return (
    <div className="p-4 md:p-8 space-y-6 bg-[#f8fafc] min-h-screen">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mt-8 md:mt-0 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Dashboard</h1>
          <p className="text-sm text-slate-400 font-bold uppercase tracking-tighter">Chào mừng, {user?.fullName || 'Seller'}</p>
        </div>
        <div className="flex gap-2 items-center bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-2">Lọc:</span>
          <input type="date" name="from" value={dateRange.from} onChange={handleDateChange} className="px-3 py-1.5 text-sm font-bold text-slate-600 rounded-lg outline-none bg-slate-50 cursor-pointer" />
          <span className="text-slate-300">-</span>
          <input type="date" name="to" value={dateRange.to} onChange={handleDateChange} className="px-3 py-1.5 text-sm font-bold text-slate-600 rounded-lg outline-none bg-slate-50 cursor-pointer" />
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Orders', val: summary.totalOrders, color: 'text-indigo-600' },
          { label: 'Revenue', val: `${summary.totalRevenue.toLocaleString()} ₫`, color: 'text-slate-800' },
          { label: 'Pending', val: summary.pending, color: 'text-orange-600', border: 'border-l-4 border-orange-400' },
          { label: 'Delivered', val: summary.delivered, color: 'text-emerald-600', border: 'border-l-4 border-emerald-500' },
        ].map((kpi, i) => (
          <div key={i} className={`bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-slate-100 ${kpi.border || ''}`}>
            <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{kpi.label}</p>
            <h3 className={`text-xl md:text-2xl font-black ${kpi.color} truncate`}>{kpi.val}</h3>
          </div>
        ))}
      </div>

      <div className="bg-white p-4 md:p-6 rounded-3xl shadow-sm border border-slate-100">
        <h2 className="text-sm font-black text-slate-800 mb-6 uppercase tracking-widest">Revenue Chart</h2>
        <div className="h-[200px] md:h-[250px] w-full">
          {summary.chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={summary.chartData}>
                <defs>
                  <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/><stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                <Tooltip contentStyle={{borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                <Area type="monotone" dataKey="total" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorVal)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
             <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
               <span className="material-symbols-outlined text-4xl mb-2 opacity-50">analytics</span>
               <span className="text-sm font-bold">Chưa có dữ liệu giao dịch</span>
             </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden w-full">
        <div className="p-4 md:p-6 border-b border-slate-50 flex justify-between items-center">
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Recent Orders</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase">
              <tr>
                <th className="px-6 py-4">Order ID</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="text-xs font-bold text-slate-600">
              {loading ? (
                <tr><td colSpan="4" className="p-10 text-center text-slate-400">Đang tải...</td></tr>
              ) : recentOrders.length === 0 ? (
                <tr><td colSpan="4" className="p-10 text-center text-slate-300">Chưa có đơn hàng nào</td></tr>
              ) : recentOrders.map(o => (
                <tr key={o.id} className="border-t border-slate-50 hover:bg-slate-50/50">
                  <td className="px-6 py-4 text-indigo-600">#{o.orderCode}</td>
                  <td className="px-6 py-4">{o.receiverName || 'N/A'}</td>
                  <td className="px-6 py-4 font-black text-slate-900">{o.totalAmount?.toLocaleString()} ₫</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-[9px] uppercase font-black">{o.orderStatus}</span>
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