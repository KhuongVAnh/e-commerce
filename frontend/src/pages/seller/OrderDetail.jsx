import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axiosClient from '../../utils/axiosClient';

const SellerOrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [orderData, setOrderData] = useState(null);
  const [paymentData, setPaymentData] = useState(null); // Lưu thông tin Payment (Task 3)
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrderAndPayment = async () => {
      try {
        // Gọi song song 2 API: Lấy chi tiết đơn và Lấy trạng thái thanh toán
        const [orderRes, paymentRes] = await Promise.allSettled([
          axiosClient.get(`/commerce/seller/orders/${id}`),
          axiosClient.get(`/commerce/payments/order/${id}`) // <--- Endpoint Task 3
        ]);

        if (orderRes.status === 'fulfilled') {
          setOrderData(orderRes.value.data);
        }
        
        if (paymentRes.status === 'fulfilled') {
          setPaymentData(paymentRes.value.data.payment);
        }

      } catch (error) {
        console.error("Lỗi fetch data", error);
        // Fallback data để bạn test UI nếu API chưa xong hẳn
        setOrderData({
          id, orderCode: 'ORD-9912', orderStatus: 'PENDING', 
          receiverName: 'Nguyễn Văn A', receiverPhone: '0901234567', receiverAddress: '123 Lê Lợi, Quận 1, TP.HCM',
          createdAt: '2026-05-17T10:00:00Z', subtotal: 1220000, shippingFee: 30000, grandTotal: 1250000,
          items: [
            { productId: 1, productNameSnapshot: 'Hand-Woven Mulberry Silk Scarf', quantity: 1, priceSnapshot: 1220000 }
          ]
        });
        setPaymentData({
          method: 'VNPAY', status: 'PAID', amount: 1250000, transactionRef: 'VNP123456789'
        });
      } finally {
        setLoading(false);
      }
    };
    fetchOrderAndPayment();
  }, [id]);

  // Đổi trạng thái đơn hàng (Task 1)
  const handleUpdateStatus = async (newStatus) => {
    try {
      await axiosClient.patch(`/commerce/seller/orders/${id}/status`, { status: newStatus });
      setOrderData({ ...orderData, orderStatus: newStatus });
      alert(`Đã cập nhật trạng thái đơn hàng thành ${newStatus}`);
    } catch (error) {
      alert("Lỗi khi cập nhật trạng thái!");
    }
  };

  if (loading || !orderData) return <div className="p-10 text-center text-slate-500">Đang tải dữ liệu...</div>;

  return (
    <div className="p-6 md:p-10 font-sans bg-[#f8fafc] min-h-full">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4 mt-8 md:mt-0">
        <div>
          <Link to="/seller/orders" className="text-sm font-bold text-slate-400 hover:text-[#2e3785] flex items-center gap-1 mb-2">
            <span className="material-symbols-outlined text-[16px]">arrow_back</span> Back to Orders
          </Link>
          <h1 className="text-3xl font-black text-[#2e3785] tracking-tight">Order #{orderData.orderCode}</h1>
          <p className="text-slate-500 font-medium text-sm mt-1">Placed on {new Date(orderData.createdAt).toLocaleString()}</p>
        </div>

        {/* Nút Action chuyển trạng thái đơn (Task 1) */}
        <div className="flex gap-2">
          {orderData.orderStatus === 'PENDING' && (
            <button onClick={() => handleUpdateStatus('CONFIRMED')} className="px-6 py-2.5 bg-[#2e3785] text-white text-sm font-bold rounded-xl shadow-md hover:bg-[#252d70]">Chốt đơn (Confirm)</button>
          )}
          {orderData.orderStatus === 'CONFIRMED' && (
            <button onClick={() => handleUpdateStatus('PROCESSING')} className="px-6 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-md hover:bg-blue-700">Đóng gói (Processing)</button>
          )}
          {orderData.orderStatus === 'PROCESSING' && (
            <button onClick={() => handleUpdateStatus('SHIPPING')} className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl shadow-md hover:bg-indigo-700">Giao Vận chuyển (Shipping)</button>
          )}
          {orderData.orderStatus === 'SHIPPING' && (
            <button onClick={() => handleUpdateStatus('DELIVERED')} className="px-6 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl shadow-md hover:bg-emerald-700">Đã giao xong (Delivered)</button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cột trái: Thông tin khách + Sản phẩm */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm">
            <h2 className="text-lg font-black text-slate-900 mb-4">Customer Details</h2>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <h3 className="font-bold text-slate-900">{orderData.receiverName}</h3>
              <p className="text-sm font-medium text-slate-600 mt-1">{orderData.receiverPhone}</p>
              <p className="text-sm font-medium text-slate-500 mt-1">{orderData.receiverAddress}</p>
            </div>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm">
            <h2 className="text-lg font-black text-slate-900 mb-4">Items Ordered</h2>
            <div className="space-y-4">
              {orderData.items?.map((item, idx) => (
                <div key={idx} className="flex gap-4 items-center pt-4 first:pt-0 border-t border-slate-50 first:border-none">
                  <div className="w-16 h-16 bg-slate-100 rounded-xl overflow-hidden shrink-0 border border-slate-200">
                    <img src={`https://picsum.photos/seed/${item.productId}/150`} alt={item.productNameSnapshot} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-slate-900">{item.productNameSnapshot}</h4>
                    <p className="text-xs font-medium text-slate-500">Qty: {item.quantity}</p>
                  </div>
                  <div className="text-right font-black text-slate-900">
                    {(item.priceSnapshot * item.quantity).toLocaleString()} ₫
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Cột phải: Thanh toán (Nhiệm vụ 3) & Tổng tiền */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* TRẠNG THÁI THANH TOÁN - TASK 3 LÀM Ở ĐÂY */}
          <div className="bg-indigo-50 p-6 md:p-8 rounded-3xl border border-indigo-100 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-indigo-700">account_balance_wallet</span>
              <h2 className="text-lg font-black text-indigo-900">Payment Status</h2>
            </div>
            
            {paymentData ? (
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Method</p>
                  <span className="px-3 py-1 bg-white text-indigo-700 font-bold text-xs rounded border border-indigo-200">{paymentData.method}</span>
                </div>
                <div>
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Status</p>
                  {paymentData.status === 'PAID' ? (
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 font-black text-xs uppercase tracking-widest rounded flex items-center gap-1 w-fit">
                      <span className="material-symbols-outlined text-[14px]">check_circle</span> PAID
                    </span>
                  ) : paymentData.status === 'PENDING' ? (
                    <span className="px-3 py-1 bg-orange-100 text-orange-700 font-black text-xs uppercase tracking-widest rounded flex items-center gap-1 w-fit">
                      <span className="material-symbols-outlined text-[14px]">schedule</span> PENDING
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-rose-100 text-rose-700 font-black text-xs uppercase tracking-widest rounded">{paymentData.status}</span>
                  )}
                </div>
                {paymentData.transactionRef && (
                  <div>
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Transaction Ref</p>
                    <p className="text-sm font-bold text-indigo-900 truncate">{paymentData.transactionRef}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm font-medium text-indigo-400">Đang kiểm tra dữ liệu thanh toán...</p>
            )}
          </div>

          {/* Tóm tắt tiền */}
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm">
            <h2 className="text-lg font-black text-slate-900 mb-4">Summary</h2>
            <div className="space-y-3 mb-4 text-sm font-medium text-slate-600 border-b border-slate-100 pb-4">
              <div className="flex justify-between"><span>Subtotal</span><span>{orderData.subtotal?.toLocaleString()} ₫</span></div>
              <div className="flex justify-between"><span>Shipping Fee</span><span>{orderData.shippingFee?.toLocaleString()} ₫</span></div>
            </div>
            <div className="flex justify-between items-end">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Amount</span>
              <span className="text-2xl font-black text-[#2e3785]">{orderData.grandTotal?.toLocaleString()} ₫</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SellerOrderDetail;