import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axiosClient from '../../utils/axiosClient';

const SellerOrderDetail = () => {
  const { id } = useParams();
  const { t } = useTranslation();
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchOrderDetail = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await axiosClient.get(`/commerce/seller/orders/${id}`);
      const data = res?.data || res || {};
      const orderInfo = data.order || data;
      
      if (!orderInfo || !orderInfo.id) throw new Error(t("Dữ liệu đơn hàng trống."));

      setOrderData({
        ...orderInfo,
        items: data.items || orderInfo.items || [],
        payments: data.payments || orderInfo.payments || []
      });
    } catch (error) {
      console.error("Lỗi fetch data", error);
      setErrorMsg(error.response?.data?.message || t("Không thể tải chi tiết đơn hàng."));
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchOrderDetail(); }, [id, t]);

  const handleUpdateStatus = async (newStatus) => {
    if (!window.confirm(`${t('Xác nhận chuyển trạng thái sang')} ${newStatus}?`)) return;
    try {
      await axiosClient.patch(`/commerce/seller/orders/${id}/status`, { status: newStatus });
      alert(`${t('Đã cập nhật trạng thái đơn hàng thành')} ${newStatus}`);
      fetchOrderDetail();
    } catch (error) {
      if (error.response?.data?.error?.code === 'INVALID_STATUS_TRANSITION') {
        alert(t("LỖI HỆ THỐNG: Chuyển trạng thái đơn hàng không hợp lệ theo state machine!"));
      } else {
        alert(t("Lỗi khi cập nhật trạng thái: ") + (error.response?.data?.message || t("Lỗi server")));
      }
    }
  };

  if (loading) return <div className="p-10 text-center font-bold text-slate-500">{t('Đang truy xuất thông tin đơn hàng...')}</div>;
  if (!orderData) return <div className="p-10 text-center font-bold text-rose-500">{errorMsg || t("Không tìm thấy đơn hàng.")}</div>;

  const subtotal = (orderData.items || []).reduce((sum, item) => sum + Number(item.priceSnapshot || item.unitPrice || 0) * Number(item.quantity || 0), 0);
  const shippingFee = Number(orderData.shippingFee || 0);
  const totalAmount = Number(orderData.totalAmount || subtotal + shippingFee);
  
  const paymentInfo = Array.isArray(orderData.payments) && orderData.payments.length > 0 
    ? orderData.payments[0] : (orderData.payment || null);

  return (
    <div className="p-4 md:p-6 lg:p-10 font-sans bg-[#f8fafc] min-h-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4 mt-8 md:mt-0">
        <div>
          <Link to="/seller/orders" className="text-sm font-bold text-slate-400 hover:text-[#2e3785] flex items-center gap-1 mb-2 transition">
            <span className="material-symbols-outlined text-[16px]">arrow_back</span> {t('Quay lại danh sách')}
          </Link>
          <h1 className="text-2xl md:text-3xl font-black text-[#2e3785] tracking-tight">{t('Đơn hàng')} #{orderData.orderCode}</h1>
          <p className="text-slate-500 font-medium text-xs md:text-sm mt-1">{t('Đặt ngày')} {orderData.createdAt ? new Date(orderData.createdAt).toLocaleString() : 'N/A'}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {orderData.orderStatus === 'PENDING' && <button onClick={() => handleUpdateStatus('CONFIRMED')} className="px-5 py-2.5 bg-[#2e3785] text-white text-xs md:text-sm font-bold rounded-xl shadow-md hover:bg-[#252d70] transition">{t('Chốt đơn')}</button>}
          {orderData.orderStatus === 'CONFIRMED' && <button onClick={() => handleUpdateStatus('PROCESSING')} className="px-5 py-2.5 bg-blue-600 text-white text-xs md:text-sm font-bold rounded-xl shadow-md hover:bg-blue-700 transition">{t('Đóng gói')}</button>}
          {orderData.orderStatus === 'PROCESSING' && <button onClick={() => handleUpdateStatus('SHIPPING')} className="px-5 py-2.5 bg-indigo-600 text-white text-xs md:text-sm font-bold rounded-xl shadow-md hover:bg-indigo-700 transition">{t('Giao Ship')}</button>}
          {orderData.orderStatus === 'SHIPPING' && <button onClick={() => handleUpdateStatus('DELIVERED')} className="px-5 py-2.5 bg-emerald-600 text-white text-xs md:text-sm font-bold rounded-xl shadow-md hover:bg-emerald-700 transition">{t('Xác nhận Đã giao')}</button>}
          {['PENDING', 'CONFIRMED'].includes(orderData.orderStatus) && (
             <button onClick={() => handleUpdateStatus('CANCELLED')} className="px-5 py-2.5 bg-rose-50 text-rose-600 text-xs md:text-sm font-bold rounded-xl hover:bg-rose-100 transition">{t('Hủy đơn hàng')}</button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm">
            <h2 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2"><span className="material-symbols-outlined text-[#2e3785]">person</span> {t('Thông tin người mua')}</h2>
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">{orderData.receiverName}</h3>
              <p className="text-sm font-medium text-slate-600 mt-2 flex items-center gap-2"><span className="material-symbols-outlined text-[16px] text-slate-400">call</span> {orderData.receiverPhone}</p>
              <p className="text-sm font-medium text-slate-600 mt-1 flex items-start gap-2"><span className="material-symbols-outlined text-[16px] text-slate-400">location_on</span> <span className="flex-1">{orderData.receiverAddress}</span></p>
              {orderData.note && (
                <p className="text-sm font-medium text-orange-700 mt-3 p-3 bg-orange-50 rounded-xl flex items-start gap-2 border border-orange-100">
                  <span className="material-symbols-outlined text-[16px]">edit_note</span> {orderData.note}
                </p>
              )}
            </div>
          </div>
          
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
            <h2 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2"><span className="material-symbols-outlined text-[#2e3785]">inventory_2</span> {t('Sản phẩm đã đặt')}</h2>
            <div className="space-y-4">
              {(!orderData.items || orderData.items.length === 0) ? (
                 <p className="text-sm text-slate-400">{t('Không có dữ liệu sản phẩm.')}</p>
              ) : (
                orderData.items.map((item, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row gap-4 sm:items-center pt-4 first:pt-0 border-t border-slate-50 first:border-none">
                    <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center shrink-0 border border-slate-200 overflow-hidden">
                      {item.thumbnailUrl ? <img src={item.thumbnailUrl} className="w-full h-full object-cover" /> : <span className="material-symbols-outlined text-slate-400">image</span>}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-slate-900 mb-1">{item.productNameSnapshot || item.productName || t('Sản phẩm')}</h4>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{t('SL:')} {item.quantity}</p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="font-black text-slate-900">{(Number(item.priceSnapshot || item.unitPrice || 0) * Number(item.quantity || 1)).toLocaleString()} ₫</p>
                      <p className="text-[11px] font-medium text-slate-500 mt-0.5">{Number(item.priceSnapshot || item.unitPrice || 0).toLocaleString()} ₫ / {t('sản phẩm')}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <div className="bg-indigo-50/50 p-6 md:p-8 rounded-3xl border border-indigo-50 shadow-sm">
            <div className="flex items-center gap-2 mb-6"><span className="material-symbols-outlined text-indigo-600">account_balance_wallet</span><h2 className="text-lg font-black text-indigo-900">{t('Thanh toán')}</h2></div>
            <div className="space-y-5">
               <div>
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1.5">{t('Phương thức')}</p>
                  <span className="px-3 py-1.5 bg-white text-indigo-700 font-black text-[11px] rounded-lg border border-indigo-100 shadow-sm">{orderData.paymentMethod}</span>
               </div>
               <div>
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1.5">{t('Trạng thái')}</p>
                  {orderData.paymentStatus === 'PAID' || paymentInfo?.status === 'PAID' ? (
                     <span className="px-3 py-1.5 bg-emerald-100 text-emerald-700 font-black text-[11px] uppercase rounded-lg">{t('PAID')}</span>
                  ) : (
                     <span className="px-3 py-1.5 bg-orange-100 text-orange-700 font-black text-[11px] uppercase rounded-lg">{t(orderData.paymentStatus) || t('PENDING')}</span>
                  )}
               </div>
            </div>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm">
            <h2 className="text-lg font-black text-slate-900 mb-6">{t('Tổng kết')}</h2>
            <div className="space-y-4 mb-6 text-sm font-medium text-slate-600 border-b border-slate-100 pb-6">
              <div className="flex justify-between items-center"><span>{t('Tạm tính')}</span><span className="font-bold text-slate-900">{subtotal.toLocaleString()} ₫</span></div>
              <div className="flex justify-between items-center"><span>{t('Phí vận chuyển')}</span><span className="font-bold text-slate-900">{shippingFee.toLocaleString()} ₫</span></div>
            </div>
            <div className="flex justify-between items-end">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('Tổng cộng')}</span>
              <span className="text-3xl font-black text-[#2e3785]">{totalAmount.toLocaleString()} <span className="text-lg text-indigo-300">₫</span></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default SellerOrderDetail;