import React, { useState, useEffect } from 'react';
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

  const isBuyNowFlow = location.state?.isBuyNow || false;
  const buyNowItems = location.state?.items || [];
  const [previewData, setPreviewData] = useState(null);
  const [cartItemIds, setCartItemIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '', phone: '', street: '', ward: '', city: '', note: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('COD'); 
  
  const [isAddressSaved, setIsAddressSaved] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);

  useEffect(() => {
    const loadCheckoutData = async () => {
      try {
        setLoading(true);

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

        if (!shopIdParam) {
          toast.error("Không tìm thấy thông tin cần thanh toán!");
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

        const selectedItemIdsFromCart = location.state?.cartItemIds || [];
        const itemIds = selectedItemIdsFromCart.length > 0 
          ? selectedItemIdsFromCart 
          : shopData.items.map(item => item.id);
          
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
        toast.error(error.response?.data?.message || error.message || "Không thể tải thông tin đơn hàng!");
        navigate('/cart');
      } finally {
        setLoading(false);
      }
    };

    loadCheckoutData();
  }, [shopIdParam, navigate, isBuyNowFlow]);

  const handlePlaceOrder = async () => {
    if (!isAddressSaved) {
      toast.error("Vui lòng thêm địa chỉ nhận hàng!");
      return;
    }

    const receiverAddress = `${formData.street}, ${formData.ward}, ${formData.city}`;

    try {
      setSubmitting(true);

      const payload = {
        paymentMethod: paymentMethod,
        receiverName: formData.fullName,
        receiverPhone: formData.phone,
        receiverAddress: receiverAddress,
        note: formData.note
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

      if (!isBuyNowFlow && fetchCartTotal) fetchCartTotal();

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
      toast.error(error.response?.data?.message || "Có lỗi xảy ra khi tạo đơn!");
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Validate form địa chỉ
  const handleSaveAddress = () => {
    if (!formData.fullName || !formData.phone || !formData.street || !formData.ward || !formData.city) {
      toast.error("Vui lòng điền đầy đủ thông tin địa chỉ!");
      return;
    }
    setIsAddressSaved(true);
    setShowAddressModal(false);
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
    <main className="pt-8 pb-32 px-4 md:px-8 max-w-screen-xl mx-auto font-['Inter'] bg-[#f3f3f6] min-h-screen">
      
      {/* BREADCRUMBS */}
      <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-gray-500 text-xs mb-6">
        <Link to="/" className="hover:text-[#2b3896] transition-colors">Trang chủ</Link>
        <span className="material-symbols-outlined text-[10px]">chevron_right</span>
        <Link to="/cart" className="hover:text-[#2b3896] transition-colors">Giỏ hàng</Link>
        <span className="material-symbols-outlined text-[10px]">chevron_right</span>
        <span className="text-gray-900 font-medium">Thanh toán</span>
      </nav>

      {/* 1. ĐỊA CHỈ GIAO HÀNG */}
      <section className="bg-white rounded-sm shadow-sm mb-6 overflow-hidden border border-gray-100">
        <div className="h-1 w-full bg-[repeating-linear-gradient(45deg,transparent,transparent_33px,#2b3896_33px,#2b3896_41px,transparent_41px,transparent_74px,#4551af_74px,#4551af_82px)] opacity-80"></div>
        <div className="p-6 md:p-8">
          <div className="flex items-center text-[#2b3896] mb-4">
            <span className="material-symbols-outlined mr-2">location_on</span>
            <h2 className="text-lg font-medium tracking-tight uppercase">Địa Chỉ Nhận Hàng</h2>
          </div>
          
          {!isAddressSaved ? (
            <div className="flex flex-col items-center justify-center py-6 bg-gray-50/50 rounded-sm border border-dashed border-gray-300">
               <p className="text-gray-500 mb-4 text-sm font-medium">Bạn chưa có địa chỉ nhận hàng.</p>
               <button
                  onClick={() => setShowAddressModal(true)}
                  className="flex items-center gap-2 px-6 py-2 bg-white border border-[#2b3896] text-[#2b3896] font-medium rounded-sm hover:bg-[#2b3896]/5 transition-colors text-sm"
               >
                  <span className="material-symbols-outlined text-sm">add</span>
                  Thêm địa chỉ mới
               </button>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-col md:flex-row md:items-center gap-4 text-sm md:text-base">
                <span className="font-bold text-gray-900">{formData.fullName} ({formData.phone})</span>
                <span className="text-gray-600">{formData.street}, {formData.ward}, {formData.city}</span>
                <span className="text-[10px] border border-[#2b3896] text-[#2b3896] px-1.5 py-0.5 rounded-sm font-semibold uppercase hidden md:inline-block">Mặc định</span>
              </div>
              <button
                onClick={() => setShowAddressModal(true)}
                className="text-[#2b3896] font-medium hover:underline text-sm text-left whitespace-nowrap"
              >
                Thay đổi
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 2. SẢN PHẨM ĐÃ ĐẶT */}
      <section className="bg-white rounded-sm shadow-sm mb-6 border border-gray-100">
        
        {/* Table Header (Hidden on Mobile) */}
        <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b border-gray-100 text-sm text-gray-500 font-medium">
          <div className="col-span-6">Sản phẩm đã đặt</div>
          <div className="col-span-2 text-center">Đơn giá</div>
          <div className="col-span-2 text-center">Số lượng</div>
          <div className="col-span-2 text-right">Thành tiền</div>
        </div>

        {/* Shop Header */}
        <div className="p-4 flex items-center space-x-3 border-b border-gray-50">
          <span className="material-symbols-outlined text-[#2b3896] text-xl">storefront</span>
          <h3 className="font-semibold text-sm text-gray-800">{previewData.shopName || `Shop #${previewData.shopId || shopIdParam}`}</h3>
        </div>

        {/* Product Items */}
        {previewData.items.map((item, index) => (
          <div key={index} className="p-4 md:grid md:grid-cols-12 items-center gap-4 border-b border-gray-50 last:border-0">
            <div className="col-span-6 flex gap-4">
              <img src={item.thumbnailUrl || 'https://via.placeholder.com/150'} alt={item.productName} className="w-20 h-20 object-cover rounded-sm border border-gray-100 flex-shrink-0" />
              <div className="flex flex-col justify-center">
                <h4 className="text-sm font-medium text-gray-800 line-clamp-2 leading-snug">{item.productName}</h4>
              </div>
            </div>
            
            <div className="hidden md:block col-span-2 text-center text-sm text-gray-600">{Number(item.unitPrice).toLocaleString('vi-VN')} ₫</div>
            <div className="hidden md:block col-span-2 text-center text-sm text-gray-600">{item.quantity}</div>
            <div className="hidden md:block col-span-2 text-right text-sm font-semibold text-[#2b3896]">{Number(item.subtotal).toLocaleString('vi-VN')} ₫</div>
            
            {/* Mobile view of price/qty */}
            <div className="md:hidden flex justify-between items-center mt-3 text-sm">
              <span className="text-gray-500">Số lượng: {item.quantity}</span>
              <span className="font-semibold text-[#2b3896]">{Number(item.subtotal).toLocaleString('vi-VN')} ₫</span>
            </div>
          </div>
        ))}

        {/* Shop Footer: Message & Shipping */}
        <div className="bg-[#f9f9fc] p-4 border-t border-gray-100 md:flex md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex flex-col md:flex-row md:items-center gap-4 flex-grow max-w-2xl">
            <label className="text-xs font-medium text-gray-500 min-w-[120px]">Lời nhắn:</label>
            <input 
              name="note" 
              value={formData.note} 
              onChange={handleInputChange} 
              className="flex-grow text-sm border-gray-300 focus:ring-1 focus:ring-[#2b3896] focus:border-[#2b3896] rounded-sm py-2 px-3 bg-white outline-none" 
              placeholder="(Không bắt buộc) Lưu ý cho người bán..." 
              type="text"
            />
          </div>
          <div className="flex items-center justify-between md:justify-end gap-8 bg-white border border-gray-100 p-3 rounded-sm shadow-sm">
            <div className="text-right">
              <p className="text-xs font-semibold text-[#8f4700]">Phương thức vận chuyển:</p>
              <p className="text-sm font-medium text-gray-800">Vận chuyển Nhanh</p>
            </div>
            <div className="text-sm font-medium text-[#2b3896]">{previewData.pricing.shippingFee === 0 ? 'Miễn phí' : `${Number(previewData.pricing.shippingFee).toLocaleString('vi-VN')} ₫`}</div>
          </div>
        </div>

        <div className="p-4 text-right bg-white border-t border-gray-100 flex justify-end items-center gap-4">
          <span className="text-sm text-gray-500">Tổng số tiền ({previewData.items.reduce((acc, curr) => acc + curr.quantity, 0)} sản phẩm):</span>
          <span className="text-xl font-bold text-[#2b3896]">{Number(previewData.pricing.subtotal + previewData.pricing.shippingFee).toLocaleString('vi-VN')} ₫</span>
        </div>
      </section>

      {/* 3. PHƯƠNG THỨC THANH TOÁN */}
      <section className="bg-white rounded-sm shadow-sm p-6 md:p-8 border border-gray-100 mb-6">
        <div className="flex items-center justify-between mb-8 border-b border-gray-100 pb-4">
          <h2 className="text-lg font-medium tracking-tight uppercase text-gray-800">Phương thức thanh toán</h2>
        </div>
        
        <div className="flex flex-wrap gap-4">
          <button 
            onClick={() => setPaymentMethod('COD')}
            className={`px-6 py-2.5 border text-sm font-medium rounded-sm relative transition-all ${paymentMethod === 'COD' ? 'border-[#2b3896] text-[#2b3896] font-bold' : 'border-gray-300 text-gray-600 hover:border-[#2b3896]/50'}`}
          >
            Thanh toán khi nhận hàng (COD)
            {paymentMethod === 'COD' && (
              <div className="absolute right-0 bottom-0 w-4 h-4 bg-[#2b3896] text-white flex items-center justify-center rounded-tl-sm">
                <span className="material-symbols-outlined text-[10px]">check</span>
              </div>
            )}
          </button>
          
          <button 
            onClick={() => setPaymentMethod('VNPAY')}
            className={`px-6 py-2.5 border text-sm font-medium rounded-sm relative transition-all ${paymentMethod === 'VNPAY' ? 'border-[#2b3896] text-[#2b3896] font-bold' : 'border-gray-300 text-gray-600 hover:border-[#2b3896]/50'}`}
          >
            Thanh toán qua VNPay
            {paymentMethod === 'VNPAY' && (
              <div className="absolute right-0 bottom-0 w-4 h-4 bg-[#2b3896] text-white flex items-center justify-center rounded-tl-sm">
                <span className="material-symbols-outlined text-[10px]">check</span>
              </div>
            )}
          </button>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-100 flex flex-col items-end gap-2 text-right">
          <div className="grid grid-cols-2 gap-x-12 gap-y-3 text-sm text-gray-500">
            <span>Tổng tiền hàng:</span>
            <span className="text-gray-900">{Number(previewData.pricing.subtotal).toLocaleString('vi-VN')} ₫</span>
            
            <span>Phí vận chuyển:</span>
            <span className="text-gray-900">{Number(previewData.pricing.shippingFee).toLocaleString('vi-VN')} ₫</span>
            
            <span className="text-lg font-medium text-gray-900 flex items-center justify-end h-full">Tổng thanh toán:</span>
            <span className="text-3xl font-bold text-[#2b3896] leading-tight">{Number(previewData.pricing.grandTotal).toLocaleString('vi-VN')} ₫</span>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-100 flex justify-end">
          <button 
            onClick={handlePlaceOrder}
            disabled={submitting}
            className="w-full md:w-auto bg-[#2b3896] text-white font-bold py-3.5 px-12 rounded-sm shadow hover:bg-[#1f2970] active:scale-[0.98] transition-all text-sm tracking-wide uppercase disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
          >
            {submitting ? 'Đang xử lý...' : 'Đặt hàng'}
          </button>
        </div>
      </section>

      {/* Guarantee Info */}
      <div className="flex items-center justify-center space-x-2 py-4 text-gray-500">
        <span className="material-symbols-outlined text-[#2b3896]">verified_user</span>
        <span className="text-xs">Đảm bảo chất lượng chính hãng | Thanh toán an toàn</span>
      </div>

      {/* MODAL THÊM/ĐỔI ĐỊA CHỈ */}
      {showAddressModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-sm shadow-2xl p-6 md:p-8 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-medium text-gray-900 mb-6 border-b border-gray-100 pb-4">Địa chỉ mới</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <input name="fullName" value={formData.fullName} onChange={handleInputChange} className="w-full border border-gray-300 rounded-sm px-4 py-3 text-sm focus:border-[#2b3896] focus:ring-1 focus:ring-[#2b3896] transition-all outline-none" placeholder="Họ và Tên" type="text" />
              </div>
              <div>
                <input name="phone" value={formData.phone} onChange={handleInputChange} className="w-full border border-gray-300 rounded-sm px-4 py-3 text-sm focus:border-[#2b3896] focus:ring-1 focus:ring-[#2b3896] transition-all outline-none" placeholder="Số điện thoại" type="tel" />
              </div>
              <div className="md:col-span-2">
                <input name="street" value={formData.street} onChange={handleInputChange} className="w-full border border-gray-300 rounded-sm px-4 py-3 text-sm focus:border-[#2b3896] focus:ring-1 focus:ring-[#2b3896] transition-all outline-none" placeholder="Số nhà, Tên đường..." type="text" />
              </div>
              <div>
                <input name="ward" value={formData.ward} onChange={handleInputChange} className="w-full border border-gray-300 rounded-sm px-4 py-3 text-sm focus:border-[#2b3896] focus:ring-1 focus:ring-[#2b3896] transition-all outline-none" placeholder="Phường / Xã" type="text" />
              </div>
              <div>
                <input name="city" value={formData.city} onChange={handleInputChange} className="w-full border border-gray-300 rounded-sm px-4 py-3 text-sm focus:border-[#2b3896] focus:ring-1 focus:ring-[#2b3896] transition-all outline-none" placeholder="Tỉnh / Thành Phố" type="text" />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8 pt-4">
              <button
                onClick={() => setShowAddressModal(false)}
                className="px-6 py-2.5 text-gray-600 font-medium rounded-sm hover:bg-gray-100 transition-colors text-sm"
              >
                Trở lại
              </button>
              <button
                onClick={handleSaveAddress}
                className="px-6 py-2.5 bg-[#2b3896] text-white font-medium rounded-sm hover:bg-[#1f2970] transition-colors text-sm"
              >
                Hoàn thành
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
};

export default Checkout;