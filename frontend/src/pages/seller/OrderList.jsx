import React, { useState, useEffect } from 'react';
import axiosClient from '../../utils/axiosClient';
import { useNavigate } from 'react-router-dom';

const SellerOrderList = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');

  const tabs = [
    { key: 'ALL', label: 'All Orders' },
    { key: 'PENDING', label: 'Pending' },
    { key: 'CONFIRMED', label: 'Confirmed' },
    { key: 'SHIPPING', label: 'Shipping' },
    { key: 'DELIVERED', label: 'Completed' },
    { key: 'CANCELLED', label: 'Cancelled' }
  ];

  useEffect(() => {
    fetchOrders();
  }, [activeTab]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const query = activeTab !== 'ALL' ? `?status=${activeTab}` : '';
      const res = await axiosClient.get(`/commerce/seller/orders${query}`);
      setOrders(res.data || []);
    } catch (error) {
      // Mock data nếu API chưa có data thực tế
      setOrders([
        { id: '1', orderCode: 'ORD-9912', receiverName: 'Nguyễn Văn A', totalAmount: 1250000, orderStatus: 'PENDING', paymentMethod: 'VNPAY', createdAt: '2026-05-17T10:00:00Z' },
        { id: '2', orderCode: 'ORD-9913', receiverName: 'Trần Thị B', totalAmount: 450000, orderStatus: 'CONFIRMED', paymentMethod: 'COD', createdAt: '2026-05-16T14:30:00Z' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await axiosClient.patch(`/commerce/seller/orders/${orderId}/status`, { status: newStatus });
      setOrders(orders.map(o => o.id === orderId ? { ...o, orderStatus: newStatus } : o));
      alert(`Đã cập nhật trạng thái thành ${newStatus}`);
    } catch (error) {
      alert("Lỗi khi cập nhật trạng thái: " + (error.response?.data?.message || "Internal Error"));
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING': return <span className="px-2.5 py-1 bg-orange-50 text-orange-600 rounded-md text-[10px] font-black uppercase">Pending</span>;
      case 'CONFIRMED': return <span className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-md text-[10px] font-black uppercase">Confirmed</span>;
      case 'SHIPPING': return <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-md text-[10px] font-black uppercase">Shipping</span>;
      case 'DELIVERED': return <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-md text-[10px] font-black uppercase">Delivered</span>;
      case 'CANCELLED': return <span className="px-2.5 py-1 bg-rose-50 text-rose-600 rounded-md text-[10px] font-black uppercase">Cancelled</span>;
      default: return <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-[10px] font-black uppercase">{status}</span>;
    }
  };

  return (
    <div className="p-6 md:p-10 font-sans bg-[#f8fafc] min-h-full">
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-black text-[#2e3785] tracking-tight mb-2">Order Management</h1>
        <p className="text-slate-500 font-medium text-sm">Quản lý và xử lý đơn hàng của gian hàng.</p>
      </header>

      <div className="flex overflow-x-auto border-b border-slate-200 mb-6 scrollbar-hide gap-6">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`pb-4 text-sm font-bold whitespace-nowrap transition-colors relative ${activeTab === tab.key ? 'text-[#2e3785]' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {tab.label}
            {activeTab === tab.key && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#2e3785] rounded-t-full"></div>}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden w-full">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Order ID</th>
                <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Customer</th>
                <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Date</th>
                <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Payment</th>
                <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Total</th>
                <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Status</th>
                <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan="7" className="p-10 text-center text-slate-400 font-medium">Loading orders...</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan="7" className="p-10 text-center text-slate-400 font-medium">No orders found.</td></tr>
              ) : orders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => navigate(`/seller/orders/${order.id}`)} 
                      className="font-bold text-[#2e3785] text-sm hover:underline"
                    >
                      #{order.orderCode}
                    </button>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-700 text-sm">{order.receiverName}</td>
                  <td className="px-6 py-4 font-medium text-slate-500 text-sm">{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-bold text-slate-500 px-2 py-1 bg-slate-100 rounded border border-slate-200">{order.paymentMethod}</span>
                  </td>
                  <td className="px-6 py-4 font-black text-slate-900">{order.totalAmount?.toLocaleString()} ₫</td>
                  <td className="px-6 py-4">{getStatusBadge(order.orderStatus)}</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    {order.orderStatus === 'PENDING' && (
                      <button onClick={() => handleUpdateStatus(order.id, 'CONFIRMED')} className="px-3 py-1.5 bg-[#2e3785] text-white text-xs font-bold rounded shadow-sm hover:bg-[#252d70]">Chốt đơn</button>
                    )}
                    {order.orderStatus === 'CONFIRMED' && (
                      <button onClick={() => handleUpdateStatus(order.id, 'PROCESSING')} className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded shadow-sm hover:bg-blue-700">Đóng gói</button>
                    )}
                    {order.orderStatus === 'PROCESSING' && (
                      <button onClick={() => handleUpdateStatus(order.id, 'SHIPPING')} className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded shadow-sm hover:bg-indigo-700">Giao Ship</button>
                    )}
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

export default SellerOrderList;