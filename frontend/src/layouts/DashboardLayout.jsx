import { Outlet, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axiosClient from '../utils/axiosClient';

const DashboardLayout = ({ roleTitle }) => {
  const defaultProfile = {
    name: `Nguyễn ${roleTitle} (Mẫu)`,
    avatar: roleTitle.charAt(0),
    notifications: 0
  };

  const [profile, setProfile] = useState(defaultProfile);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { user } = await axiosClient.get('/api/auth/me'); 
        setProfile({
          name: user.fullName,
          avatar: user.fullName.charAt(0),
          notifications: 3 
        });
      } catch (error) {
        console.error("🔴 [DashboardLayout] Lỗi gọi API:", error.message || error);
        setProfile(defaultProfile); // Dùng dữ liệu mẫu nếu mất kết nối Backend
      }
    }
    fetchProfile();
  }, []);

  const handleLogout = async () => {
    try {
      await axiosClient.post('/api/auth/logout');
    } catch (error) {
      console.error("🔴 Lỗi API logout:", error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('userRole');
      window.location.href = "/";
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-body">
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-slate-200 fixed h-full flex flex-col z-20">
        <div className="p-6 text-xl font-bold border-b border-slate-100 flex items-center gap-2">
          <span className="material-symbols-outlined text-indigo-600">storefront</span>
          <span className="text-indigo-900">{roleTitle} Central</span>
        </div>
        <nav className="flex-1 p-4 space-y-1 text-sm font-medium">
          <Link to={`/${roleTitle.toLowerCase()}`} className="flex items-center gap-3 p-3 text-indigo-600 bg-indigo-50 rounded-xl">
            <span className="material-symbols-outlined">dashboard</span> Dashboard
          </Link>
          <Link to="#" className="flex items-center gap-3 p-3 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition-all">
            <span className="material-symbols-outlined">inventory_2</span> Products
          </Link>
        </nav>
      </aside>

      {/* HEADER & CONTENT */}
      <div className="flex-1 ml-64 flex flex-col">
        <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="font-semibold text-slate-800">{roleTitle} Dashboard</div>
          <div className="flex items-center gap-5">
            <div className="relative cursor-pointer hover:text-indigo-600">
              <span className="material-symbols-outlined text-slate-400 ">notifications</span>
              {profile.notifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {profile.notifications}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-indigo-900 flex items-center justify-center text-white text-xs font-bold uppercase">
                {profile.avatar}
              </div>
              <span className="text-sm font-medium text-slate-700">{profile.name}</span>
            </div>
            <button onClick={handleLogout} className="ml-4 text-sm text-red-500 font-medium hover:underline">
              Đăng xuất
            </button>
          </div>
        </header>

        <main className="p-8 flex-1 overflow-auto">
          <Outlet /> 
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;