import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, Link, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import axiosClient from '../../utils/axiosClient';
import useCartStore from '../../store/useCartStore';

const Checkout = () => {
  const [searchParams] = useSearchParams();
  const shopIdParam = searchParams.get('shopId');
  const navigate = useNavigate();
  const location = useLocation();
  const { fetchCartTotal } = useCartStore();
  const checkoutIdempotencyKeyRef = useRef(null);
  const submittingRef = useRef(false);

  const [previewData, setPreviewData] = useState(null);
  const [cartItemIds, setCartItemIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // === STATE CHO ĐỊA CHỈ & MODAL ===
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [hasSavedAddress, setHasSavedAddress] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '', phone: '', street: '', ward: '', city: ''
  });
  
  const [paymentMethod, setPaymentMethod] = useState('COD'); 

  // XỬ LÝ LẤY DỮ LIỆU ĐỂ HIỂN THỊ
  useEffect(() => {
    const loadCheckoutData = async () => {
      try {
        setLoading(true);

        if (!shopIdParam) {
          toast.error("Không tìm thấy thông tin cần thanh toán!");
          navigate('/cart');
          return;
        }

        const shopId = Number(shopIdParam);
        const cartRes = await axiosClient.get('/commerce/cart');
        const cartData = cartRes.data;
        
        if (!cartData || !cartData.shops) throw new Error("Giỏ hàng trống");

        const shopData = cartData.shops.find(s => Number(s.shopId) === shopId);
        if (!shopData || shopData.items.length === 0) {
          throw new Error("Không có sản phẩm nào của Shop này trong giỏ hàng");
        }

        const selectedItemIdsFromCart = location.state?.cartItemIds || [];
        const itemIds = selectedItemIdsFromCart.length > 0 
          ? selectedItemIdsFromCart 
          : shopData.items.map(item => item.id);
          
        setCartItemIds(itemIds);

        const previewRes = await axiosClient.post('/commerce/cart/checkout-preview', {
          shopId: shopId,
          cartItemIds: itemIds
        });
        
        setPreviewData(previewRes.data);

      } catch (error) {
        console.error("Lỗi lấy dữ liệu checkout:", error);
        toast.error(error.message || "Không thể tải thông tin đơn hàng. Vui lòng thử lại!");
        navigate('/cart');
      } finally {
        setLoading(false);
      }
    };

    loadCheckoutData();
  }, [shopIdParam, navigate, location.state]);

  // HÀM LƯU ĐỊA CHỈ TỪ POPUP
  const handleSaveAddress = (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.phone || !formData.street || !formData.ward || !formData.city) {
      toast.error("Vui lòng điền đầy đủ địa chỉ giao hàng!");
      return;
    }
    setHasSavedAddress(true);
    setShowAddressModal(false);
    toast.success("Đã cập nhật thông tin giao hàng!");
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // HÀM XỬ LÝ ĐẶT HÀNG
  const handlePlaceOrder = async () => {
    if (submittingRef.current) return;

    if (!hasSavedAddress) {
      toast.error("Vui lòng cập nhật địa chỉ giao hàng trước khi đặt hàng!");
      return;
    }

    const receiverAddress = `${formData.street}, ${formData.ward}, ${formData.city}`;

    try {
      submittingRef.current = true;
      setSubmitting(true);

      if (!checkoutIdempotencyKeyRef.current) {
        checkoutIdempotencyKeyRef.current = crypto.randomUUID();
      }

      const payload = {
        paymentMethod: paymentMethod,
        receiverName: formData.fullName,
        receiverPhone: formData.phone,
        receiverAddress: receiverAddress,
        note: "",
        shopId: Number(shopIdParam),
        cartItemIds: cartItemIds
      };

      const orderRes = await axiosClient.post('/commerce/orders/checkout', payload, {
        headers: {
          'Idempotency-Key': checkoutIdempotencyKeyRef.current,
        },
      });
      
      const orderData = orderRes.data;
      checkoutIdempotencyKeyRef.current = null;

      fetchCartTotal();

      if (paymentMethod === 'VNPAY') {
        const vnpayUrl = orderData.paymentUrl;
        const orderCode = orderData.orderCode;

        sessionStorage.setItem('currentOrderCode', orderCode);

        if (vnpayUrl) {
          window.location.href = vnpayUrl;
        } else {
          toast.error("Lỗi: Backend không trả về link VNPay. Đơn hàng đã được lưu dưới dạng Chờ thanh toán.");
          navigate('/orders');
        }
      } else {
        toast.success("Đặt hàng thành công!");
        navigate('/orders');
      }

    } catch (error) {
      console.error("Chi tiết lỗi đặt hàng:", error);
      toast.error(error.message || "Có lỗi xảy ra khi tạo đơn!");
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="pt-32 pb-24 text-center min-h-screen">
        <span className="material-symbols-outlined animate-spin text-5xl text-[#2b3896]">progress_activity</span>
        <p className="mt-4 text-gray-500 font-medium">Đang chuẩn bị đơn hàng...</p>
      </div>
    );
  }

  if (!previewData) return null;

  return (
    <main className="pt-8 pb-24 px-6 md:px-12 max-w-screen-2xl mx-auto font-['Inter'] relative">
      
      {/* BREADCRUMBS */}
      <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-gray-500 text-sm mb-8 uppercase tracking-widest font-bold">
        <Link to="/" className="hover:text-[#2b3896] transition-colors">Trang chủ</Link>
        <span className="material-symbols-outlined text-sm">chevron_right</span>
        <Link to="/cart" className="hover:text-[#2b3896] transition-colors">Giỏ hàng</Link>
        <span className="material-symbols-outlined text-sm">chevron_right</span>
        <span className="text-[#2b3896]">Thanh toán</span>
      </nav>

      <header className="mb-12">
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-[#2b3896] mb-2 font-['Be_Vietnam_Pro']">Thanh Toán</h1>
        <p className="text-gray-500 font-medium">Hoàn tất các bước cuối cùng để sở hữu những sản phẩm tuyệt vời của bạn.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ĐỊA CHỈ GIAO HÀNG (Hiển thị dạng Static) */}
        <section className="lg:col-span-4 space-y-6 bg-gray-50 p-8 rounded-3xl border border-gray-100">
          <div className="flex items-center space-x-3 mb-4">
            <span className="material-symbols-outlined text-[#2b3896] text-[28px]">local_shipping</span>
            <h2 className="text-xl font-extrabold tracking-tight text-gray-900">Địa Chỉ Nhận Hàng</h2>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col items-start">
            {hasSavedAddress ? (
              <div className="space-y-2 mb-4 w-full">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-gray-400 text-[20px]">person</span>
                  <p className="font-bold text-gray-900 text-base">{formData.fullName} - {formData.phone}</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-gray-400 text-[20px] mt-0.5">location_on</span>
                  <p className="text-gray-600 text-sm leading-relaxed">{formData.street}, {formData.ward}, {formData.city}</p>
                </div>
              </div>
            ) : (
              <div className="py-4 w-full text-center">
                <span className="material-symbols-outlined text-gray-300 text-4xl mb-2">location_off</span>
                <p className="text-gray-500 text-sm italic">Bạn chưa cập nhật thông tin giao hàng.</p>
              </div>
            )}

            <button
              onClick={() => setShowAddressModal(true)}
              className="mt-2 inline-flex items-center gap-2 text-sm font-bold text-[#2b3896] hover:text-[#4551af] transition-colors w-full justify-center py-2.5 rounded-xl border border-[#2b3896]/20 hover:bg-[#2b3896]/5"
            >
              <span className="material-symbols-outlined text-[18px]">{hasSavedAddress ? 'edit' : 'add_circle'}</span>
              {hasSavedAddress ? 'Thay đổi địa chỉ' : 'Thêm địa chỉ giao hàng'}
            </button>
          </div>
        </section>

        {/* TÓM TẮT ĐƠN HÀNG */}
        <section className="lg:col-span-4 space-y-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              <span className="material-symbols-outlined text-[#2b3896] text-[28px]">inventory_2</span>
              <h2 className="text-xl font-extrabold tracking-tight text-gray-900">Tóm Tắt Đơn Hàng</h2>
            </div>
          </div>
          
          <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgba(43,56,150,0.04)] border border-gray-100">
            <div className="mb-6 pb-4 border-b border-gray-100 flex items-center gap-3">
              <span className="material-symbols-outlined text-gray-400">storefront</span>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Giao hàng từ Shop</p>
                <h3 className="font-black text-base text-[#2b3896]">{previewData.shopName || `Shop #${previewData.shopId || shopIdParam}`}</h3> 
              </div>
            </div>
            
            <div className="space-y-6">
              {previewData.items.map((item, index) => (
                <div key={index} className="flex gap-4 items-center">
                  <div className="w-20 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 border border-gray-50">
                    {item.thumbnailUrl ? (
                      <img src={item.thumbnailUrl} alt={item.productName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-3xl text-gray-300">inventory_2</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-grow">
                    <h4 className="font-bold text-sm text-gray-900 leading-tight mb-1 line-clamp-2">{item.productName}</h4>
                    <p className="text-xs font-medium text-gray-500 mb-3">Đơn giá: {Number(item.unitPrice).toLocaleString('vi-VN')}₫</p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-md">SL: {item.quantity}</span>
                      <span className="font-extrabold text-sm text-[#2b3896]">{Number(item.subtotal).toLocaleString('vi-VN')} <span className="text-[10px] align-top opacity-70">₫</span></span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PHƯƠNG THỨC THANH TOÁN */}
        <section className="lg:col-span-4 space-y-6">
          <div className="bg-gradient-to-br from-[#2b3896] to-[#4551af] text-white rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center space-x-3 mb-8">
                <span className="material-symbols-outlined text-[28px]">payments</span>
                <h2 className="text-xl font-extrabold tracking-tight">Thanh Toán</h2>
              </div>
              
              {/* Chọn phương thức thanh toán */}
              <div className="space-y-4 mb-10">
                <label className={`flex items-center p-4 rounded-2xl border cursor-pointer transition-colors ${paymentMethod === 'COD' ? 'bg-white/10 border-white' : 'border-white/20 hover:bg-white/5'}`}>
                  <input type="radio" name="payment" value="COD" checked={paymentMethod === 'COD'} onChange={(e) => setPaymentMethod(e.target.value)} className="w-5 h-5 text-indigo-600 focus:ring-indigo-500 border-gray-300" />
                  <div className="ml-4">
                    <span className="block font-bold">Khi nhận hàng (COD)</span>
                    <span className="text-xs text-white/70 font-medium">Thanh toán bằng tiền mặt khi giao tới.</span>
                  </div>
                </label>
                
                <label className={`flex items-center p-4 rounded-2xl border cursor-pointer transition-colors ${paymentMethod === 'VNPAY' ? 'bg-white/10 border-white' : 'border-white/20 hover:bg-white/5'}`}>
                  <input type="radio" name="payment" value="VNPAY" checked={paymentMethod === 'VNPAY'} onChange={(e) => setPaymentMethod(e.target.value)} className="w-5 h-5 text-indigo-600 focus:ring-indigo-500 border-gray-300" />
                  <div className="ml-4">
                    <span className="block font-bold">Thanh toán Online (VNPay)</span>
                    <span className="text-xs text-white/70 font-medium">Bảo mật, nhanh qua cổng VNPay.</span>
                  </div>
                </label>
              </div>
              
              {/* Tiền bạc */}
              <div className="space-y-3 mb-8 border-t border-white/20 pt-8 font-medium">
                <div className="flex justify-between text-sm opacity-90">
                  <span>Tạm tính</span>
                  <span>{Number(previewData.pricing.subtotal).toLocaleString('vi-VN')} ₫</span>
                </div>
                <div className="flex justify-between text-sm opacity-90">
                  <span>Phí vận chuyển</span>
                  <span className="text-green-300 font-bold">{previewData.pricing.shippingFee === 0 ? 'Miễn phí' : `${Number(previewData.pricing.shippingFee).toLocaleString('vi-VN')} ₫`}</span>
                </div>
              </div>
              
              <div className="flex justify-between items-end mb-10">
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">Tổng Thanh Toán</span>
                <span className="text-4xl font-black tracking-tighter">{Number(previewData.pricing.grandTotal).toLocaleString('vi-VN')} <span className="text-sm align-top">₫</span></span>
              </div>
              
              {/* Nút đặt hàng */}
              <button 
                onClick={handlePlaceOrder}
                disabled={submitting}
                className="w-full bg-white text-[#2b3896] font-extrabold py-5 rounded-full shadow-lg hover:bg-gray-50 active:scale-95 transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <span>{submitting ? 'Đang xử lý...' : (paymentMethod === 'VNPAY' ? 'Thanh Toán Qua VNPay' : 'Hoàn Tất Đặt Hàng')}</span>
                {!submitting && <span className="material-symbols-outlined text-xl">arrow_forward</span>}
              </button>
            </div>
          </div>
        </section>

      </div>

      {/* POPUP (MODAL) ĐIỀN ĐỊA CHỈ */}
      {showAddressModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#2b3896]">edit_location_alt</span>
                <h3 className="text-lg font-extrabold text-gray-900">Thông tin giao hàng</h3>
              </div>
              <button onClick={() => setShowAddressModal(false)} className="text-gray-400 hover:text-red-500 transition-colors bg-white rounded-full p-1 border border-gray-200">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSaveAddress} className="p-6 space-y-5">
              <div className="group">
                <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-2 ml-1">Họ và Tên</label>
                <input name="fullName" value={formData.fullName} onChange={handleInputChange} required className="w-full bg-gray-50 border border-gray-200 focus:border-[#2b3896] focus:ring-2 focus:ring-[#2b3896]/20 rounded-xl p-3.5 transition-all outline-none font-medium text-sm" placeholder="VD: Nguyễn Văn A" type="text" />
              </div>
              <div className="group">
                <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-2 ml-1">Số Điện Thoại</label>
                <input name="phone" value={formData.phone} onChange={handleInputChange} required className="w-full bg-gray-50 border border-gray-200 focus:border-[#2b3896] focus:ring-2 focus:ring-[#2b3896]/20 rounded-xl p-3.5 transition-all outline-none font-medium text-sm" placeholder="VD: 0912 345 678" type="tel" />
              </div>
              <div className="group">
                <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-2 ml-1">Số nhà / Tên đường</label>
                <input name="street" value={formData.street} onChange={handleInputChange} required className="w-full bg-gray-50 border border-gray-200 focus:border-[#2b3896] focus:ring-2 focus:ring-[#2b3896]/20 rounded-xl p-3.5 transition-all outline-none font-medium text-sm" placeholder="VD: Số 1 Đại Cồ Việt" type="text" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="group">
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-2 ml-1">Phường / Xã</label>
                  <input name="ward" value={formData.ward} onChange={handleInputChange} required className="w-full bg-gray-50 border border-gray-200 focus:border-[#2b3896] focus:ring-2 focus:ring-[#2b3896]/20 rounded-xl p-3.5 transition-all outline-none font-medium text-sm" placeholder="VD: Kim Liên" type="text" />
                </div>
                <div className="group">
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-2 ml-1">Tỉnh / Thành Phố</label>
                  <input name="city" value={formData.city} onChange={handleInputChange} required className="w-full bg-gray-50 border border-gray-200 focus:border-[#2b3896] focus:ring-2 focus:ring-[#2b3896]/20 rounded-xl p-3.5 transition-all outline-none font-medium text-sm" placeholder="VD: Hà Nội" type="text" />
                </div>
              </div>
              
              {/* Modal Footer / Buttons */}
              <div className="pt-4 mt-6 border-t border-gray-100 flex gap-3">
                <button type="button" onClick={() => setShowAddressModal(false)} className="flex-1 py-3.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors">
                  Hủy
                </button>
                <button type="submit" className="flex-1 py-3.5 bg-[#2b3896] text-white font-bold rounded-xl hover:bg-[#1f2970] transition-colors shadow-md shadow-[#2b3896]/20">
                  Lưu địa chỉ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </main>
  );
};

export default Checkout;