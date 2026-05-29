import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import useAuthStore from '../store/useAuthStore';
import useCartStore from '../store/useCartStore';
import useNotificationStore from '../store/useNotificationStore';

const CustomerLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const { isAuthenticated, user, clearAuthData } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);

  const displayQuantity = totalQuantity > 99 ? '99+' : totalQuantity;
  const displayNotif = unreadCount > 99 ? '99+' : unreadCount;

  const isHomeActive = currentPath === '/';
  const isProductsActive = currentPath.startsWith('/products') || currentPath.startsWith('/product/');
  const isShopActive = currentPath.startsWith('/shop');
  const isCategoriesActive = currentPath.startsWith('/categories');
  const isSavedActive = currentPath.startsWith('/saved');
  const isCartActive = currentPath.startsWith('/cart');

  const getNavClass = (isActive) => {
    return isActive
      ? "text-[#2b3896] font-semibold border-b-2 border-[#2b3896] pb-1 transition-all duration-200"
      : "text-gray-600 font-medium hover:text-[#2b3896] border-b-2 border-transparent pb-1 transition-all duration-200";
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = () => {
    if (logout) logout();
    setIsDropdownOpen(false);
    window.location.href = '/login';
  };

  useEffect(() => {
    if (isAuthenticated) {
      if (fetchCartTotal) fetchCartTotal();
      if (fetchNotifications) fetchNotifications();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen font-body flex flex-col">
      
      <header className="sticky top-0 w-full z-50 bg-white/80 backdrop-blur-xl shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 max-w-screen-2xl mx-auto">
          <Link to="/" className="text-2xl font-bold tracking-tighter text-[#2b3896] font-headline">
            E-commerce
          </Link>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-8 relative">
            <form onSubmit={handleSearch} className="relative w-full flex items-center bg-gray-100 rounded-full border border-gray-200/60 focus-within:border-[#2b3896]/30 focus-within:bg-white focus-within:ring-4 ring-[#2b3896]/5 transition-all">
              <input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none px-5 py-2.5 text-sm outline-none placeholder:text-gray-400 font-medium text-gray-800" 
                placeholder="Tìm kiếm sản phẩm..." 
                type="text" 
              />
              <button type="submit" className="pr-4 pl-2 text-gray-400 hover:text-[#2b3896] transition-colors flex items-center">
                <span className="material-symbols-outlined text-[22px]">search</span>
              </button>
            </form>
          </div>

          {/* Action Cluster */}
          <div className="flex items-center gap-6">
            <nav className="hidden md:flex items-center gap-8">
              <Link to="/" className={getNavClass(isHomeActive)}>Home</Link>
              <Link to="/products" className={getNavClass(isProductsActive)}>Products</Link>
              <Link to="/shop" className={getNavClass(isShopActive)}>Shop</Link>
              <Link to="/categories" className={getNavClass(isCategoriesActive)}>Categories</Link>
            </nav>
            
            <div className="flex items-center gap-3">
              
              <div className="flex items-center gap-2">
                {/* Khu vực Nút Thông Báo */}
                <div className="relative" ref={notifRef}>
                  <button 
                    onClick={() => {
                      if(!isAuthenticated) { navigate('/login'); return; }
                      setIsNotifOpen(!isNotifOpen);
                      setIsDropdownOpen(false); // Đóng menu user nếu đang mở
                    }}
                    className="relative p-2.5 rounded-full bg-[#f4f5fa] hover:bg-[#e8ebf5] transition-colors active:scale-95 group"
                  >
                    <span className="material-symbols-outlined text-[#2b3896] text-[22px] block group-hover:animate-wiggle">notifications</span>
                    {unreadCount > 0 && (
                      <span className="absolute top-0 right-0 translate-x-1/4 -translate-y-1/4 bg-[#f43f5e] text-white text-[10px] font-black min-w-[20px] h-[20px] px-1 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                        {displayNotif}
                      </span>
                    )}
                  </button>

                  {/* Dropdown Thông Báo */}
                  {isNotifOpen && (
                    <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.1)] border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <h3 className="font-bold text-gray-900">Thông báo</h3>
                        {unreadCount > 0 && (
                          <button onClick={markAllAsRead} className="text-xs font-semibold text-[#2b3896] hover:underline">
                            Đánh dấu đã đọc
                          </button>
                        )}
                      </div>
                      
                      <div className="max-h-[400px] overflow-y-auto no-scrollbar">
                        {notifications?.length === 0 ? (
                          <div className="p-8 text-center text-gray-500">
                            <span className="material-symbols-outlined text-4xl mb-2 opacity-50">notifications_off</span>
                            <p className="text-sm font-medium">Bạn chưa có thông báo nào.</p>
                          </div>
                        ) : (
                          notifications?.map((notif) => (
                            <div 
                              key={notif.id} 
                              onClick={() => !notif.isRead && markAsRead(notif.id)}
                              className={`p-4 border-b border-gray-50 cursor-pointer transition-colors hover:bg-gray-50 flex gap-3 ${notif.isRead ? 'opacity-70' : 'bg-indigo-50/30'}`}
                            >
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${notif.isRead ? 'bg-gray-100 text-gray-500' : 'bg-[#2b3896]/10 text-[#2b3896]'}`}>
                                <span className="material-symbols-outlined text-[20px]">
                                  {notif?.type?.includes('order') ? 'local_mall' : 'notifications'}
                                </span>
                              </div>
                              <div className="flex-1">
                                <p className={`text-sm mb-1 ${notif.isRead ? 'text-gray-700 font-medium' : 'text-gray-900 font-bold'}`}>
                                  {notif.title}
                                </p>
                                <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-1">{notif.content}</p>
                                <p className="text-[10px] text-gray-400 font-medium">{formatDate(notif.createdAt)}</p>
                              </div>
                              {!notif.isRead && <div className="w-2 h-2 rounded-full bg-[#2b3896] mt-1 shrink-0"></div>}
                            </div>
                          ))
                        )}
                      </div>
                      <div className="p-2 border-t border-gray-100 text-center bg-gray-50/50 hover:bg-gray-100 transition-colors cursor-pointer">
                        <span className="text-xs font-bold text-[#2b3896]">Xem tất cả</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Nút Giỏ Hàng */}
                <Link to="/cart" className="relative p-2.5 rounded-full hover:bg-gray-50 transition-colors active:scale-95 group">
                  <span className="material-symbols-outlined text-[#2b3896] text-[22px] block">shopping_bag</span>
                  {totalQuantity > 0 && (
                    <span className="absolute top-0 right-0 translate-x-1/4 -translate-y-1/4 bg-[#2b3896] text-white text-[10px] font-black min-w-[20px] h-[20px] px-1 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                      {displayQuantity}
                    </span>
                  )}
                </Link>
              </div>

              <div className="w-px h-6 bg-gray-200 mx-1 hidden md:block"></div>

              {/* KHU VỰC AUTH */}
              {isAuthenticated ? (
                <div className="relative" ref={dropdownRef}>
                  <button 
                    onClick={() => {
                      setIsDropdownOpen(!isDropdownOpen);
                      setIsNotifOpen(false);
                    }}
                    className="w-10 h-10 rounded-full overflow-hidden border-2 border-transparent hover:border-[#2b3896]/30 active:scale-95 transition-all bg-gray-100 flex items-center justify-center ml-1 shadow-sm"
                  >
                    <span className="font-extrabold text-[#2b3896] text-lg">
                      {user?.fullName ? user.fullName.charAt(0).toUpperCase() : <span className="material-symbols-outlined text-gray-500 mt-1">person</span>}
                    </span>
                  </button>

                  {/* Dropdown Menu Tài Khoản */}
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-3 w-60 bg-white rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.08)] border border-gray-100 py-2 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                        <p className="text-sm font-bold text-gray-900 truncate mb-0.5">{user?.fullName || 'Người dùng'}</p>
                        <p className="text-xs text-gray-500 truncate font-medium">{user?.email || ''}</p>
                      </div>
                      
                      <div className="py-2 px-2 space-y-0.5">
                        <Link to="/profile" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:text-[#2b3896] transition-colors">
                          <span className="material-symbols-outlined text-[20px]">account_circle</span>
                          Thông tin cá nhân
                        </Link>
                        <Link to="/orders" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:text-[#2b3896] transition-colors">
                          <span className="material-symbols-outlined text-[20px]">receipt_long</span>
                          Đơn mua của tôi
                        </Link>

                        {(user?.role === 'ADMIN' || user?.role === 'SELLER') && (
                          <Link to={user.role === 'ADMIN' ? '/admin' : '/seller'} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-orange-600 hover:bg-orange-50 transition-colors mt-1">
                            <span className="material-symbols-outlined text-[20px]">dashboard</span>
                            Quản lý hệ thống
                          </Link>
                        )}
                      </div>

                      <div className="border-t border-gray-100 px-2 py-2">
                        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 transition-colors text-left">
                          <span className="material-symbols-outlined text-[20px]">logout</span>
                          Đăng xuất
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link to="/login" className="ml-2 px-6 py-2.5 bg-[#2b3896] text-white text-sm font-bold rounded-full hover:bg-[#1f2970] transition-colors shadow-md hover:shadow-lg active:scale-95">
                  Đăng nhập
                </Link>
              )}
            </div>
          </div>
        </div>
        {/* Mobile Search Bar */}
        <div className="block md:hidden px-6 pb-4 max-w-screen-2xl mx-auto -mt-1">
          <form onSubmit={handleSearch} className="relative w-full">
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-100 border-none rounded-full px-5 py-2 text-xs focus:ring-2 focus:ring-[#2b3896]/20 transition-all outline-none" 
              placeholder="Tìm kiếm sản phẩm..." 
              type="text" 
            />
            <button type="submit" className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#2b3896] bg-transparent border-none cursor-pointer text-[18px]">
              search
            </button>
          </form>
        </div>
        <div className="bg-gray-200 h-[1px] w-full"></div>
      </header>

      <main className="max-w-screen-2xl mx-auto px-6 pb-24 md:pb-12 mt-8">
        <Outlet />
      </main>

      <footer className="bg-slate-900 text-slate-300 py-12 md:py-16 border-t border-slate-800 font-body">
        <div className="max-w-screen-2xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="space-y-4">
            <Link to="/" className="text-2xl font-bold tracking-tighter text-white font-headline">
              E-commerce
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed pr-4">
              Khám phá bộ sưu tập đồ công nghệ và thời trang cao cấp được tuyển chọn kỹ lưỡng dành riêng cho bạn.
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-6 uppercase tracking-wider text-sm">Chăm sóc khách hàng</h3>
            <ul className="space-y-3 text-sm">
              <li><Link to="/help" className="hover:text-white transition-colors">Trung tâm trợ giúp</Link></li>
              <li><Link to="/shipping" className="hover:text-white transition-colors">Chính sách vận chuyển</Link></li>
              <li><Link to="/returns" className="hover:text-white transition-colors">Trả hàng & Hoàn tiền</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">Liên hệ với chúng tôi</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-6 uppercase tracking-wider text-sm">Về thương hiệu</h3>
            <ul className="space-y-3 text-sm">
              <li><Link to="/about" className="hover:text-white transition-colors">Giới thiệu về chúng tôi</Link></li>
              <li><Link to="/careers" className="hover:text-white transition-colors">Tuyển dụng</Link></li>
              <li><Link to="/terms" className="hover:text-white transition-colors">Điều khoản dịch vụ</Link></li>
              <li><Link to="/privacy" className="hover:text-white transition-colors">Chính sách bảo mật</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-6 uppercase tracking-wider text-sm">Thanh toán an toàn</h3>
            <div className="flex gap-3 mb-8">
              <div className="w-14 h-8 bg-white rounded flex items-center justify-center text-xs font-extrabold text-blue-800 border border-slate-700">VNPAY</div>
              <div className="w-14 h-8 bg-white rounded flex items-center justify-center text-xs font-extrabold text-gray-800 border border-slate-700">COD</div>
            </div>
            
            <h3 className="text-white font-semibold mb-4 uppercase tracking-wider text-sm">Kết nối</h3>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-[#2b3896] hover:text-white transition-colors"><span className="material-symbols-outlined text-xl">share</span></a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-[#2b3896] hover:text-white transition-colors"><span className="material-symbols-outlined text-xl">mail</span></a>
            </div>
          </div>
        </div>
        <div className="max-w-screen-2xl mx-auto px-6 mt-12 pt-8 border-t border-slate-800 text-sm text-center text-slate-500 flex flex-col md:flex-row justify-between items-center gap-4">
          <p>&copy; 2026 E-Commerce. Mọi quyền được bảo lưu.</p>
          <p>Dự án E-Commerce - Nhóm 31</p>
        </div>
      </footer>

      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-2 pt-3 pb-8 md:hidden bg-white/90 backdrop-blur-2xl shadow-[0_-4px_20px_rgba(43,56,150,0.08)] border-t border-slate-100">
        <Link to="/" className={`flex flex-col items-center justify-center rounded-xl px-3 py-1.5 active:scale-90 duration-150 transition-all ${isHomeActive ? 'bg-[#2b3896]/10 text-[#2b3896]' : 'text-slate-500 hover:bg-slate-50 hover:text-[#2b3896]'}`}>
          <span className="material-symbols-outlined" style={{ fontVariationSettings: isHomeActive ? "'FILL' 1" : "'FILL' 0" }}>home</span>
          <span className="text-[11px] font-medium font-body mt-1">Home</span>
        </Link>
        <Link to="/products" className={`flex flex-col items-center justify-center rounded-xl px-3 py-1.5 active:scale-90 duration-150 transition-all ${isProductsActive ? 'bg-[#2b3896]/10 text-[#2b3896]' : 'text-slate-500 hover:bg-slate-50 hover:text-[#2b3896]'}`}>
          <span className="material-symbols-outlined" style={{ fontVariationSettings: isProductsActive ? "'FILL' 1" : "'FILL' 0" }}>storefront</span>
          <span className="text-[11px] font-medium font-body mt-1">Sản phẩm</span>
        </Link>
        <Link to="/categories" className={`flex flex-col items-center justify-center rounded-xl px-3 py-1.5 active:scale-90 duration-150 transition-all ${isCategoriesActive ? 'bg-[#2b3896]/10 text-[#2b3896]' : 'text-slate-500 hover:bg-slate-50 hover:text-[#2b3896]'}`}>
          <span className="material-symbols-outlined" style={{ fontVariationSettings: isCategoriesActive ? "'FILL' 1" : "'FILL' 0" }}>grid_view</span>
          <span className="text-[11px] font-medium font-body mt-1">Danh mục</span>
        </Link>
        <Link to="/saved" className={`flex flex-col items-center justify-center rounded-xl px-3 py-1.5 active:scale-90 duration-150 transition-all ${isSavedActive ? 'bg-[#2b3896]/10 text-[#2b3896]' : 'text-slate-500 hover:bg-slate-50 hover:text-[#2b3896]'}`}>
          <span className="material-symbols-outlined" style={{ fontVariationSettings: isSavedActive ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
          <span className="text-[11px] font-medium font-body mt-1">Đã lưu</span>
        </Link>
        <Link to="/cart" className={`relative flex flex-col items-center justify-center rounded-xl px-3 py-1.5 active:scale-90 duration-150 transition-all ${isCartActive ? 'bg-[#2b3896]/10 text-[#2b3896]' : 'text-slate-500 hover:bg-slate-50 hover:text-[#2b3896]'}`}>
          <div className="relative">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: isCartActive ? "'FILL' 1" : "'FILL' 0" }}>shopping_bag</span>
            {totalQuantity > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-[#2b3896] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-white shadow-sm">
                {displayQuantity}
              </span>
            )}
          </div>
          <span className="text-[11px] font-medium font-body mt-1">Giỏ hàng</span>
        </Link>
      </nav>

    </div>
  );
};

export default CustomerLayout;