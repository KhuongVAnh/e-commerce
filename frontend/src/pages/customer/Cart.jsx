import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';

const createSlug = (str) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

const Cart = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const token = localStorage.getItem('accessToken') || '';

  const [cartData, setCartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [selectedShopId, setSelectedShopId] = useState(null);
  const [selectedItemIds, setSelectedItemIds] = useState([]);

  // 1. LẤY GIỎ HÀNG
  const fetchCart = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:3000/api/commerce/cart', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await res.json();
      
      if (!res.ok || !result.success) throw new Error(result.message || "Lỗi khi tải giỏ hàng");
      setCartData(result.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  // 2. CẬP NHẬT SỐ LƯỢNG
  const handleUpdateQuantity = async (itemId, currentQuantity, change) => {
    const newQuantity = currentQuantity + change;
    
    if (newQuantity < 1) {
      if (window.confirm("Bạn có chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng?")) {
        handleRemoveItem(itemId);
      }
      return;
    }

    try {
      setCartData(prev => ({
        ...prev,
        shops: prev.shops.map(shop => ({
          ...shop,
          items: shop.items.map(item => item.id === itemId ? { ...item, quantity: newQuantity } : item)
        }))
      }));

      const res = await fetch(`http://localhost:3000/api/commerce/cart/items/${itemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ quantity: newQuantity })
      });
      
      const result = await res.json();
      if (!res.ok || !result.success) {
        fetchCart(); 
        alert(result.message || "Lỗi cập nhật số lượng");
      }
    } catch (err) {
      fetchCart();
    }
  };

  // 3. XÓA SẢN PHẨM KHỎI GIỎ
  const handleRemoveItem = async (itemId) => {
    try {
      setCartData(prev => {
        const newShops = prev.shops.map(shop => ({
          ...shop,
          items: shop.items.filter(item => item.id !== itemId)
        })).filter(shop => shop.items.length > 0);
        return { ...prev, shops: newShops };
      });

      // Nếu sp bị xóa đang được chọn, loại nó ra khỏi danh sách
      setSelectedItemIds(prev => {
        const newIds = prev.filter(id => id !== itemId);
        if (newIds.length === 0) setSelectedShopId(null);
        return newIds;
      });

      const res = await fetch(`http://localhost:3000/api/commerce/cart/items/${itemId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) fetchCart();
    } catch (err) {
      fetchCart();
    }
  };

  // LOGIC ĐỘC QUYỀN 1 SHOP: Tích chọn Item
  const handleToggleItem = (itemId, shopId) => {
    if (selectedShopId !== null && selectedShopId !== shopId) {
      setSelectedShopId(shopId);
      setSelectedItemIds([itemId]);
      return;
    }

    // Đang ở cùng 1 Shop
    setSelectedItemIds(prev => {
      const newIds = prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId];
      if (newIds.length === 0) {
        setSelectedShopId(null);
      } else {
        setSelectedShopId(shopId);
      }
      return newIds;
    });
  };

  // LOGIC ĐỘC QUYỀN 1 SHOP: Tích chọn nguyên Shop
  const handleToggleShop = (shop) => {
    const shopId = shop.shopId;
    const shopItemIds = shop.items.map(item => item.id);

    if (selectedShopId === shopId) {
      const isAllSelected = shopItemIds.every(id => selectedItemIds.includes(id));
      if (isAllSelected) {
        setSelectedItemIds([]);
        setSelectedShopId(null);
      } else {
        setSelectedItemIds(shopItemIds);
      }
    } else {
      setSelectedShopId(shopId);
      setSelectedItemIds(shopItemIds);
    }
  };

  // 4. XỬ LÝ THANH TOÁN
  const handleGlobalCheckout = () => {
    if (!selectedShopId || selectedItemIds.length === 0) {
      alert("Vui lòng chọn sản phẩm cần thanh toán!");
      return;
    }
    
    navigate(`/checkout?shopId=${selectedShopId}`, {
      state: { 
        shopId: Number(selectedShopId), 
        cartItemIds: selectedItemIds
      }
    });
  };

  // UI LOADING & ERROR
  if (loading) {
    return (
      <div className="py-24 text-center min-h-screen">
        <span className="material-symbols-outlined animate-spin text-4xl text-[#2b3896]">progress_activity</span>
        <p className="mt-4 text-gray-500 font-medium">Đang tải giỏ hàng...</p>
      </div>
    );
  }

  if (error) {
    return <div className="py-24 text-center text-red-500 font-bold min-h-screen">{error}</div>;
  }

  const isCartEmpty = !cartData || !cartData.shops || cartData.shops.length === 0;

  // Tính tiền những món được chọn
  let globalSelectedSubtotal = 0;
  if (!isCartEmpty) {
    cartData.shops.forEach(shop => {
      if (shop.shopId === selectedShopId) {
        shop.items.forEach(item => {
          if (selectedItemIds.includes(item.id)) {
            globalSelectedSubtotal += item.price * item.quantity;
          }
        });
      }
    });
  }

  if (isCartEmpty) {
    return (
      <div className="py-24 text-center min-h-screen">
        <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">shopping_cart_off</span>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Giỏ hàng của bạn đang trống</h2>
        <p className="text-gray-500 mb-8">Hãy tiếp tục khám phá những sản phẩm thủ công độc đáo nhé.</p>
        <Link to="/products" className="px-8 py-3 bg-[#2b3896] text-white font-bold rounded-full hover:bg-[#1f2970] transition-colors">
          Tiếp tục mua sắm
        </Link>
      </div>
    );
  }

  return (
    <>
      <nav className="mb-8 px-6 lg:px-0 pt-8">
        <ol className="flex items-center space-x-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
          <li><Link to="/" className="hover:text-[#2b3896] transition-colors">Trang chủ</Link></li>
          <li><span className="material-symbols-outlined text-sm">chevron_right</span></li>
          <li className="text-[#2b3896]">Giỏ hàng</li>
        </ol>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start px-6 lg:px-0 pb-24">
        
        <div className="lg:col-span-8 space-y-12">
          <h1 className="text-3xl font-black tracking-tighter text-[#2b3896] mb-2 font-headline">Giỏ hàng của bạn</h1>
          
          {cartData.shops.map((shop, index) => {
            // Kiểm tra trạng thái tích chọn của Shop
            const isThisShopSelected = selectedShopId === shop.shopId;
            const shopItemIds = shop.items.map(i => i.id);
            const isShopAllSelected = isThisShopSelected && shopItemIds.every(id => selectedItemIds.includes(id));

            return (
              <section key={shop.shopId} className={`space-y-6 ${index > 0 ? 'border-t border-gray-200 pt-12' : ''}`}>
                <div className="flex items-baseline justify-between">
                  <div className="flex items-center space-x-3">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 text-[#2b3896] border-gray-300 rounded focus:ring-[#2b3896] cursor-pointer transition-all"
                      checked={isShopAllSelected}
                      onChange={() => handleToggleShop(shop)}
                    />
                    <span className="material-symbols-outlined text-[#2b3896]" style={{ fontVariationSettings: "'FILL' 1" }}>storefront</span>
                    <h2 className="text-xl font-extrabold text-[#2b3896] tracking-tight">{shop.shopName || `Shop #${shop.shopId}`}</h2>
                  </div>
                </div>

                <div className="space-y-1 bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
                  {shop.items.map((item) => {
                    const isSelected = isThisShopSelected && selectedItemIds.includes(item.id);
                    
                    return (
                      <div key={item.id} className={`bg-white p-6 flex flex-col sm:flex-row items-center gap-4 group transition-all border-b border-gray-50 last:border-0 ${isSelected ? 'bg-indigo-50/30' : ''}`}>
                        
                        <div className="flex items-center pl-2 pr-2 hidden sm:block">
                          <input 
                            type="checkbox" 
                            className="w-5 h-5 text-[#2b3896] border-gray-300 rounded focus:ring-[#2b3896] cursor-pointer"
                            checked={isSelected}
                            onChange={() => handleToggleItem(item.id, shop.shopId)}
                          />
                        </div>

                        <div className="relative w-full sm:w-28 h-32 flex-shrink-0 bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center sm:block">
                          <div className="absolute top-2 left-2 sm:hidden z-10 bg-white/80 p-1 rounded">
                            <input 
                              type="checkbox" 
                              className="w-5 h-5 text-[#2b3896] border-gray-300 rounded focus:ring-[#2b3896]"
                              checked={isSelected}
                              onChange={() => handleToggleItem(item.id, shop.shopId)}
                            />
                          </div>
                          <img src={item.thumbnailUrl || 'https://via.placeholder.com/150'} alt={item.productName} className="w-full h-full object-cover" />
                        </div>
                        
                        <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4 w-full pl-2">
                          <div>
                            <Link 
                              to={`/product/${createSlug(item.productName)}-id${item.productId}`} 
                              className="text-lg font-bold text-gray-900 mb-1 hover:text-[#2b3896] transition-colors line-clamp-2"
                            >
                              {item.productName}
                            </Link>
                            <button 
                              onClick={() => handleRemoveItem(item.id)}
                              className="mt-4 text-red-500 flex items-center space-x-1 text-sm hover:underline opacity-60 hover:opacity-100 transition-opacity font-medium"
                            >
                              <span className="material-symbols-outlined text-sm">delete</span>
                              <span>Xóa bỏ</span>
                            </button>
                          </div>
                          
                          <div className="flex flex-row md:flex-col items-center md:items-end justify-between mt-2 md:mt-0">
                            <div className="flex items-center border border-gray-200 rounded-full px-1 py-1 bg-gray-50">
                              <button onClick={() => handleUpdateQuantity(item.id, item.quantity, -1)} className="w-8 h-8 flex items-center justify-center hover:text-[#2b3896] hover:bg-white rounded-full transition-colors">
                                <span className="material-symbols-outlined text-sm">remove</span>
                              </button>
                              <span className="w-8 text-center font-bold text-sm text-gray-900">{item.quantity}</span>
                              <button onClick={() => handleUpdateQuantity(item.id, item.quantity, 1)} className="w-8 h-8 flex items-center justify-center hover:text-[#2b3896] hover:bg-white rounded-full transition-colors">
                                <span className="material-symbols-outlined text-sm">add</span>
                              </button>
                            </div>
                            <div className="text-right">
                              <span className="text-lg font-extrabold text-[#2b3896]">
                                {Number(item.price * item.quantity).toLocaleString('vi-VN')}
                              </span>
                              <span className="text-xs ml-1 text-gray-500 font-medium">₫</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        {/* CỤC TỔNG QUAN NẰM BÊN PHẢI VỚI NÚT THANH TOÁN DUY NHẤT */}
        <aside className="lg:col-span-4 sticky top-32">
          <div className="bg-white p-8 rounded-3xl shadow-[0px_12px_32px_rgba(43,56,150,0.06)] border border-gray-100">
            <h2 className="text-2xl font-black text-[#2b3896] mb-8 font-headline">Tổng quan</h2>
            
            <div className="space-y-6">
              <div className="flex justify-between items-center text-gray-600 font-medium">
                <span>Đã chọn ({selectedItemIds.length} sản phẩm)</span>
                <div className="font-bold text-gray-900">
                  {globalSelectedSubtotal.toLocaleString('vi-VN')} <span className="text-[10px] ml-0.5 opacity-70 italic">₫</span>
                </div>
              </div>
              
              <div className="h-px bg-gray-100 my-6"></div>
              
              <div className="flex justify-between items-end mb-8">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1">Tổng tiền hàng</p>
                  <p className="text-3xl font-black text-[#2b3896]">{globalSelectedSubtotal.toLocaleString('vi-VN')}<span className="text-sm font-medium ml-1">₫</span></p>
                </div>
              </div>

              {/* Nút Thanh toán gom chung */}
              <button 
                onClick={handleGlobalCheckout}
                disabled={selectedItemIds.length === 0}
                className="w-full bg-gradient-to-br from-[#2b3896] to-[#4551af] text-white px-8 py-4 rounded-xl font-bold active:scale-95 transition-all shadow-lg hover:shadow-xl hover:shadow-[#2b3896]/20 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
              >
                Tiến hành thanh toán
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>

            </div>
          </div>
        </aside>

      </div>
    </>
  );
};

export default Cart;