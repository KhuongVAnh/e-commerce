import React, { useState, useEffect } from 'react';
import axiosClient from '../../utils/axiosClient';

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All Orders');

  useEffect(() => {
    fetchOrders();
  }, [activeTab]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      // Gọi API chuẩn: GET /api/commerce/admin/orders
      // Tuỳ biến filter status dựa vào activeTab
      const res = await axiosClient.get(`/commerce/admin/orders?limit=10`);
      setOrders(res.data || []);
    } catch (error) {
      // Mock data chuẩn xác theo Figma
      setOrders([
        { id: '#ORD-98210', customerName: 'Nguyen Van A.', shop: 'Hanoi Heritage Silks', method: 'VNPay', date: 'Oct 24, 2026', amount: 2450000, status: 'PAID' },
        { id: '#ORD-98209', customerName: 'Le Thi B.', shop: 'Saigon Ceramics', method: 'COD', date: 'Oct 23, 2026', amount: 890000, status: 'PENDING' },
        { id: '#ORD-98208', customerName: 'Tran Duy C.', shop: 'Da Lat Flora', method: 'VNPay', date: 'Oct 22, 2026', amount: 1200000, status: 'CANCELLED' },
        { id: '#ORD-98207', customerName: 'Pham Hoang D.', shop: 'Lacquer Artistry', method: 'VNPay', date: 'Oct 21, 2026', amount: 3100000, status: 'PAID' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-10 font-sans bg-[#f8fafc] min-h-full flex flex-col">
      <header className="mb-6 md:mb-8 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-[#2e3785] tracking-tight mb-2">Global Order Transactions</h1>
          <p className="text-slate-500 font-medium text-xs md:text-sm">Monitoring marketplace liquidity and fulfillment status.</p>
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide w-full lg:w-auto">
          <button className="px-3 md:px-4 py-2 bg-white border border-slate-200 text-slate-600 text-xs md:text-sm font-bold rounded-lg shadow-sm whitespace-nowrap">Today</button>
          <button className="px-3 md:px-4 py-2 bg-white border border-slate-200 text-slate-600 text-xs md:text-sm font-bold rounded-lg shadow-sm whitespace-nowrap">Monthly</button>
          <button className="px-3 md:px-4 py-2 bg-indigo-50 border border-indigo-100 text-[#2e3785] text-xs md:text-sm font-bold rounded-lg flex items-center gap-1.5 md:gap-2 whitespace-nowrap">
            <span className="material-symbols-outlined text-[14px] md:text-[16px]">calendar_month</span> Oct 1, 2026 - Oct 31, 2026
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-slate-200 mb-6 md:mb-8 scrollbar-hide gap-6 md:gap-8">
        {['All Orders', 'Pending', 'Paid', 'Shipped', 'Refunded'].map((tab, i) => (
          <button 
            key={i} 
            onClick={() => setActiveTab(tab)}
            className={`pb-3 md:pb-4 text-xs md:text-sm font-bold whitespace-nowrap transition-colors relative ${activeTab === tab ? 'text-[#2e3785]' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {tab}
            {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#2e3785] rounded-t-full"></div>}
          </button>
        ))}
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden mb-6 md:mb-8 flex flex-col flex-1">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left whitespace-nowrap min-w-[800px]">
            <thead className="bg-white border-b border-slate-50">
              <tr>
                <th className="px-4 md:px-6 py-4 md:py-5 font-black text-[9px] md:text-[10px] uppercase tracking-widest text-slate-400">Order ID</th>
                <th className="px-4 md:px-6 py-4 md:py-5 font-black text-[9px] md:text-[10px] uppercase tracking-widest text-slate-400">Customer</th>
                <th className="px-4 md:px-6 py-4 md:py-5 font-black text-[9px] md:text-[10px] uppercase tracking-widest text-slate-400">Shop Source</th>
                <th className="px-4 md:px-6 py-4 md:py-5 font-black text-[9px] md:text-[10px] uppercase tracking-widest text-slate-400">Method</th>
                <th className="px-4 md:px-6 py-4 md:py-5 font-black text-[9px] md:text-[10px] uppercase tracking-widest text-slate-400">Date</th>
                <th className="px-4 md:px-6 py-4 md:py-5 font-black text-[9px] md:text-[10px] uppercase tracking-widest text-slate-400">Total Amount</th>
                <th className="px-4 md:px-6 py-4 md:py-5 font-black text-[9px] md:text-[10px] uppercase tracking-widest text-slate-400">Status</th>
                <th className="px-4 md:px-6 py-4 md:py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan="8" className="text-center py-10 text-slate-400">Loading orders...</td></tr>
              ) : orders.map((o, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 md:px-6 py-4 font-bold text-[#2e3785] text-xs md:text-sm">{o.id}</td>
                  <td className="px-4 md:px-6 py-4">
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-slate-200 overflow-hidden text-slate-500 font-bold text-[10px] md:text-xs flex items-center justify-center shrink-0 border border-slate-100">
                        {idx % 2 === 0 ? <img src={`https://i.pravatar.cc/150?u=${idx}`} alt="" className="w-full h-full object-cover" /> : 'TD'}
                      </div>
                      <span className="font-bold text-slate-900 text-xs md:text-sm">{o.customerName}</span>
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-4"><span className="px-2 md:px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[9px] md:text-[10px] font-black">{o.shop}</span></td>
                  <td className="px-4 md:px-6 py-4">
                    <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm font-bold text-[#2e3785]">
                      <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${o.method === 'VNPay' ? 'bg-[#2e3785]' : 'bg-orange-500'}`}></div> {o.method}
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-4 text-xs md:text-sm font-medium text-slate-500">{o.date}</td>
                  <td className="px-4 md:px-6 py-4 font-black text-[#2e3785] text-xs md:text-sm">{o.amount.toLocaleString()} ₫</td>
                  <td className="px-4 md:px-6 py-4">
                    {o.status === 'PAID' && <span className="px-2 md:px-3 py-1 bg-emerald-50 text-emerald-600 font-black text-[9px] md:text-[10px] uppercase rounded-md tracking-wider">PAID</span>}
                    {o.status === 'PENDING' && <span className="px-2 md:px-3 py-1 bg-orange-50 text-orange-600 font-black text-[9px] md:text-[10px] uppercase rounded-md tracking-wider">PENDING</span>}
                    {o.status === 'CANCELLED' && <span className="px-2 md:px-3 py-1 bg-rose-50 text-rose-600 font-black text-[9px] md:text-[10px] uppercase rounded-md tracking-wider">CANCELLED</span>}
                  </td>
                  <td className="px-4 md:px-6 py-4 text-right"><button className="text-slate-400 hover:text-slate-600 transition"><span className="material-symbols-outlined text-[18px] md:text-[20px]">more_vert</span></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-4 md:px-6 border-t border-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white mt-auto">
          <span className="text-[10px] md:text-[11px] font-bold text-slate-400 uppercase tracking-widest">Showing 10 of 1,284 orders</span>
          <div className="flex gap-1">
            <button className="w-7 h-7 md:w-8 md:h-8 rounded-lg border border-slate-200 text-slate-400 flex items-center justify-center"><span className="material-symbols-outlined text-xs md:text-sm">chevron_left</span></button>
            <button className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-[#2e3785] text-white font-bold text-[10px] md:text-xs shadow-sm">1</button>
            <button className="w-7 h-7 md:w-8 md:h-8 rounded-lg border border-slate-200 text-slate-600 font-bold text-[10px] md:text-xs hover:bg-slate-50">2</button>
            <button className="w-7 h-7 md:w-8 md:h-8 rounded-lg border border-slate-200 text-slate-600 font-bold text-[10px] md:text-xs hover:bg-slate-50">3</button>
            <button className="w-7 h-7 md:w-8 md:h-8 rounded-lg border border-slate-200 text-slate-400 flex items-center justify-center"><span className="material-symbols-outlined text-xs md:text-sm">more_horiz</span></button>
            <button className="w-7 h-7 md:w-8 md:h-8 rounded-lg border border-slate-200 text-slate-600 font-bold text-[10px] md:text-xs hover:bg-slate-50">128</button>
            <button className="w-7 h-7 md:w-8 md:h-8 rounded-lg border border-slate-200 text-slate-400 flex items-center justify-center"><span className="material-symbols-outlined text-xs md:text-sm">chevron_right</span></button>
          </div>
        </div>
      </div>

      {/* Bottom Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mt-auto">
        <div className="md:col-span-2 bg-[#2e3785] p-6 md:p-8 rounded-3xl text-white relative overflow-hidden shadow-lg">
          <h3 className="text-indigo-200 font-bold text-[9px] md:text-[10px] uppercase tracking-widest mb-3 md:mb-4">Monthly Liquidity</h3>
          <div className="text-3xl md:text-5xl font-black tracking-tighter mb-2">452.890.000 <span className="text-xl md:text-2xl text-indigo-300">₫</span></div>
          <p className="text-xs md:text-sm text-indigo-100/90 max-w-md leading-relaxed">Total volume processed across all payment gateways this month. Up 12.5% from September.</p>
          <span className="material-symbols-outlined absolute right-[-10px] bottom-[-20px] text-[120px] md:text-[150px] opacity-10 pointer-events-none">payments</span>
        </div>
        <div className="bg-orange-50 p-6 md:p-8 rounded-3xl border border-orange-100 text-orange-900 flex flex-col justify-center">
          <span className="material-symbols-outlined text-orange-600 mb-3 md:mb-4 text-[24px] md:text-[28px]">speed</span>
          <h3 className="font-black text-base md:text-lg mb-2">Fulfillment Velocity</h3>
          <p className="text-[11px] md:text-sm font-medium text-orange-800/80 mb-4 md:mb-6 leading-relaxed">Average time from 'Paid' to 'Shipped' is currently 14.2 hours.</p>
          <div className="w-full bg-orange-200 h-1.5 md:h-2 rounded-full overflow-hidden"><div className="bg-orange-600 h-full w-[65%]"></div></div>
        </div>
      </div>
    </div>
  );
};

export default OrderManagement;