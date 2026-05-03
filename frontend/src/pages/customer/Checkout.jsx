import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import axiosClient from '../../utils/axiosClient';

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Lấy shopId từ Giỏ hàng truyền sang
  const shopId = location.state?.shopId; 

  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  
  // Để trống để bắt user phải nhập
  const [shippingInfo, setShippingInfo] = useState({
    fullName: '', phone: '', address: '', district: '', city: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('VNPAY');

  // FIX LỖI 1: Chống F5 trắng trang hoặc vào thẳng link checkout
  useEffect(() => {
    if (!shopId) {
      alert("Vui lòng chọn sản phẩm từ giỏ hàng để thanh toán!");
      navigate('/cart'); 
    }
  }, [shopId, navigate]);

  // Gọi API lấy dữ liệu preview cho ĐÚNG 1 SHOP
  useEffect(() => {
    if (!shopId) return;
    const fetchPreview = async () => {
      try {
        const res = await axiosClient.post('/commerce/cart/checkout-preview', { shopId });
        if (res.data) setPreviewData(res.data);
      } catch (error) {
        console.error("Lỗi lấy dữ liệu preview:", error);
        // Fallback data ảo để test UI
        setPreviewData({
          shopName: "Hanoi Heritage Silks",
          items: [
            { cartItemId: 1, productName: "Hand-Woven Mulberry Silk Scarf", variant: "Emerald Green • 180x70cm", unitPrice: 2450000, quantity: 1 },
            { cartItemId: 2, productName: "Imperial Lotus Lacquerware Tray", variant: "Deep Vermillion • Artisan Grade", unitPrice: 2805000, quantity: 1 }
          ],
          pricing: { subtotal: 5255000, shippingFee: 0, grandTotal: 5255000 }
        });
      }
    };
    fetchPreview();
  }, [shopId]);

  const handlePlaceOrder = async (e) => {
    e.preventDefault(); // Ngăn form reload lại trang
    setLoading(true);
    try {
      const payload = { shopId, paymentMethod, shippingAddress: shippingInfo };
      const res = await axiosClient.post('/commerce/orders/checkout', payload);
      
      if (res.data?.nextAction?.type === 'REDIRECT_PAYMENT') {
        window.location.href = res.data.nextAction.url;
      } else {
        navigate('/orders'); // Hoặc trang success tùy ý bạn
      }
    } catch (error) {
      alert(error.response?.data?.message || "Có lỗi xảy ra khi tạo đơn!");
    } finally {
      setLoading(false);
    }
  };

  if (!previewData) return <div className="p-20 text-center text-slate-500">Đang tải dữ liệu...</div>;

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-24 font-sans">
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-8">
        
        <nav className="flex text-sm font-medium text-slate-500 mb-8 gap-2">
          <Link to="/" className="hover:text-[#2e3785] transition">Home</Link>
          <span>›</span>
          <Link to="/cart" className="hover:text-[#2e3785] transition">Shopping Cart</Link>
          <span>›</span>
          <span className="text-[#2e3785] font-bold">Checkout</span>
        </nav>

        <div className="mb-10">
          <h1 className="text-4xl md:text-5xl font-black text-[#2e3785] mb-3">Checkout</h1>
          <p className="text-slate-500 text-sm md:text-base font-medium">Secure your artisanal selection from Vietnam's finest heritage makers.</p>
        </div>

        {/* BỌC TOÀN BỘ BẰNG THẺ FORM ĐỂ VALIDATE REQUIRED */}
        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* COLUMN 1: Shipping Address */}
          <div className="lg:col-span-4 bg-slate-100/70 p-6 md:p-8 rounded-2xl border border-slate-200/50">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-[#2e3785]">local_shipping</span>
              <h2 className="text-lg font-black text-slate-900">Shipping Address</h2>
            </div>
            
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">Full Name</label>
                <input required type="text" value={shippingInfo.fullName} onChange={e => setShippingInfo({...shippingInfo, fullName: e.target.value})} className="w-full bg-white border-none p-3.5 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#2e3785] outline-none shadow-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">Phone Number</label>
                <input required type="text" value={shippingInfo.phone} onChange={e => setShippingInfo({...shippingInfo, phone: e.target.value})} className="w-full bg-white border-none p-3.5 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#2e3785] outline-none shadow-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">Street Address</label>
                <input required type="text" value={shippingInfo.address} onChange={e => setShippingInfo({...shippingInfo, address: e.target.value})} className="w-full bg-white border-none p-3.5 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#2e3785] outline-none shadow-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">District</label>
                  <input required type="text" value={shippingInfo.district} onChange={e => setShippingInfo({...shippingInfo, district: e.target.value})} className="w-full bg-white border-none p-3.5 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#2e3785] outline-none shadow-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">City</label>
                  <input required type="text" value={shippingInfo.city} onChange={e => setShippingInfo({...shippingInfo, city: e.target.value})} className="w-full bg-white border-none p-3.5 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#2e3785] outline-none shadow-sm" />
                </div>
              </div>
            </div>
          </div>

          {/* COLUMN 2: Order Summary */}
          <div className="lg:col-span-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#2e3785]">receipt_long</span>
                <h2 className="text-lg font-black text-slate-900">Order Summary</h2>
              </div>
              <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-[10px] font-black uppercase tracking-widest rounded-full">1 Merchant</span>
            </div>

            <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-100 shadow-sm">
              <p className="text-[10px] font-black text-[#a16207] uppercase tracking-widest mb-1">Shipping From</p>
              <h3 className="text-lg font-black text-slate-900 mb-6">{previewData.shopName || "Hanoi Heritage Silks"}</h3>

              <div className="space-y-6">
                {previewData.items.map((item, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="w-16 h-16 bg-slate-100 rounded-xl overflow-hidden shrink-0">
                      <img src={item.thumbnailUrl || `https://picsum.photos/seed/${item.cartItemId}/200`} alt={item.productName} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug mb-1">{item.productName}</h4>
                      <p className="text-[11px] font-medium text-slate-500 mb-2">{item.variant || 'Standard'}</p>
                      <div className="flex justify-between items-center text-sm font-black">
                        <span className="text-slate-500">Qty: {item.quantity}</span>
                        <span className="text-slate-900">{item.unitPrice.toLocaleString()} ₫</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* COLUMN 3: Payment Method & Totals */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-[#2e3785] p-6 md:p-8 rounded-2xl shadow-xl text-white">
              <div className="flex items-center gap-3 mb-6 text-indigo-100">
                <span className="material-symbols-outlined">payments</span>
                <h2 className="text-lg font-black">Payment Method</h2>
              </div>

              <div className="space-y-4 mb-8">
                <label className={`block border ${paymentMethod === 'COD' ? 'border-white bg-white/10' : 'border-indigo-400/30'} rounded-xl p-4 cursor-pointer transition`}>
                  <div className="flex items-center gap-3">
                    <input type="radio" name="payment" value="COD" checked={paymentMethod === 'COD'} onChange={() => setPaymentMethod('COD')} className="w-4 h-4 accent-white" />
                    <div>
                      <p className="text-sm font-bold text-white">COD (Cash on Delivery)</p>
                      <p className="text-[11px] font-medium text-indigo-200 mt-1">Pay when your treasures arrive.</p>
                    </div>
                  </div>
                </label>

                <label className={`block border ${paymentMethod === 'VNPAY' ? 'border-white bg-white/10' : 'border-indigo-400/30'} rounded-xl p-4 cursor-pointer transition`}>
                  <div className="flex items-center gap-3">
                    <input type="radio" name="payment" value="VNPAY" checked={paymentMethod === 'VNPAY'} onChange={() => setPaymentMethod('VNPAY')} className="w-4 h-4 accent-white" />
                    <div>
                      <p className="text-sm font-bold text-white">VNPay Online Payment</p>
                      <p className="text-[11px] font-medium text-indigo-200 mt-1">Fast, secure local gateway.</p>
                    </div>
                  </div>
                </label>
              </div>

              <div className="space-y-3 mb-6 text-sm font-medium text-indigo-100 border-t border-indigo-400/30 pt-6">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{previewData.pricing.subtotal.toLocaleString()} ₫</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping (Express)</span>
                  <span>{previewData.pricing.shippingFee === 0 ? 'Free' : `${previewData.pricing.shippingFee.toLocaleString()} ₫`}</span>
                </div>
              </div>

              <div className="flex justify-between items-end mb-8">
                <span className="text-xs font-black uppercase tracking-widest text-indigo-200">Final Total</span>
                <span className="text-3xl font-black">{previewData.pricing.grandTotal.toLocaleString()} <span className="text-xl">₫</span></span>
              </div>

              {/* Nút Submit cho Form */}
              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-white text-[#2e3785] py-4 rounded-xl font-black shadow-lg hover:bg-slate-50 transition flex justify-center items-center gap-2 disabled:opacity-80"
              >
                {loading ? 'Processing...' : 'Place Order'} 
                {!loading && <span className="material-symbols-outlined text-[18px]">arrow_forward</span>}
              </button>
            </div>

            <div className="bg-slate-200/50 p-5 rounded-2xl flex items-start gap-4 border border-slate-200">
              <span className="material-symbols-outlined text-[#2e3785] bg-white rounded-full p-1 text-[16px] shadow-sm">verified</span>
              <p className="text-[11px] font-medium text-slate-600 leading-relaxed">
                <strong className="text-slate-900 block mb-0.5">The Elevated Guarantee:</strong> 
                Each piece is verified by our curation team for authenticity and heritage quality before shipping.
              </p>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};

export default Checkout;