import { Outlet, NavLink } from 'react-router-dom';
import { useState } from 'react';
import axiosClient from '../utils/axiosClient';
import useAuthStore from '../store/useAuthStore';

const DashboardLayout = () => {
  const { user, logout } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const profileName = user?.fullName || 'Người bán';
  const profileAvatar = profileName.charAt(0).toUpperCase();

  const handleLogout = async () => {
    try { await axiosClient.post('/auth/logout'); } catch (error) {} 
    finally {
      if(logout) logout();
      window.location.href = "/login";
    }
  };

  const menuItems = [
    { name: 'Tổng quan', icon: 'dashboard', path: '/seller' },
    { name: 'Sản phẩm', icon: 'inventory_2', path: '/seller/products' },
    { name: 'Đơn hàng', icon: 'shopping_cart', path: '/seller/orders' },
    { name: 'Cài đặt Shop', icon: 'settings', path: '/seller/shop/settings' },
  ];

  return (
    <div className="flex h-screen bg-slate-50 font-body overflow-hidden">
      
      {/* Nút mở Menu trên Mobile */}
      <button 
        className="md:hidden absolute top-5 left-5 z-50 bg-white p-2 rounded-lg shadow-md text-[#2e3785]"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        <span className="material-symbols-outlined">{isMobileMenuOpen ? 'close' : 'menu'}</span>
      </button>

      {/* OVERLAY TỐI MÀU CHO MOBILE */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden" 
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {/* SIDEBAR */}
      <aside className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-100 flex flex-col shadow-2xl md:shadow-sm transform transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="h-20 flex items-center px-8 border-b border-slate-50 mt-10 md:mt-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#2e3785] rounded-lg text-white flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">storefront</span>
            </div>
            <span className="text-lg font-black text-[#2e3785]">Kênh Người Bán</span>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 text-sm font-bold overflow-y-auto">
          {menuItems.map((item, index) => (
            <NavLink 
              key={index} to={item.path} end={item.path === '/seller'} 
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) => `flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
            >
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="p-6 border-t border-slate-50">
           <div className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-3">
                 <div className="w-9 h-9 bg-slate-800 text-white rounded-full flex items-center justify-center text-xs font-bold uppercase">{profileAvatar}</div>
                 <div className="overflow-hidden">
                    <p className="text-sm font-bold text-slate-800 truncate w-32">{profileName}</p>
                    <p className="text-[10px] text-slate-400 font-medium">Đối tác xác thực</p>
                 </div>
              </div>
              <button onClick={handleLogout} className="text-slate-400 hover:text-red-500"><span className="material-symbols-outlined">logout</span></button>
           </div>
        </div>
      </aside>

      {/* NỘI DUNG CHÍNH */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden w-full">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-end px-4 md:px-8 z-10 shrink-0">
          <div className="flex items-center gap-5">
            <div className="relative">
              <span className="material-symbols-outlined text-slate-400 cursor-pointer hover:text-indigo-600 block mt-1">notifications</span>
              <span className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/4 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </div>
            <span className="material-symbols-outlined text-slate-400 cursor-pointer hover:text-indigo-600 hidden md:block">help</span>
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-white text-xs font-bold uppercase cursor-pointer ml-2">{profileAvatar}</div>
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