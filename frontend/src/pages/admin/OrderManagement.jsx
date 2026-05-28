import React, { useState, useEffect } from 'react';
import axiosClient from '../../utils/axiosClient';

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState('All Orders');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setErrorMsg('');
      try {
        const queryParams = new URLSearchParams({ limit: 50 });
        if (activeTab === 'Pending') queryParams.append('status', 'PENDING');
        if (activeTab === 'Paid') queryParams.append('paymentStatus', 'PAID');
        if (activeTab === 'Shipped') queryParams.append('status', 'SHIPPING');
        if (activeTab === 'Refunded') queryParams.append('status', 'CANCELLED');
        
        if (dateRange.from) queryParams.append('from', new Date(dateRange.from).toISOString());
        if (dateRange.to) queryParams.append('to', new Date(dateRange.to).toISOString());

        const res = await axiosClient.get(`/commerce/admin/orders?${queryParams.toString()}`);
        const data = res?.data?.orders || res?.orders || res?.data || [];
        setOrders(Array.isArray(data) ? data : []);
      } catch (error) {
        setOrders([]);
        setErrorMsg(error.message || "Không thể tải danh sách đơn hàng.");
      } finally { setLoading(false); }
    };
    fetchOrders();
  }, [activeTab, dateRange]);

  const handleDateChange = (e) => {
    setDateRange({ ...dateRange, [e.target.name]: e.target.value });
  };

  return (
    <div className="p-4 md:p-6 lg:p-10 font-sans bg-[#f8fafc] min-h-full flex flex-col">
      <header className="mb-6 md:mb-8 flex flex-col lg:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-[#2e3785] tracking-tight mb-2">Global Order Transactions</h1>
        </div>
        <div className="flex gap-2 items-center bg-white p-2 rounded-xl border border-slate-200 shadow-sm h-fit">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-2">Lọc Date:</span>
          <input type="date" name="from" value={dateRange.from} onChange={handleDateChange} className="px-3 py-1.5 text-sm font-bold text-slate-600 rounded-lg outline-none bg-slate-50" />
          <span className="text-slate-300">-</span>
          <input type="date" name="to" value={dateRange.to} onChange={handleDateChange} className="px-3 py-1.5 text-sm font-bold text-slate-600 rounded-lg outline-none bg-slate-50" />
        </div>
      </header>

      <div className="flex overflow-x-auto border-b border-slate-200 mb-6 md:mb-8 gap-8">
        {['All Orders', 'Pending', 'Paid', 'Shipped', 'Refunded'].map((tab, i) => (
          <button key={i} onClick={() => setActiveTab(tab)} className={`pb-4 text-sm font-bold whitespace-nowrap transition-colors relative ${activeTab === tab ? 'text-[#2e3785]' : 'text-slate-500 hover:text-slate-700'}`}>
            {tab}
            {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#2e3785] rounded-t-full"></div>}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden mb-6 flex flex-col flex-1">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Order ID</th>
                <th className="px-6 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Customer</th>
                <th className="px-6 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Shop Source</th>
                <th className="px-6 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Method</th>
                <th className="px-6 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Date</th>
                <th className="px-6 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Total Amount</th>
                <th className="px-6 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? <tr><td colSpan="7" className="text-center py-10 text-slate-400">Loading...</td></tr> : errorMsg ? <tr><td colSpan="7" className="text-center py-10 text-rose-500">{errorMsg}</td></tr> : orders.length === 0 ? <tr><td colSpan="7" className="text-center py-10 text-slate-400">Không có đơn hàng nào</td></tr> : orders.map((o, idx) => (
                <tr key={o.id || idx} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4 font-bold text-[#2e3785] text-sm">#{o.orderCode}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-500 font-bold text-xs flex items-center justify-center shrink-0">
                        {o.receiverName?.charAt(0) || 'U'}
                      </div>
                      <span className="font-bold text-slate-900 text-sm">{o.receiverName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4"><span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-black">Shop #{o.shopId}</span></td>
                  <td className="px-6 py-4 font-bold text-slate-600 text-xs">{o.paymentMethod}</td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-500">{o.createdAt ? new Date(o.createdAt).toLocaleDateString() : 'N/A'}</td>
                  <td className="px-6 py-4 font-black text-[#2e3785] text-sm">{(o.totalAmount || 0).toLocaleString()} ₫</td>
                  <td className="px-6 py-4"><span className="px-3 py-1 bg-slate-100 text-slate-600 font-black text-[10px] uppercase rounded-md">{o.orderStatus}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default OrderManagement;