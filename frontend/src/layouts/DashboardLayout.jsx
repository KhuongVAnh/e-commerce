import { Outlet, NavLink } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axiosClient from '../utils/axiosClient';

const DashboardLayout = ({ roleTitle }) => {
  const defaultProfile = { name: `Nguyễn ${roleTitle} (Mẫu)`, avatar: roleTitle.charAt(0), notifications: 0 };
  const [profile, setProfile] = useState(defaultProfile);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { user } = await axiosClient.get('/api/auth/me'); 
        setProfile({ name: user.fullName, avatar: user.fullName.charAt(0), notifications: 3 });
      } catch (error) {
        setProfile(defaultProfile);
      }
    }
    fetchProfile();
  }, []);

  const handleLogout = async () => {
    try { await axiosClient.post('/api/auth/logout'); } catch (error) {} 
    finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('userRole');
      window.location.href = "/";
    }
  };

  const menuItems = [
    { name: 'Dashboard', icon: 'dashboard', path: '/seller' },
    { name: 'Products', icon: 'inventory_2', path: '/seller/products' },
    { name: 'Orders', icon: 'shopping_cart', path: '/seller/orders' },
    { name: 'Settings', icon: 'settings', path: '/seller/shop/settings' },
  ];

  return (
    <div className="flex h-screen bg-slate-50 font-body overflow-hidden">
      <aside className="w-64 shrink-0 bg-white border-r border-slate-100 flex flex-col z-20 shadow-sm">
        <div className="h-20 flex items-center px-8 border-b border-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#2e3785] rounded-lg text-white flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">storefront</span>
            </div>
            <span className="text-lg font-black text-[#2e3785]">Artisanal Studio</span>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-2 text-sm font-bold">
          {menuItems.map((item, index) => (
            <NavLink key={index} to={item.path} end={item.path === '/seller'} className={({ isActive }) => `flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}>
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              {item.name}
            </NavLink>
          ))}
        </nav>
        <div className="p-6 border-t border-slate-50">
           <div className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-3">
                 <div className="w-9 h-9 bg-slate-800 text-white rounded-full flex items-center justify-center text-xs font-bold uppercase">{profile.avatar}</div>
                 <div>
                    <p className="text-sm font-bold text-slate-800 line-clamp-1">{profile.name}</p>
                    <p className="text-xs text-slate-400 font-medium">Verified Merchant</p>
                 </div>
              </div>
              <button onClick={handleLogout} className="text-slate-400 hover:text-red-500"><span className="material-symbols-outlined">logout</span></button>
           </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-end px-8 z-10">
          <div className="flex items-center gap-5">
            <span className="material-symbols-outlined text-slate-400 cursor-pointer hover:text-indigo-600">notifications</span>
            <span className="material-symbols-outlined text-slate-400 cursor-pointer hover:text-indigo-600">help</span>
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-white text-xs font-bold uppercase cursor-pointer">{profile.avatar}</div>
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