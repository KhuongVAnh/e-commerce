import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link, useLocation } from 'react-router-dom';
import axiosClient from '../../utils/axiosClient';
import useCartStore from '../../store/useCartStore';

const Checkout = () => {
  const [searchParams] = useSearchParams();
  const shopIdParam = searchParams.get('shopId');
  const navigate = useNavigate();
  const location = useLocation();
  const { fetchCartTotal } = useCartStore();

  const isBuyNowFlow = location.state?.isBuyNow || false;
  const buyNowItems = location.state?.items || [];
  const [previewData, setPreviewData] = useState(null);
  const [cartItemIds, setCartItemIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // State cho Form
  const [formData, setFormData] = useState({
    fullName: '', phone: '', street: '', district: '', city: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('COD'); 

  // XỬ LÝ LẤY DỮ LIỆU ĐỂ HIỂN THỊ
  useEffect(() => {
    const loadCheckoutData = async () => {
      try {
        setLoading(true);

        // LUỒNG 1: XỬ LÝ "MUA NGAY" TRỰC TIẾP TỪ TRANG SẢN PHẨM
        if (isBuyNowFlow && buyNowItems.length > 0) {
          const item = buyNowItems[0];
          const subtotal = Number(item.price) * Number(item.quantity);

          setPreviewData({
            shopName: "Đơn hàng Mua ngay",
            shopId: item.shopId,
            items: [{
              productId: item.productId,
              productName: item.name,
              thumbnailUrl: item.thumbnailUrl,
              unitPrice: item.price,
              quantity: item.quantity,
              subtotal: subtotal
            }],
            pricing: {
              subtotal: subtotal,
              shippingFee: 0,
              grandTotal: subtotal
            }
          });
          setLoading(false);
          return;
        }

        // LUỒNG 2: XỬ LÝ TỪ GIỎ HÀNG (Dựa vào shopIdParam)
        if (!shopIdParam) {
          alert("Không tìm thấy thông tin cần thanh toán!");
          navigate('/cart');
          return;
        }

        const shopId = Number(shopIdParam);

        const cartRes = await axiosClient.get('/commerce/cart');
        const cartData = cartRes.data || cartRes; 
        
        if (!cartData || !cartData.shops) throw new Error("Giỏ hàng trống");

        const shopData = cartData.shops.find(s => Number(s.shopId) === shopId);
        if (!shopData || shopData.items.length === 0) {
          throw new Error("Không có sản phẩm nào của Shop này trong giỏ hàng");
        }

        const itemIds = shopData.items.map(item => item.id);
        setCartItemIds(itemIds);

        const previewRes = await axiosClient.post('/commerce/cart/checkout-preview', {
          shopId: shopId,
          cartItemIds: itemIds
        });
        
        if (previewRes.data && previewRes.data.data) {
            setPreviewData(previewRes.data.data);
        } else if (previewRes.data) {
            setPreviewData(previewRes.data);
        } else {
            setPreviewData(previewRes);
        }

      } catch (error) {
        console.error("Lỗi lấy dữ liệu checkout:", error);
        alert(error.response?.data?.message || error.message || "Không thể tải thông tin đơn hàng. Vui lòng thử lại!");
        navigate('/cart');
      } finally {
        setLoading(false);
      }
    };

    loadCheckoutData();
  }, [shopIdParam, navigate, isBuyNowFlow]);

  // HÀM XỬ LÝ ĐẶT HÀNG CHUNG CHO CẢ 2 LUỒNG
  const handlePlaceOrder = async () => {
    if (!formData.fullName || !formData.phone || !formData.street || !formData.district || !formData.city) {
      alert("Vui lòng điền đầy đủ địa chỉ giao hàng!");
      return;
    }

    const receiverAddress = `${formData.street}, ${formData.district}, ${formData.city}`;

    try {
      setSubmitting(true);

      const payload = {
        paymentMethod: paymentMethod,
        receiverName: formData.fullName,
        receiverPhone: formData.phone,
        receiverAddress: receiverAddress,
        note: ""
      };

      if (isBuyNowFlow) {
        payload.shopId = Number(previewData.shopId);
        payload.isBuyNow = true;
        payload.items = previewData.items.map(i => ({ 
           productId: i.productId, 
           quantity: i.quantity 
        }));
      } else {
        payload.shopId = Number(shopIdParam);
        payload.cartItemIds = cartItemIds;
      }

      const orderRes = await axiosClient.post('/commerce/orders/checkout', payload);
      
      const responseData = orderRes.data || orderRes;
      const orderData = responseData.data || responseData;

      if (!isBuyNowFlow) fetchCartTotal();

      if (paymentMethod === 'VNPAY') {
        const vnpayUrl = orderData.paymentUrl;
        const orderCode = orderData.orderCode;

        sessionStorage.setItem('currentOrderCode', orderCode);

        if (vnpayUrl) {
          window.location.href = vnpayUrl;
        } else {
          alert("Lỗi: Backend không trả về link VNPay. Đơn hàng đã được lưu dưới dạng Chờ thanh toán.");
          navigate('/orders');
        }
      } else {
        alert("Đặt hàng thành công!");
        navigate('/orders');
      }

    } catch (error) {
      console.error("Chi tiết lỗi đặt hàng:", error);
      alert(error.response?.data?.message || "Có lỗi xảy ra khi tạo đơn!");
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
    <main className="pt-8 pb-24 px-6 md:px-12 max-w-screen-2xl mx-auto">
      {/* BREADCRUMBS */}
      <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-gray-500 text-sm mb-8 uppercase tracking-widest font-bold">
        <Link to="/" className="hover:text-[#2b3896] transition-colors">Trang chủ</Link>
        <span className="material-symbols-outlined text-sm">chevron_right</span>
        <Link to="/cart" className="hover:text-[#2b3896] transition-colors">Giỏ hàng</Link>
        <span className="material-symbols-outlined text-sm">chevron_right</span>
        <span className="text-[#2b3896]">Thanh toán</span>
      </nav>

      <header className="mb-12">
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-[#2b3896] mb-2 font-headline">Thanh Toán</h1>
        <p className="text-gray-500 font-medium">Hoàn tất các bước cuối cùng để sở hữu những sản phẩm thủ công tuyệt vời.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ĐỊA CHỈ GIAO HÀNG */}
        <section className="lg:col-span-4 space-y-6 bg-gray-50 p-8 rounded-2xl border border-gray-100">
          <div className="flex items-center space-x-3 mb-2">
            <span className="material-symbols-outlined text-[#2b3896]">local_shipping</span>
            <h2 className="text-xl font-extrabold tracking-tight text-gray-900">Địa Chỉ Nhận Hàng</h2>
          </div>
          
          <div className="space-y-5">
            <div className="group">
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 ml-1">Họ và Tên</label>
              <input name="fullName" value={formData.fullName} onChange={handleInputChange} className="w-full bg-white border border-gray-200 focus:border-[#2b3896] focus:ring-2 focus:ring-[#2b3896]/20 rounded-xl p-4 transition-all outline-none font-medium" placeholder="VD: Nguyễn Văn A" type="text" />
            </div>
            <div className="group">
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 ml-1">Số Điện Thoại</label>
              <input name="phone" value={formData.phone} onChange={handleInputChange} className="w-full bg-white border border-gray-200 focus:border-[#2b3896] focus:ring-2 focus:ring-[#2b3896]/20 rounded-xl p-4 transition-all outline-none font-medium" placeholder="VD: 0912 345 678" type="tel" />
            </div>
            <div className="group">
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 ml-1">Số nhà / Tên đường</label>
              <input name="street" value={formData.street} onChange={handleInputChange} className="w-full bg-white border border-gray-200 focus:border-[#2b3896] focus:ring-2 focus:ring-[#2b3896]/20 rounded-xl p-4 transition-all outline-none font-medium" placeholder="VD: 1 Đại Cồ Việt" type="text" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="group">
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 ml-1">Quận / Huyện</label>
                <input name="district" value={formData.district} onChange={handleInputChange} className="w-full bg-white border border-gray-200 focus:border-[#2b3896] focus:ring-2 focus:ring-[#2b3896]/20 rounded-xl p-4 transition-all outline-none font-medium" placeholder="Quận Hai Bà Trưng" type="text" />
              </div>
              <div className="group">
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 ml-1">Tỉnh / Thành Phố</label>
                <input name="city" value={formData.city} onChange={handleInputChange} className="w-full bg-white border border-gray-200 focus:border-[#2b3896] focus:ring-2 focus:ring-[#2b3896]/20 rounded-xl p-4 transition-all outline-none font-medium" placeholder="Hà Nội" type="text" />
              </div>
            </div>
          </div>
        </section>

        {/* TÓM TẮT ĐƠN HÀNG */}
        <section className="lg:col-span-4 space-y-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              <span className="material-symbols-outlined text-[#2b3896]">inventory_2</span>
              <h2 className="text-xl font-extrabold tracking-tight text-gray-900">Tóm Tắt Đơn Hàng</h2>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-[0_8px_30px_rgba(43,56,150,0.04)] border border-gray-100">
            <div className="mb-6 pb-4 border-b border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Giao hàng từ Shop</p>
              <h3 className="font-black text-lg text-[#2b3896]">{previewData.shopName || `Shop #${previewData.shopId || shopIdParam}`}</h3> 
            </div>
            
            <div className="space-y-6">
              {previewData.items.map((item, index) => (
                <div key={index} className="flex gap-4 items-center">
                  <div className="w-20 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 border border-gray-50">
                    <img src={item.thumbnailUrl || 'https://via.placeholder.com/150'} alt={item.productName} className="w-full h-full object-cover" />
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
                <span className="material-symbols-outlined">payments</span>
                <h2 className="text-xl font-extrabold tracking-tight">Thanh Toán</h2>
              </div>
              
              {/* Chọn phương thức thanh toán */}
              <div className="space-y-4 mb-10">
                <label className={`flex items-center p-4 rounded-xl border cursor-pointer transition-colors ${paymentMethod === 'COD' ? 'bg-white/10 border-white' : 'border-white/20 hover:bg-white/5'}`}>
                  <input type="radio" name="payment" value="COD" checked={paymentMethod === 'COD'} onChange={(e) => setPaymentMethod(e.target.value)} className="w-5 h-5 text-indigo-600 focus:ring-indigo-500 border-gray-300" />
                  <div className="ml-4">
                    <span className="block font-bold">Thanh toán khi nhận hàng (COD)</span>
                    <span className="text-xs text-white/70 font-medium">Thanh toán bằng tiền mặt khi shipper giao tới.</span>
                  </div>
                </label>
                
                <label className={`flex items-center p-4 rounded-xl border cursor-pointer transition-colors ${paymentMethod === 'VNPAY' ? 'bg-white/10 border-white' : 'border-white/20 hover:bg-white/5'}`}>
                  <input type="radio" name="payment" value="VNPAY" checked={paymentMethod === 'VNPAY'} onChange={(e) => setPaymentMethod(e.target.value)} className="w-5 h-5 text-indigo-600 focus:ring-indigo-500 border-gray-300" />
                  <div className="ml-4">
                    <span className="block font-bold">Thanh toán Online (VNPay)</span>
                    <span className="text-xs text-white/70 font-medium">Bảo mật, nhanh chóng qua cổng VNPay.</span>
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
          
          <div className="p-6 bg-gray-50 border border-gray-100 rounded-2xl flex items-start space-x-4">
            <span className="material-symbols-outlined text-[#2b3896] mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
            <div className="text-xs font-medium text-gray-500 leading-relaxed">
              <strong>Bảo mật thông tin:</strong> Mọi thông tin đơn hàng và thanh toán của bạn đều được mã hóa và bảo vệ an toàn.
            </div>
          </div>
        </section>

      </div>
    </main>
  );
};

export default Checkout;