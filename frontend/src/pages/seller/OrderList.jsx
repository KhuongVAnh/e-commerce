import React, { useState, useEffect, useCallback } from 'react';
import axiosClient from '../../utils/axiosClient';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const SellerOrderList = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');

  const tabs = [
    { key: 'ALL', label: t('Tất cả đơn hàng') },
    { key: 'PENDING', label: t('Chờ xác nhận') },
    { key: 'CONFIRMED', label: t('Đã xác nhận') },
    { key: 'PROCESSING', label: t('Đang lấy hàng') },
    { key: 'SHIPPING', label: t('Đang giao') },
    { key: 'DELIVERED', label: t('Đã giao') },
    { key: 'CANCELLED', label: t('Đã hủy') }
  ];

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const queryParams = new URLSearchParams();
      if (activeTab !== 'ALL') queryParams.append('status', activeTab);

      const res = await axiosClient.get(`/commerce/seller/orders?${queryParams.toString()}`);
      const data = res?.data?.orders || res?.orders || res?.data || [];
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      setErrorMsg(error.response?.data?.message || t("Không thể tải danh sách đơn hàng."));
      setOrders([]);
    } finally { setLoading(false); }
  }, [activeTab, t]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await axiosClient.patch(`/commerce/seller/orders/${orderId}/status`, { status: newStatus });
      alert(`${t('Chuyển trạng thái đơn hàng thành')} ${newStatus} ${t('thành công!')}`);
      fetchOrders();
    } catch (error) {
      if (error.response?.data?.error?.code === 'INVALID_STATUS_TRANSITION') {
        alert(t("LỖI HỆ THỐNG: Chuyển trạng thái đơn hàng không hợp lệ theo quy trình (State Machine)!"));
      } else {
        alert(t("Lỗi khi cập nhật trạng thái: ") + (error.response?.data?.message || t("Lỗi server")));
      }
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING': return <span className="px-2.5 py-1 bg-orange-50 text-orange-600 rounded-md text-[10px] font-black uppercase">{t('Chờ xác nhận')}</span>;
      case 'AWAITING_PAYMENT': return <span className="px-2.5 py-1 bg-orange-100 text-orange-700 rounded-md text-[10px] font-black uppercase">{t('Chờ thanh toán')}</span>;
      case 'CONFIRMED': return <span className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-md text-[10px] font-black uppercase">{t('Đã xác nhận')}</span>;
      case 'PROCESSING': return <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-md text-[10px] font-black uppercase">{t('Đang lấy hàng')}</span>;
      case 'SHIPPING': return <span className="px-2.5 py-1 bg-purple-50 text-purple-600 rounded-md text-[10px] font-black uppercase">{t('Đang giao')}</span>;
      case 'DELIVERED': return <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-md text-[10px] font-black uppercase">{t('Đã giao')}</span>;
      case 'CANCELLED': return <span className="px-2.5 py-1 bg-rose-50 text-rose-600 rounded-md text-[10px] font-black uppercase">{t('Đã hủy')}</span>;
      default: return <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-[10px] font-black uppercase">{t(status)}</span>;
    }
  };

  return (
    <div className="p-6 md:p-10 font-sans bg-[#f8fafc] min-h-full flex flex-col">
      <header className="mb-8 mt-8 md:mt-0">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-[#2e3785] tracking-tight mb-2">{t('Quản lý đơn hàng')}</h1>
        <p className="text-slate-500 font-medium text-xs md:text-sm">{t('Quản lý và xử lý đơn hàng của gian hàng.')}</p>
      </header>

      <div className="flex overflow-x-auto border-b border-slate-200 mb-6 scrollbar-hide gap-6">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`pb-4 text-sm font-bold whitespace-nowrap transition-colors relative ${activeTab === tab.key ? 'text-[#2e3785]' : 'text-slate-500 hover:text-slate-700'}`}>
            {tab.label}
            {activeTab === tab.key && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#2e3785] rounded-t-full"></div>}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden w-full flex-1">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap min-w-[800px]">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">{t('Mã đơn hàng')}</th>
                <th className="px-6 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">{t('Khách hàng')}</th>
                <th className="px-6 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">{t('Ngày đặt')}</th>
                <th className="px-6 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">{t('Thanh toán')}</th>
                <th className="px-6 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">{t('Tổng tiền')}</th>
                <th className="px-6 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">{t('Trạng thái')}</th>
                <th className="px-6 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-right">{t('Thao tác')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan="7" className="p-10 text-center text-slate-400 font-bold">{t('Đang tải danh sách đơn hàng...')}</td></tr>
              ) : errorMsg ? (
                <tr><td colSpan="7" className="p-10 text-center text-rose-500 font-bold">{errorMsg}</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan="7" className="p-10 text-center text-slate-400">{t('Không có đơn hàng nào trong mục này.')}</td></tr>
              ) : orders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4"><button onClick={() => navigate(`/seller/orders/${order.id}`)} className="font-bold text-[#2e3785] text-xs md:text-sm hover:underline">#{order.orderCode}</button></td>
                  <td className="px-6 py-4 font-bold text-slate-900 text-xs md:text-sm">{order.receiverName}</td>
                  <td className="px-6 py-4 font-medium text-slate-500 text-xs md:text-sm">{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}</td>
                  <td className="px-6 py-4"><span className="text-[10px] font-bold text-[#2e3785] px-2 py-1 bg-indigo-50 rounded border border-indigo-100">{order.paymentMethod}</span></td>
                  <td className="px-6 py-4 font-black text-slate-900 text-xs md:text-sm">{(order.totalAmount || 0).toLocaleString()} ₫</td>
                  <td className="px-6 py-4">{getStatusBadge(order.orderStatus)}</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    {order.orderStatus === 'PENDING' && <button onClick={() => handleUpdateStatus(order.id, 'CONFIRMED')} className="px-3 py-1.5 bg-[#2e3785] text-white text-[10px] md:text-xs font-bold rounded shadow-sm hover:bg-[#252d70] transition">{t('Chốt đơn')}</button>}
                    {order.orderStatus === 'CONFIRMED' && <button onClick={() => handleUpdateStatus(order.id, 'PROCESSING')} className="px-3 py-1.5 bg-blue-600 text-white text-[10px] md:text-xs font-bold rounded shadow-sm hover:bg-blue-700 transition">{t('Đóng gói')}</button>}
                    {order.orderStatus === 'PROCESSING' && <button onClick={() => handleUpdateStatus(order.id, 'SHIPPING')} className="px-3 py-1.5 bg-indigo-600 text-white text-[10px] md:text-xs font-bold rounded shadow-sm hover:bg-indigo-700 transition">{t('Giao Ship')}</button>}
                    <button onClick={() => navigate(`/seller/orders/${order.id}`)} className="px-3 py-1.5 bg-slate-100 text-slate-600 hover:text-[#2e3785] text-[10px] md:text-xs font-bold rounded shadow-sm transition">{t('Chi tiết')}</button>
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