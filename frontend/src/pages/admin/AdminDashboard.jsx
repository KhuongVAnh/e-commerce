import React, { useState, useEffect } from 'react';
import axiosClient from '../../utils/axiosClient';

const AdminDashboard = () => {
  const [pendingShops, setPendingShops] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPendingShops = async () => {
      try {
        // Chỉ lấy các shop chưa duyệt (status=INACTIVE)
        const res = await axiosClient.get('/catalog/admin/shops?status=INACTIVE');
        setPendingShops(res.data || []);
      } catch (error) {
        setPendingShops([
          { id: 1, name: 'Luxe Homeware', sellerId: 'Nguyễn Minh Anh', category: 'Home & Living', date: 'Oct 24, 2026' },
          { id: 2, name: 'Saigon Spices', sellerId: 'Trần Hoàng Nam', category: 'Food & Beverage', date: 'Oct 22, 2026' },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchPendingShops();
  }, []);

  return (
    <div className="p-6 md:p-10 font-sans bg-[#f8fafc] min-h-full">
      <header className="mb-10">
        <h1 className="text-3xl md:text-4xl font-black text-[#2e3785] tracking-tight mb-2">Network Overview</h1>
        <p className="text-slate-500 font-medium max-w-2xl text-sm leading-relaxed">
          A curated snapshot of your marketplace performance across the Vietnamese digital landscape. Tracking growth, scale, and economic movement in real-time.
        </p>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><span className="material-symbols-outlined">group</span></div>
            <span className="text-emerald-600 font-bold text-xs bg-emerald-50 px-3 py-1 rounded-full">+12%</span>
          </div>
          <h3 className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-1">Total Users</h3>
          <div className="text-4xl font-black text-slate-900 tracking-tighter">1.2M</div>
        </div>
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><span className="material-symbols-outlined">storefront</span></div>
            <span className="text-emerald-600 font-bold text-xs bg-emerald-50 px-3 py-1 rounded-full">+4.2k</span>
          </div>
          <h3 className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-1">Total Sellers</h3>
          <div className="text-4xl font-black text-slate-900 tracking-tighter">45k</div>
        </div>
        <div className="bg-gradient-to-br from-[#2b3896] to-[#4551af] p-8 rounded-3xl shadow-lg relative overflow-hidden">
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-white/20 text-white rounded-xl"><span className="material-symbols-outlined">payments</span></div>
          </div>
          <h3 className="text-indigo-100 font-bold text-xs uppercase tracking-widest mb-1">Monthly Revenue</h3>
          <div className="flex items-baseline space-x-1">
            <span className="text-4xl font-black text-white tracking-tighter">2.4B</span><span className="text-lg font-medium text-white/70">₫</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Bảng Pending Shops */}
        <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 md:p-8 flex justify-between items-end">
            <div>
              <h2 className="text-xl font-black text-slate-900 mb-1">Newly Registered Shops</h2>
              <p className="text-sm text-slate-500 font-medium">Review and verify incoming vendor applications.</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Shop Name</th>
                  <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Owner</th>
                  <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Category</th>
                  <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Date</th>
                  <th className="px-6 py-4 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr><td colSpan="5" className="p-6 text-center text-slate-400">Loading...</td></tr>
                ) : (
                  pendingShops.map((shop) => (
                    <tr key={shop.id}>
                      <td className="px-6 py-4 font-bold text-slate-900">{shop.name}</td>
                      <td className="px-6 py-4 text-slate-600">{shop.sellerId}</td>
                      <td className="px-6 py-4"><span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-black uppercase">{shop.category || 'General'}</span></td>
                      <td className="px-6 py-4 text-slate-500 text-sm">{shop.date || 'New'}</td>
                      <td className="px-6 py-4 text-right">
                        <button className="px-4 py-2 bg-[#2e3785] text-white text-xs font-bold rounded-lg hover:bg-[#252d70]">Approve</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Health */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-base font-black mb-6 text-slate-900">Marketplace Health</h3>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-2"><span className="text-xs font-bold text-slate-500">Uptime</span><span className="text-xs font-black text-[#2e3785]">99.98%</span></div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full"><div className="bg-[#2e3785] h-full w-[99.98%]"></div></div>
              </div>
              <div>
                <div className="flex justify-between mb-2"><span className="text-xs font-bold text-slate-500">Active Sessions</span><span className="text-xs font-black text-indigo-400">12,402</span></div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full"><div className="bg-indigo-400 h-full w-[75%]"></div></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;