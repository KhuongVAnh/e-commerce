import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axiosClient from '../../utils/axiosClient';

const SellerDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalRevenue: 0, totalOrders: 0, pendingOrders: 0,
    revenueSeries: [], recentOrders: []
  });
  const [totalProducts, setTotalProducts] = useState(0);
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  useEffect(() => {
    const getDashboardData = async () => {
      setLoading(true);
      try {
        let myShopId = null;
        try {
          const shopRes = await axiosClient.get('/catalog/shops/my-shop');
          myShopId = shopRes?.data?.shop?.id || shopRes?.shop?.id;
        } catch (e) {
          console.log("Seller chưa tạo gian hàng");
        }

        const queryParams = new URLSearchParams();
        if (dateRange.from) queryParams.append('from', new Date(dateRange.from).toISOString());
        if (dateRange.to) queryParams.append('to', new Date(dateRange.to).toISOString());

        const promises = [axiosClient.get(`/commerce/seller/revenue-summary?${queryParams.toString()}`)];
        if (myShopId) promises.push(axiosClient.get(`/catalog/shops/${myShopId}`));
        const results = await Promise.allSettled(promises);
        const summaryRes = results[0];
        const productsRes = results.length > 1 ? results[1] : null;

        if (summaryRes.status === 'fulfilled') {
          const data = summaryRes.value?.data || summaryRes.value || {};
          let recentOrdersList = data.recentOrders || [];
          if (!recentOrdersList.length) {
             const fallbackOrders = await axiosClient.get('/commerce/seller/orders?limit=5').catch(() => ({ data: { orders: [] } }));
             recentOrdersList = fallbackOrders?.data?.orders || fallbackOrders?.orders || fallbackOrders?.data || [];
          }
          setSummary({
            totalRevenue: data.totalRevenue || 0,
            totalOrders: data.totalOrders || 0,
            pendingOrders: data.pendingOrders || data.pendingCount || 0,
            revenueSeries: Array.isArray(data.revenueSeries) ? data.revenueSeries : (Array.isArray(data.chartData) ? data.chartData : []),
            recentOrders: Array.isArray(recentOrdersList) ? recentOrdersList : []
          });
        }

        if (productsRes && productsRes.status === 'fulfilled') {
          setTotalProducts(productsRes.value?.stats?.productCount || 0);
        } else {
          setTotalProducts(0);
        }
        }
      } catch (err) {
        console.error("Lỗi lấy dữ liệu dashboard seller:", err);
      } finally { setLoading(false); }
    };
    getDashboardData();
  }, [dateRange]);

  const handleDateChange = (e) => setDateRange({ ...dateRange, [e.target.name]: e.target.value });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'DELIVERED': return <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase">Completed</span>;
      case 'SHIPPING': return <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase">In Transit</span>;
      case 'PROCESSING': 
      case 'CONFIRMED': return <span className="px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-[10px] font-black uppercase">Processing</span>;
      case 'PENDING': return <span className="px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-[10px] font-black uppercase">Pending</span>;
      case 'CANCELLED': return <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-black uppercase">Cancelled</span>;
      default: return <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-black uppercase">{status}</span>;
    }
  };

  return (
    <div className="p-4 md:p-8 lg:p-10 space-y-8 bg-[#f8fafc] min-h-screen">
      <header className="flex flex-col lg:flex-row justify-between lg:items-end gap-4 mt-8 md:mt-0">
        <div><h1 className="text-2xl md:text-3xl font-black text-[#2e3785] tracking-tight">Dashboard</h1></div>
        <div className="flex gap-2 items-center bg-white p-2 rounded-xl border border-slate-200 shadow-sm h-fit">
          <span className="material-symbols-outlined text-slate-400 pl-2 text-[18px]">calendar_today</span>
          <input type="date" name="from" value={dateRange.from} onChange={handleDateChange} className="px-2 py-1.5 text-xs font-bold text-slate-600 outline-none bg-transparent cursor-pointer" />
          <span className="text-slate-300">-</span>
          <input type="date" name="to" value={dateRange.to} onChange={handleDateChange} className="px-2 py-1.5 text-xs font-bold text-slate-600 outline-none bg-transparent cursor-pointer" />
        </div>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white p-6 rounded-2xl md:rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Orders</h3>
          <div className="flex items-end gap-2"><span className="text-3xl md:text-4xl font-black text-[#2e3785]">{loading ? '...' : summary.totalOrders.toLocaleString()}</span></div>
        </div>
        <div className="bg-white p-6 rounded-2xl md:rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Revenue</h3>
          <div className="flex items-end gap-1">
            <span className="text-3xl md:text-4xl font-black text-[#2e3785]">{loading ? '...' : summary.totalRevenue.toLocaleString()}</span>
            <span className="text-sm md:text-base font-bold text-slate-500 mb-1">₫</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl md:rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Products</h3>
          <div className="flex items-end gap-2">
            <span className="text-3xl md:text-4xl font-black text-slate-900">{loading ? '...' : totalProducts}</span>
            <span className="text-[10px] font-bold text-slate-400 mb-1.5">Active</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl md:rounded-3xl shadow-sm border-l-4 border-rose-500 flex flex-col justify-center">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Pending Orders</h3>
          <div className="flex items-end gap-2">
            <span className="text-3xl md:text-4xl font-black text-rose-600">{loading ? '...' : summary.pendingOrders.toLocaleString()}</span>
            <span className="text-[10px] font-bold text-rose-500 mb-1.5">Action Required</span>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100">
        <div className="mb-8"><h2 className="text-lg font-black text-[#2e3785]">Sales Performance</h2></div>
        <div className="h-[250px] md:h-[300px] w-full">
          {loading ? (
            <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold">Đang phân tích dữ liệu...</div>
          ) : summary.revenueSeries && summary.revenueSeries.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={summary.revenueSeries}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2e3785" stopOpacity={0.2}/><stop offset="95%" stopColor="#2e3785" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}} dy={10} />
                <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)'}} formatter={(value) => [`${value.toLocaleString()} ₫`, 'Revenue']} />
                <Area type="monotone" dataKey="revenue" stroke="#2e3785" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
             <div className="w-full h-full flex flex-col items-center justify-center text-slate-400"><span className="material-symbols-outlined text-4xl mb-2 opacity-50">analytics</span><span className="text-sm font-bold">Chưa có giao dịch</span></div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden w-full">
        <div className="p-6 md:p-8 border-b border-slate-50 flex justify-between items-center"><h2 className="text-lg font-black text-[#2e3785]">Recent Orders</h2></div>
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap min-w-[700px]">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Order ID</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Date</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Customer Name</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Amount</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? <tr><td colSpan="5" className="p-10 text-center text-slate-400 font-bold">Đang tải...</td></tr> : summary.recentOrders.length === 0 ? <tr><td colSpan="5" className="p-10 text-center text-slate-400">Chưa có đơn hàng nào</td></tr> : summary.recentOrders.map(o => (
                <tr key={o.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-5 font-bold text-[#2e3785] text-sm">#{o.orderCode}</td>
                  <td className="px-6 py-5 text-sm font-medium text-slate-600">{o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}</td>
                  <td className="px-6 py-5 text-sm font-medium text-slate-800">{o.receiverName || 'Khách hàng'}</td>
                  <td className="px-6 py-5 font-black text-slate-900">{(o.totalAmount || o.grandTotal || 0).toLocaleString()} <span className="text-xs text-slate-400 font-bold">₫</span></td>
                  <td className="px-6 py-5">{getStatusBadge(o.orderStatus)}</td>
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