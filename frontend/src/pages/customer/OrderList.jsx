import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { orderService } from '../../services/orderService';

const formatPrice = (price) => new Intl.NumberFormat('vi-VN').format(price);

const OrderCard = ({ order }) => {
  const thumbnailUrl = order.thumbnailUrl || order.items?.find((item) => item.thumbnailUrl)?.thumbnailUrl;
  const itemTotal = order.totalItems ?? order.items?.reduce((sum, item) => sum + Number(item.quantity || 0), 0) ?? 0;
  const shopLabel = order.shopName || `Shop #${order.shopId}`;

  const statusConfig = {
    PENDING: { color: 'bg-orange-100 text-orange-700', label: 'Pending' },
    AWAITING_PAYMENT: { color: 'bg-yellow-100 text-yellow-700', label: 'Awaiting Payment' },
    CONFIRMED: { color: 'bg-cyan-100 text-cyan-700', label: 'Confirmed' },
    PROCESSING: { color: 'bg-blue-100 text-blue-700', label: 'Processing' },
    SHIPPING: { color: 'bg-indigo-100 text-indigo-700', label: 'Shipping' },
    DELIVERED: { color: 'bg-green-100 text-green-700', label: 'Completed' },
    CANCELLED: { color: 'bg-red-100 text-red-700', label: 'Cancelled' },
  };

  const config = statusConfig[order.orderStatus] || { 
      color: 'bg-gray-100 text-gray-700', 
      label: order.orderStatus || 'Unknown' 
  };

  return (
    <div className={`bg-white rounded-xl p-6 shadow-[0px_12px_32px_rgba(43,56,150,0.06)] group transition-all hover:-translate-y-1 ${order.orderStatus === 'CANCELLED' ? 'opacity-75' : ''}`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        
        {/* Left Info */}
        <div className="flex items-center gap-6">
          <div className={`w-24 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 ${order.orderStatus === 'CANCELLED' ? 'grayscale' : ''}`}>
            {thumbnailUrl ? (
              <img
                src={thumbnailUrl}
                alt={order.items?.[0]?.productNameSnapshot || 'Order thumbnail'}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="material-symbols-outlined text-4xl text-gray-300">inventory_2</span>
              </div>
            )}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-[#2b3896] text-sm">storefront</span>
              <span className="text-sm font-semibold text-gray-600">{shopLabel}</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">#{order.orderCode}</h3>
            <p className="text-sm text-gray-500">
              {itemTotal} sản phẩm đặt ngày {new Date(order.createdAt).toLocaleDateString('vi-VN')}
            </p>
          </div>
        </div>

        {/* Right Info & Actions */}
        <div className="flex flex-col md:items-end justify-between gap-4">
          <div className="flex flex-col md:items-end">
            <div className="flex items-baseline gap-1 text-[#2b3896]">
              <span className="text-2xl font-bold tracking-tight">{formatPrice(order.totalAmount)}</span>
              <span className="text-sm font-medium opacity-80">₫</span>
            </div>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mt-2 ${config.color}`}>
              {config.label}
            </span>
          </div>
          
          <Link 
            to={`/orders/${order.id}`} // Link sang trang chi tiết
            className="flex items-center justify-center gap-2 bg-gray-100 text-[#2f3f92] px-6 py-2.5 rounded-full font-semibold text-sm hover:bg-[#2b3896] hover:text-white transition-all"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');

  const fetchOrders = async (status) => {
    setLoading(true);
    try {
        const params = status !== 'ALL' ? { status } : {};
        const res = await orderService.getMyOrders(params); 
        
        setOrders(res.data?.orders || []);
    } catch (error) {
        console.error("Lỗi khi tải lịch sử đơn hàng:", error);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(activeTab);
  }, [activeTab]);

  const tabs = [
    { key: 'ALL', label: 'All' },
    { key: 'PENDING', label: 'Pending' },
    { key: 'CONFIRMED', label: 'Confirmed' },
    { key: 'SHIPPING', label: 'Shipping' },
    { key: 'DELIVERED', label: 'Completed' },
    { key: 'CANCELLED', label: 'Cancelled' },
  ];

  return (
    <main className="pt-28 pb-12 px-6 md:px-12 max-w-7xl mx-auto font-['Inter']">
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-[#2b3896] mb-2 font-['Be_Vietnam_Pro']">My Orders</h1>
        <p className="text-gray-600 max-w-md">Theo dõi, quản lý và kiểm tra lịch sử đặt hàng của bạn một cách dễ dàng.</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-8 mb-10 overflow-x-auto whitespace-nowrap pb-2 scrollbar-hide border-b border-gray-200">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`font-medium pb-2 px-1 transition-all ${
              activeTab === tab.key 
                ? 'text-[#2b3896] font-bold border-b-2 border-[#2b3896]' 
                : 'text-gray-500 hover:text-[#2b3896]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Order List */}
      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          <p className="text-center text-gray-500 py-10">Đang tải dữ liệu...</p>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl shadow-sm">
            <p className="text-gray-500">Chưa có đơn hàng nào ở trạng thái này.</p>
          </div>
        ) : (
          orders.map(order => <OrderCard key={order.id} order={order} />)
        )}
      </div>
    </main>
  );
}
