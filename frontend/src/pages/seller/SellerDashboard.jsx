import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axiosClient from '../../utils/axiosClient';
import useAuthStore from '../../store/useAuthStore';

const chartData = [
  { name: 'Mon', total: 1200000 }, { name: 'Tue', total: 2100000 }, { name: 'Wed', total: 800000 },
  { name: 'Thu', total: 4500000 }, { name: 'Fri', total: 3200000 }, { name: 'Sat', total: 5100000 }, { name: 'Sun', total: 3800000 },
];

const SellerDashboard = () => {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState([]);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    const getDashboardData = async () => {
      try {
        const [summaryRes, ordersRes] = await Promise.all([
          axiosClient.get('/commerce/seller/revenue-summary'),
          axiosClient.get('/commerce/seller/orders', { params: { limit: 5 } }),
        ]);
        setSummary(summaryRes.data);
        setOrders(ordersRes.data.orders || []);
      } catch (err) {
        console.error("Lỗi lấy dữ liệu dashboard seller", err);
      }
    };
    getDashboardData();
  }, []);

  const totalRevenue = summary?.totalRevenue || orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const pendingCount = orders.filter(o => o.orderStatus === 'PENDING').length;

  return (
    <div className="p-4 md:p-8 space-y-6 bg-[#f8fafc] min-h-screen">
      <header className="flex justify-between items-center mt-8 md:mt-0">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Dashboard</h1>
          <p className="text-sm text-slate-400 font-bold uppercase tracking-tighter">Chào mừng, {user?.fullName || 'Seller'}</p>
        </div>
      </header>

      {/* Grid đổi thành 2 cột trên điện thoại, 4 cột trên PC */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Orders', val: orders.length, color: 'text-indigo-600' },
          { label: 'Revenue', val: `${totalRevenue.toLocaleString()} ₫`, color: 'text-slate-800' },
          { label: 'Products', val: summary?.productCount || 'N/A', color: 'text-slate-800' },
          { label: 'Pending', val: pendingCount, color: 'text-rose-600', border: 'border-l-4 border-indigo-500' },
        ].map((kpi, i) => (
          <div key={i} className={`bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-slate-100 ${kpi.border || ''}`}>
            <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{kpi.label}</p>
            <h3 className={`text-xl md:text-2xl font-black ${kpi.color} truncate`}>{kpi.val}</h3>
          </div>
        ))}
      </div>

      <div className="bg-white p-4 md:p-6 rounded-3xl shadow-sm border border-slate-100">
        <h2 className="text-sm font-black text-slate-800 mb-6 uppercase tracking-widest">Weekly Sales</h2>
        <div className="h-[200px] md:h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
              <Tooltip contentStyle={{borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
              <Area type="monotone" dataKey="total" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorVal)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Fix bảng: Thêm overflow-x-auto để cuộn ngang trên điện thoại */}
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
              {orders.length === 0 ? (
                <tr><td colSpan="4" className="p-10 text-center text-slate-300">Chưa có đơn hàng nào</td></tr>
              ) : orders.map(o => (
                <tr key={o.id} className="border-t border-slate-50 hover:bg-slate-50/50">
                  <td className="px-6 py-4 text-indigo-600">#{o.orderCode}</td>
                  <td className="px-6 py-4">{o.receiverName || 'N/A'}</td>
                  <td className="px-6 py-4 font-black text-slate-900">{o.totalAmount?.toLocaleString()} ₫</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-md text-[9px] uppercase font-black">{o.orderStatus}</span>
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
