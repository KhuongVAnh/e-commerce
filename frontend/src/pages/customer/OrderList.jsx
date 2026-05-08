import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosClient from '../../utils/axiosClient';

const OrderList = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');

  const tabs = ['All', 'Pending', 'Shipping', 'Completed', 'Cancelled'];

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await axiosClient.get('/commerce/orders/my');
        setOrders(res.data || []);
      } catch (error) {
        setOrders([
          { id: 101, orderCode: 'ORD-4921', shopName: 'Hanoi Heritage Silks', grandTotal: 2450000, orderStatus: 'COMPLETED', createdAt: '2024-10-12T10:00:00Z', itemsCount: 3 },
          { id: 102, orderCode: 'ORD-5012', shopName: 'Bat Trang Artisans', grandTotal: 850000, orderStatus: 'SHIPPING', createdAt: '2024-10-14T14:30:00Z', itemsCount: 1 },
          { id: 103, orderCode: 'ORD-5104', shopName: 'Dalat Specialty Coffee', grandTotal: 1200000, orderStatus: 'PENDING', createdAt: '2024-10-15T09:15:00Z', itemsCount: 2 },
          { id: 104, orderCode: 'ORD-4880', shopName: 'Imperial Crafts', grandTotal: 3100000, orderStatus: 'CANCELLED', createdAt: '2024-10-05T16:45:00Z', itemsCount: 1 },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const filteredOrders = orders.filter(order => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Pending') return ['PENDING', 'AWAITING_PAYMENT', 'CONFIRMED', 'PROCESSING'].includes(order.orderStatus);
    if (activeTab === 'Shipping') return order.orderStatus === 'SHIPPING';
    if (activeTab === 'Completed') return order.orderStatus === 'DELIVERED' || order.orderStatus === 'COMPLETED';
    if (activeTab === 'Cancelled') return order.orderStatus === 'CANCELLED';
    return true;
  });

  const getStatusConfig = (status) => {
    if (['DELIVERED', 'COMPLETED'].includes(status)) return { text: 'COMPLETED', bg: 'bg-emerald-100', color: 'text-emerald-700' };
    if (status === 'SHIPPING') return { text: 'SHIPPING', bg: 'bg-blue-100', color: 'text-blue-700' };
    if (status === 'CANCELLED') return { text: 'CANCELLED', bg: 'bg-rose-100', color: 'text-rose-700' };
    return { text: 'PENDING', bg: 'bg-orange-100', color: 'text-orange-700' };
  };

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans pb-24">
      <div className="max-w-5xl mx-auto px-4 md:px-8 pt-10">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-black text-[#2e3785] mb-2">My Orders</h1>
          <p className="text-slate-500 text-sm font-medium">Track, manage, and review your curated acquisitions from across Vietnam's finest artisans.</p>
        </div>

        <div className="flex overflow-x-auto border-b border-slate-200 mb-6 scrollbar-hide">
          {tabs.map(tab => (
            <button
              key={tab} onClick={() => setActiveTab(tab)}
              className={`pb-4 px-4 text-sm font-bold whitespace-nowrap transition-colors relative ${activeTab === tab ? 'text-[#2e3785]' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {tab}
              {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#2e3785] rounded-t-full"></div>}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-10 text-slate-400">Loading your orders...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-100 shadow-sm text-slate-500">No orders found in this category.</div>
          ) : (
            filteredOrders.map(order => {
              const statusCfg = getStatusConfig(order.orderStatus);
              return (
                <div key={order.id} className="bg-white p-4 md:p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6 hover:shadow-md transition">
                  <div className="w-20 h-20 bg-slate-100 rounded-xl overflow-hidden shrink-0 border border-slate-200">
                    <img src={`https://picsum.photos/seed/${order.id}/200`} alt="Thumbnail" className="w-full h-full object-cover" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 mb-1 text-slate-500">
                      <span className="material-symbols-outlined text-[14px]">storefront</span>
                      <span className="text-xs font-bold">{order.shopName}</span>
                    </div>
                    <h3 className="text-lg font-black text-slate-900 mb-1">#{order.orderCode}</h3>
                    <p className="text-[12px] font-medium text-slate-500">{order.itemsCount || 1} item(s) ordered on {formatDate(order.createdAt)}</p>
                  </div>

                  <div className="w-full md:w-auto flex flex-row md:flex-col items-center md:items-end justify-between mt-4 md:mt-0 pt-4 md:pt-0 border-t border-slate-100 md:border-none">
                    <div className="text-left md:text-right mb-0 md:mb-3 flex flex-col items-start md:items-end">
                      <span className="text-lg font-black text-[#2e3785]">{order.grandTotal?.toLocaleString()} ₫</span>
                      <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-md mt-1 ${statusCfg.bg} ${statusCfg.color}`}>{statusCfg.text}</span>
                    </div>
                    <button onClick={() => navigate(`/orders/${order.id}`)} className={`w-full md:w-auto px-6 py-2.5 rounded-xl text-sm font-bold transition ${statusCfg.text === 'SHIPPING' ? 'bg-[#2e3785] text-white hover:bg-[#252d70] shadow-md' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
                      {statusCfg.text === 'SHIPPING' ? 'Track Package' : 'View Details'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderList;