import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import useAuthStore from '../store/useAuthStore';
import useCartStore from '../store/useCartStore';
import { authService } from '../services/authService';
import NotificationBell from '../components/NotificationBell';

const CustomerLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const { isAuthenticated, user, clearAuthData } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { totalQuantity, fetchCartTotal } = useCartStore();

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
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = async () => {
    try { await authService.logout(); } catch { /* ignore logout errors */ }
    clearAuthData();
    setIsDropdownOpen(false);
    navigate('/login');
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchCartTotal();
    }
  }, [isAuthenticated, fetchCartTotal]);

  const displayQuantity = totalQuantity > 99 ? '99+' : totalQuantity;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="bg-surface text-on-surface min-h-screen font-body">
      
      <header className="sticky top-0 w-full z-50 bg-white/80 backdrop-blur-xl shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 max-w-screen-2xl mx-auto">
          <Link to="/" className="flex items-center gap-2 text-2xl font-black tracking-tight text-[#2b3896] font-headline">
            <svg className="w-8 h-8 text-[#2b3896] shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="6" width="18" height="14" rx="4" stroke="currentColor" strokeWidth="2.5" />
              <path d="M9 9V6C9 4.34315 10.3431 3 12 3C13.6569 3 15 4.34315 15 6V9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M9 13L12 16L15 13" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="font-black bg-gradient-to-r from-[#2b3896] to-[#4551af] bg-clip-text text-transparent">E-Commerce</span>
          </Link>

          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <form onSubmit={handleSearch} className="relative w-full">
              <input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-100 border-none rounded-full px-6 py-2 text-sm focus:ring-2 focus:ring-[#2b3896]/20 transition-all outline-none" 
                placeholder="Tìm kiếm sản phẩm..." 
                type="text" 
              />
              <button type="submit" className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#2b3896] bg-transparent border-none cursor-pointer">
                search
              </button>
            </form>
          </div>

          <div className="flex items-center gap-6">
            <nav className="hidden md:flex items-center gap-8">
              <Link to="/" className={getNavClass(isHomeActive)}>Home</Link>
              <Link to="/products" className={getNavClass(isProductsActive)}>Products</Link>
              <Link to="/shop" className={getNavClass(isShopActive)}>Shop</Link>
              <Link to="/categories" className={getNavClass(isCategoriesActive)}>Categories</Link>
            </nav>
            
            <div className="flex items-center gap-4">
              <NotificationBell />

              <Link to="/cart" className="relative cursor-pointer hover:opacity-70 active:scale-95 transition-all mr-2">
                <span className="material-symbols-outlined text-[#2b3896] text-3xl">shopping_bag</span>
                {totalQuantity > 0 && (
                  <span className="absolute -top-1 -right-2 bg-[#2b3896] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-white shadow-sm">
                    {displayQuantity}
                  </span>
                )}
              </Link>

              {isAuthenticated ? (
                <div className="relative" ref={dropdownRef}>
                  <button 
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#2b3896]/20 cursor-pointer hover:border-[#2b3896] active:scale-95 transition-all bg-gray-100 flex items-center justify-center"
                  >
                    <span className="font-bold text-[#2b3896]">
                      {user?.fullName ? user.fullName.charAt(0).toUpperCase() : <span className="material-symbols-outlined text-gray-500 text-xl mt-1">person</span>}
                    </span>
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 overflow-hidden">
                      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                        <p className="text-sm font-bold text-gray-900 truncate">{user?.fullName || 'Người dùng'}</p>
                        <p className="text-xs text-gray-500 truncate mt-0.5">{user?.email || ''}</p>
                      </div>
                      
                      <div className="py-1">
                        <Link to="/profile" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-[#2b3896] transition-colors">
                          <span className="material-symbols-outlined text-[20px]">account_circle</span>
                          Thông tin cá nhân
                        </Link>
                        <Link to="/orders" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-[#2b3896] transition-colors">
                          <span className="material-symbols-outlined text-[20px]">receipt_long</span>
                          Đơn mua của tôi
                        </Link>

                        {(user?.role === 'ADMIN' || user?.role === 'SELLER') && (
                          <Link to={user.role === 'ADMIN' ? '/admin' : '/seller'} onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-orange-600 hover:bg-orange-50 transition-colors border-t border-gray-50 mt-1 pt-2">
                            <span className="material-symbols-outlined text-[20px]">dashboard</span>
                            {user.role === 'ADMIN' ? 'Trang quản trị' : 'Kênh người bán'}
                          </Link>
                        )}
                      </div>

                      <div className="border-t border-gray-100 pt-1 pb-1">
                        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors text-left">
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
            <Link to="/" className="flex items-center gap-2 text-2xl font-black tracking-tight text-white font-headline">
              <svg className="w-8 h-8 text-[#4551af] shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="6" width="18" height="14" rx="4" stroke="currentColor" strokeWidth="2.5" />
                <path d="M9 9V6C9 4.34315 10.3431 3 12 3C13.6569 3 15 4.34315 15 6V9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M9 13L12 16L15 13" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>E-Commerce</span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed pr-4">Khám phá bộ sưu tập đồ công nghệ và thời trang cao cấp được tuyển chọn kỹ lưỡng dành riêng cho bạn.</p>
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
              <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-[#2b3896] hover:text-white transition-colors">
                 <span className="material-symbols-outlined text-xl">share</span>
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-[#2b3896] hover:text-white transition-colors">
                 <span className="material-symbols-outlined text-xl">mail</span>
              </a>
            </div>
          </div>
        </div>
        <div className="max-w-screen-2xl mx-auto px-6 mt-12 pt-8 border-t border-slate-800 text-sm text-center text-slate-500 flex flex-col md:flex-row justify-between items-center gap-4">
          <p>&copy; 2026 E-Commerce. Mọi quyền được bảo lưu.</p>
          <p>Dự án E-Commerce - Nhóm 26</p>
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