import { Outlet, NavLink, Link } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import axiosClient from '../utils/axiosClient';
import useAuthStore from '../store/useAuthStore';
import NotificationBell from '../components/NotificationBell';

const DashboardLayout = ({ roleTitle }) => {
  const { user, clearAuthData } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // State và Ref cho Dropdown Menu của Avatar
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const profileName = user?.fullName || roleTitle || 'Dashboard';
  const profileAvatar = profileName.charAt(0).toUpperCase();

  // Xử lý click ra ngoài để đóng Dropdown Menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try { await axiosClient.post('/auth/logout'); } catch { /* ignore logout errors */ }
    finally {
      clearAuthData();
      window.location.href = "/";
    }
  };

  const sellerMenuItems = [
    { name: 'Dashboard', icon: 'dashboard', path: '/seller' },
    { name: 'Products', icon: 'inventory_2', path: '/seller/products' },
    { name: 'Orders', icon: 'shopping_cart', path: '/seller/orders' },
    { name: 'Settings', icon: 'settings', path: '/seller/shop/settings' },
  ];

  const adminMenuItems = [
    { name: 'Dashboard', icon: 'dashboard', path: '/admin' },
    { name: 'Users', icon: 'group', path: '/admin/users' },
    { name: 'Shops', icon: 'storefront', path: '/admin/shops' },
    { name: 'Categories', icon: 'category', path: '/admin/categories' },
    { name: 'Products', icon: 'inventory_2', path: '/admin/products' },
    { name: 'Orders', icon: 'shopping_cart', path: '/admin/orders' },
  ];

  const menuItems = roleTitle === 'Admin' ? adminMenuItems : sellerMenuItems;

  return (
    <div className="flex h-screen bg-slate-50 font-body overflow-hidden">
      
      <button 
        className="md:hidden absolute top-5 left-5 z-50 bg-white p-2 rounded-lg shadow-md text-[#2e3785]"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        <span className="material-symbols-outlined">{isMobileMenuOpen ? 'close' : 'menu'}</span>
      </button>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}

      <aside className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-100 flex flex-col shadow-2xl md:shadow-sm transform transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="h-20 flex items-center px-8 border-b border-slate-50 mt-10 md:mt-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#2e3785] rounded-lg text-white flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">{roleTitle === 'Admin' ? 'admin_panel_settings' : 'storefront'}</span>
            </div>
            <span className="text-lg font-black text-[#2e3785]">{roleTitle === 'Admin' ? 'Admin Console' : 'Seller Hub'}</span>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 text-sm font-bold overflow-y-auto">
          {menuItems.map((item, index) => (
            <NavLink 
              key={index} to={item.path} end={item.path === '/seller' || item.path === '/admin'} 
              onClick={() => setIsMobileMenuOpen(false)} 
              className={({ isActive }) => `flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
            >
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              {item.name}
            </NavLink>
          ))}

          {roleTitle === 'Seller' && user?.role === 'ADMIN' && (
            <NavLink to="/admin" className="flex items-center gap-4 px-4 py-3 text-red-600 font-bold hover:bg-red-50 rounded-xl mt-6 transition-all">
              <span className="material-symbols-outlined text-[20px]">arrow_back</span> Quay lại Admin
            </NavLink>
          )}
        </nav>

        <div className="p-6 border-t border-slate-50">
           <div className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-3">
                 <div className="w-9 h-9 bg-slate-800 text-white rounded-full flex items-center justify-center text-xs font-bold uppercase">{profileAvatar}</div>
                 <div className="overflow-hidden">
                    <p className="text-sm font-bold text-slate-800 truncate w-32">{profileName}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{user?.role === 'ADMIN' ? 'Administrator' : 'Verified Merchant'}</p>
                 </div>
              </div>
           </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-screen overflow-hidden w-full">
        
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-end px-4 md:px-8 z-10 shrink-0">
          <div className="flex items-center gap-5 relative">
            <NotificationBell />
            <span className="material-symbols-outlined text-slate-400 cursor-pointer hover:text-indigo-600 hidden md:block">help</span>
            
            {/* AVATAR CÓ MENU DROPDOWN */}
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-white text-sm font-bold uppercase cursor-pointer hover:ring-4 hover:ring-slate-200 transition-all outline-none"
              >
                {profileAvatar}
              </button>

              {/* BẢNG MENU RÚT XUỐNG KHI CLICK */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 overflow-hidden animate-in slide-in-from-top-2">
                  
                  <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                    <p className="text-sm font-bold text-gray-900 truncate">{user?.fullName || profileName}</p>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{user?.email || ''}</p>
                  </div>
                  
                  <div className="py-1">
                    <Link to="/profile" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-[#2e3785] transition-colors">
                      <span className="material-symbols-outlined text-[20px]">account_circle</span> Thông tin cá nhân
                    </Link>
                    <Link to="/orders" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-[#2e3785] transition-colors">
                      <span className="material-symbols-outlined text-[20px]">receipt_long</span> Đơn mua của tôi
                    </Link>

                    {/* Nút thoát ra trang ngoài (Khách hàng) */}
                    <Link to="/" className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-emerald-600 hover:bg-emerald-50 transition-colors border-t border-gray-50 mt-1 pt-2">
                      <span className="material-symbols-outlined text-[20px]">storefront</span> Về trang mua sắm
                    </Link>
                  </div>

                  <div className="border-t border-gray-100 pt-1 pb-1">
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors text-left">
                      <span className="material-symbols-outlined text-[20px]">logout</span> Đăng xuất
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </header>

        <main className="flex-1 overflow-y-auto relative bg-[#f8fafc]">
          <Outlet /> 
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;