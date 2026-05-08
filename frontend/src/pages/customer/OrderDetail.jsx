import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axiosClient from '../../utils/axiosClient';

const OrderDetail = () => {
  const { id } = useParams();
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrderDetail = async () => {
      try {
        const res = await axiosClient.get(`/commerce/orders/${id}`);
        setOrderData(res.data);
      } catch (error) {
        setOrderData({
          order: {
            id, orderCode: 'ORD-4921', orderStatus: 'SHIPPING', paymentMethod: 'VNPAY', paymentStatus: 'PAID',
            receiverName: 'Nguyen Minh Tu', receiverPhone: '+84 901 234 567',
            receiverAddress: 'Room 1204, Landmark 81 Tower, 720A Dien Bien Phu Street, Ward 22, Binh Thanh District, Ho Chi Minh City, 70000, Vietnam',
            createdAt: '2024-10-24T10:00:00Z', grandTotal: 2450000, subtotal: 2420000, shippingFee: 30000
          },
          items: [
            { productId: 1, productNameSnapshot: 'Pure Mulberry Silk Scarf', variant: 'Hand-loomed in Van Phuc Village', sku: 'EM-SLK-042', priceSnapshot: 1850000, quantity: 1 },
            { productId: 2, productNameSnapshot: 'Artisan Ceramic Tea Set', variant: 'Celadon Glaze Finish', sku: 'EM-CER-012', priceSnapshot: 570000, quantity: 1 }
          ]
        });
      } finally {
        setLoading(false);
      }
    };
    fetchOrderDetail();
  }, [id]);

  if (loading || !orderData) return <div className="p-20 text-center">Loading order details...</div>;

  const { order, items } = orderData;
  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const statusSteps = ['PENDING', 'CONFIRMED', 'SHIPPING', 'DELIVERED'];
  let currentStepIndex = statusSteps.indexOf(order.orderStatus);
  if (currentStepIndex === -1 && order.orderStatus === 'PROCESSING') currentStepIndex = 1;
  if (order.orderStatus === 'COMPLETED') currentStepIndex = 3;

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans pb-24">
      <div className="max-w-6xl mx-auto px-4 md:px-8 pt-8 md:pt-12">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div>
            <p className="text-xs font-black text-[#2e3785] tracking-widest uppercase mb-2">Order Receipt</p>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-2">#{order.orderCode}</h1>
            <p className="text-slate-500 font-medium text-sm">Placed on {formatDate(order.createdAt)}</p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-5 py-2.5 bg-slate-200/50 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition">
              <span className="material-symbols-outlined text-[18px]">download</span> Download Invoice
            </button>
            <button className="px-5 py-2.5 bg-[#313b8e] hover:bg-[#252d70] text-white font-bold rounded-xl shadow-md text-sm transition">
              Contact Support
            </button>
          </div>
        </div>

        {order.orderStatus !== 'CANCELLED' && (
          <div className="bg-white p-6 md:p-10 rounded-3xl border border-slate-100 shadow-sm mb-8 relative">
            <div className="flex justify-between relative z-10">
              {[ { label: 'Placed', icon: 'check' }, { label: 'Confirmed', icon: 'check' }, { label: 'Shipped', icon: 'local_shipping' }, { label: 'Delivered', icon: 'inventory_2' } ].map((step, idx) => {
                const isCompleted = idx <= currentStepIndex;
                const isCurrent = idx === currentStepIndex;
                return (
                  <div key={idx} className="flex flex-col items-center gap-3 w-1/4">
                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center border-2 z-10 transition-colors ${isCurrent ? 'bg-indigo-50 border-[#2e3785] text-[#2e3785]' : isCompleted ? 'bg-[#2e3785] border-[#2e3785] text-white' : 'bg-slate-100 border-slate-100 text-slate-400'}`}>
                      <span className="material-symbols-outlined text-[20px] md:text-[24px]">{step.icon}</span>
                    </div>
                    <span className={`text-[11px] md:text-sm font-bold ${isCompleted ? 'text-[#2e3785]' : 'text-slate-400'}`}>{step.label}</span>
                  </div>
                );
              })}
            </div>
            <div className="absolute top-11 md:top-16 left-[12%] right-[12%] h-1 bg-slate-100 z-0 rounded-full">
              <div className="h-full bg-[#2e3785] rounded-full transition-all duration-500" style={{ width: `${(currentStepIndex / 3) * 100}%` }}></div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2 mb-6 text-slate-900">
                  <span className="material-symbols-outlined text-[#2e3785]">location_on</span>
                  <h3 className="text-base font-black">Shipping Address</h3>
                </div>
                <h4 className="font-bold text-slate-900 mb-2">{order.receiverName}</h4>
                <p className="text-sm font-medium text-slate-600 mb-2">{order.receiverPhone}</p>
                <p className="text-sm font-medium text-slate-500 leading-relaxed">{order.receiverAddress}</p>
              </div>

              <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2 mb-6 text-slate-900">
                  <span className="material-symbols-outlined text-[#2e3785]">payments</span>
                  <h3 className="text-base font-black">Payment Information</h3>
                </div>
                <div className="mb-6">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Method</p>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-700 font-bold text-xs rounded border border-indigo-100 italic">VNPay</span>
                    <span className="text-sm font-medium text-slate-700">Digital Wallet Transfer</span>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Status</p>
                  <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-md ${order.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>• {order.paymentStatus}</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm">
              <h3 className="text-lg font-black text-slate-900 mb-6">Order Items</h3>
              <div className="space-y-6">
                {items.map((item, idx) => (
                  <div key={idx} className="flex gap-4 md:gap-6 pt-6 first:pt-0 border-t border-slate-50 first:border-none">
                    <div className="w-20 h-20 md:w-24 md:h-24 bg-slate-100 rounded-xl overflow-hidden shrink-0 border border-slate-200">
                      <img src={`https://picsum.photos/seed/${item.productId}/200`} alt={item.productNameSnapshot} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                      <h4 className="text-sm md:text-base font-bold text-[#2e3785] mb-1 line-clamp-1">{item.productNameSnapshot}</h4>
                      <p className="text-xs font-medium text-slate-500 mb-2">{item.variant || 'Standard Edition'}</p>
                      <div className="flex items-center gap-2 mb-2"><span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded">SKU: {item.sku || `PRD-${item.productId}`}</span></div>
                    </div>
                    <div className="text-right flex flex-col justify-center gap-1">
                      <p className="text-xs font-bold text-slate-500">Qty: {item.quantity}</p>
                      <p className="text-base md:text-lg font-black text-slate-900">{(item.priceSnapshot * item.quantity).toLocaleString()} ₫</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm">
              <h3 className="text-lg font-black text-slate-900 mb-6">Order Summary</h3>
              <div className="space-y-4 mb-6 text-sm font-medium text-slate-600 border-b border-slate-100 pb-6">
                <div className="flex justify-between"><span>Subtotal</span><span className="font-bold text-slate-900">{order.subtotal?.toLocaleString() || order.grandTotal?.toLocaleString()} ₫</span></div>
                <div className="flex justify-between"><span>Shipping Fee</span><span className="font-bold text-slate-900">{order.shippingFee?.toLocaleString() || 0} ₫</span></div>
                <div className="flex justify-between text-rose-500"><span>Promotion Applied</span><span className="font-bold">- 0 ₫</span></div>
              </div>
              <div className="flex justify-between items-end mb-6">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Amount</p>
                  <span className="text-3xl font-black text-[#2e3785]">{order.grandTotal.toLocaleString()} <span className="text-xl">₫</span></span>
                </div>
                <span className="material-symbols-outlined text-emerald-500 text-[28px]">verified</span>
              </div>
              {order.orderStatus === 'SHIPPING' && (
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-start gap-3 mb-6">
                  <span className="material-symbols-outlined text-[#2e3785] text-[18px]">info</span>
                  <p className="text-[11px] font-medium text-slate-600 leading-relaxed">Items are currently being handled by <strong className="text-slate-900">Viettel Post</strong>. Expected delivery by October 28.</p>
                </div>
              )}
              <button className="w-full py-3.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-sm transition">View Tracking History</button>
            </div>
            <div className="bg-[#313b8e] p-6 md:p-8 rounded-3xl shadow-xl text-white">
              <h3 className="text-lg font-black mb-3">Need assistance?</h3>
              <p className="text-xs text-indigo-200 font-medium leading-relaxed mb-6">Our curation team is available 24/7 to help you with your order status or product care instructions.</p>
              <button className="text-sm font-bold flex items-center gap-2 hover:opacity-80 transition">Visit Help Center <span className="material-symbols-outlined text-[16px]">arrow_forward</span></button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default OrderDetail;