import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import useAuthStore from '../store/useAuthStore';
import useCartStore from '../store/useCartStore';

const CustomerLayout = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  const { totalQuantity, fetchCartTotal } = useCartStore();

  const [notificationCount, setNotificationCount] = useState(3);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = () => {
    if(logout) logout();
    setIsDropdownOpen(false);
    window.location.href = '/login';
  };

  useEffect(() => {
    if (isAuthenticated && fetchCartTotal) {
      fetchCartTotal();
    }
  }, [isAuthenticated]);

  const displayQuantity = totalQuantity > 99 ? '99+' : totalQuantity;
  const displayNotif = notificationCount > 99 ? '99+' : notificationCount;

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
    <div className="bg-surface text-on-surface min-h-screen font-body flex flex-col">
      
      {/* 1. TOP NAVIGATION BAR */}
      <header className="sticky top-0 w-full z-50 bg-white/90 backdrop-blur-xl shadow-sm border-b border-gray-100">
        <div className="flex items-center justify-between px-6 py-3.5 max-w-7xl mx-auto">
          {/* Brand Logo */}
          <Link to="/" className="text-2xl font-black tracking-tighter text-[#2b3896] font-headline">
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
            {/* ĐÃ SỬA: Dùng NavLink để tự động bắt trạng thái active (Gạch chân đúng trang) */}
            <nav className="hidden md:flex items-center gap-8 mr-2">
              <NavLink 
                to="/" 
                className={({ isActive }) => `font-bold text-sm transition-all py-1 ${isActive ? 'text-[#2b3896] border-b-2 border-[#2b3896]' : 'text-gray-500 hover:text-[#2b3896]'}`}
              >
                Trang chủ
              </NavLink>
              <NavLink 
                to="/shop" 
                className={({ isActive }) => `font-bold text-sm transition-all py-1 ${isActive ? 'text-[#2b3896] border-b-2 border-[#2b3896]' : 'text-gray-500 hover:text-[#2b3896]'}`}
              >
                Cửa hàng
              </NavLink>
              <NavLink 
                to="/categories" 
                className={({ isActive }) => `font-bold text-sm transition-all py-1 ${isActive ? 'text-[#2b3896] border-b-2 border-[#2b3896]' : 'text-gray-500 hover:text-[#2b3896]'}`}
              >
                Danh mục
              </NavLink>
            </nav>
            
            <div className="flex items-center gap-3">
              
              {/* ĐÃ SỬA: Đồng bộ Icon Thông báo & Giỏ hàng theo ảnh */}
              <div className="flex items-center gap-2">
                {/* Nút Thông Báo */}
                <button className="relative p-2.5 rounded-full bg-[#f4f5fa] hover:bg-[#e8ebf5] transition-colors active:scale-95 group">
                  <span className="material-symbols-outlined text-[#2b3896] text-[22px] block group-hover:animate-wiggle">notifications</span>
                  {notificationCount > 0 && (
                    <span className="absolute top-0 right-0 translate-x-1/4 -translate-y-1/4 bg-[#f43f5e] text-white text-[10px] font-black min-w-[20px] h-[20px] px-1 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                      {displayNotif}
                    </span>
                  )}
                </button>

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
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-10 h-10 rounded-full overflow-hidden border-2 border-transparent hover:border-[#2b3896]/30 active:scale-95 transition-all bg-gray-100 flex items-center justify-center ml-1 shadow-sm"
                  >
                    <span className="font-extrabold text-[#2b3896] text-lg">
                      {user?.fullName ? user.fullName.charAt(0).toUpperCase() : <span className="material-symbols-outlined text-gray-500 mt-1">person</span>}
                    </span>
                  </button>

                  {/* Dropdown Menu */}
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
      </header>

      {/* 2. MAIN CONTENT */}
      <main className="flex-grow w-full max-w-7xl mx-auto px-6 pb-24 md:pb-12 mt-8">
        <Outlet />
      </main>

      {/* 3. FOOTER */}
      <footer className="bg-slate-900 text-slate-300 py-12 md:py-16 border-t border-slate-800 mt-auto">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          
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

        <div className="max-w-7xl mx-auto px-6 mt-12 pt-8 border-t border-slate-800 text-sm text-center text-slate-500 flex flex-col md:flex-row justify-between items-center gap-4">
          <p>&copy; 2026 E-Commerce. Mọi quyền được bảo lưu.</p>
          <p>Dự án E-Commerce - Nhóm 31</p>
        </div>
      </footer>

      {/* 4. MOBILE NAVIGATION BAR */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-2 pt-3 pb-6 md:hidden bg-white/90 backdrop-blur-xl border-t border-gray-100 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <NavLink 
          to="/" 
          className={({ isActive }) => `flex flex-col items-center justify-center w-16 py-1.5 rounded-2xl transition-all ${isActive ? 'bg-[#f4f5fa] text-[#2b3896]' : 'text-gray-400 hover:text-gray-900'}`}
        >
          <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
          <span className="text-[10px] font-bold mt-1">Trang chủ</span>
        </NavLink>
        
        <NavLink 
          to="/categories" 
          className={({ isActive }) => `flex flex-col items-center justify-center w-16 py-1.5 rounded-2xl transition-all ${isActive ? 'bg-[#f4f5fa] text-[#2b3896]' : 'text-gray-400 hover:text-gray-900'}`}
        >
          <span className="material-symbols-outlined text-[24px]">grid_view</span>
          <span className="text-[10px] font-bold mt-1">Danh mục</span>
        </NavLink>

        <button className="flex flex-col items-center justify-center w-16 py-1.5 rounded-2xl transition-all text-gray-400 hover:text-gray-900 relative">
          <span className="material-symbols-outlined text-[24px]">notifications</span>
          <span className="text-[10px] font-bold mt-1">Thông báo</span>
          {notificationCount > 0 && (
            <span className="absolute top-1 right-3 bg-[#f43f5e] w-2.5 h-2.5 rounded-full border-2 border-white"></span>
          )}
        </button>

        <NavLink 
          to="/cart" 
          className={({ isActive }) => `flex flex-col items-center justify-center w-16 py-1.5 rounded-2xl transition-all relative ${isActive ? 'bg-[#f4f5fa] text-[#2b3896]' : 'text-gray-400 hover:text-gray-900'}`}
        >
          <span className="material-symbols-outlined text-[24px]">shopping_bag</span>
          <span className="text-[10px] font-bold mt-1">Giỏ hàng</span>
          {totalQuantity > 0 && (
            <span className="absolute top-0 right-2 translate-x-1 min-w-[18px] h-[18px] bg-[#2b3896] text-white text-[9px] font-black flex items-center justify-center rounded-full border-2 border-white">
              {displayQuantity}
            </span>
          )}
        </NavLink>
      </nav>

    </div>
  );
};

export default CustomerLayout;