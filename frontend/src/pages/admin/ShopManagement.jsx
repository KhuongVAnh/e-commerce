import React, { useState, useEffect } from 'react';
import axiosClient from '../../utils/axiosClient';

const ShopManagement = () => {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ q: '', status: '' });
  
  // Stats mô phỏng theo Figma (Bạn có thể cập nhật gọi API sau)
  const stats = { total: '1,248', pending: 42, products: '84,209' };

  useEffect(() => {
    fetchShops();
  }, [filters]);

  const fetchShops = async () => {
    setLoading(true);
    try {
      // API chuẩn: GET /api/catalog/admin/shops
      const queryParams = new URLSearchParams(filters).toString();
      const res = await axiosClient.get(`/catalog/admin/shops?${queryParams}`);
      setShops(res.data || []);
    } catch (error) {
      // Mock data khớp 100% Figma để test UI
      setShops([
        { id: 1, name: 'An Ceramics Studio', sub: 'Handcrafted Pottery', sellerId: 'Nguyen Van An', products: 312, createdAt: '2023-10-12', status: 'ACTIVE' },
        { id: 2, name: 'Silk & Saffron', sub: 'Premium Textiles', sellerId: 'Le Thi Mai', products: 45, createdAt: '2024-01-05', status: 'PENDING' },
        { id: 3, name: 'Hanoi Tech Hub', sub: 'Electronics', sellerId: 'Tran Minh Hoang', products: 1102, createdAt: '2022-03-15', status: 'INACTIVE' }, // INACTIVE thay cho SUSPENDED theo Enum
        { id: 4, name: 'Phố Coffee Co.', sub: 'Gourmet Beverages', sellerId: 'Pham Thuy Duong', products: 88, createdAt: '2023-12-20', status: 'ACTIVE' },
      ]);
    } finally { 
      setLoading(false); 
    }
  };

  const handleUpdateStatus = async (shopId, newStatus) => {
    if(!window.confirm(`Bạn có chắc muốn chuyển shop này sang trạng thái ${newStatus}?`)) return;
    try {
      await axiosClient.patch(`/catalog/admin/shops/${shopId}/status`, { status: newStatus });
      alert('Cập nhật trạng thái thành công!');
      fetchShops();
    } catch (error) {
      alert("Lỗi: " + (error.response?.data?.message || 'Không thể cập nhật.'));
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-10 font-sans bg-[#f8fafc] min-h-full flex flex-col">
      <header className="mb-6 md:mb-8 flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-[#2e3785] tracking-tight mb-2">Shop Directory</h1>
          <p className="text-slate-500 font-medium text-xs md:text-sm max-w-2xl leading-relaxed">
            Manage marketplace shops, approve new merchant requests, and monitor seller activity across the platform.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
           <div className="relative flex-1 sm:w-64">
             <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
             <input type="text" placeholder="Search shop names..." className="w-full bg-white border border-slate-200 py-2.5 pl-10 pr-4 rounded-xl text-sm focus:ring-2 focus:ring-[#2e3785]/20 outline-none" />
           </div>
           <button className="px-5 py-2.5 bg-[#2e3785] hover:bg-[#252d70] text-white text-sm font-bold rounded-xl shadow-sm transition flex items-center justify-center gap-2 whitespace-nowrap">
             <span className="material-symbols-outlined text-[18px]">add</span> Invite Merchant
           </button>
        </div>
      </header>

      {/* Top Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
        <div className="bg-white p-6 md:p-8 rounded-2xl md:rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-center">
          <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Total Shops</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter">{stats.total}</span>
            <span className="text-[10px] md:text-[11px] font-bold text-emerald-600">+12% this month</span>
          </div>
        </div>
        <div className="bg-[#2e3785] p-6 md:p-8 rounded-2xl md:rounded-3xl shadow-lg text-white relative overflow-hidden flex flex-col justify-center sm:col-span-2 lg:col-span-1">
          <p className="text-[10px] md:text-xs font-bold text-indigo-200 uppercase tracking-widest mb-2">Pending Approval</p>
          <div className="flex items-baseline gap-2 z-10">
            <span className="text-3xl md:text-4xl font-black tracking-tighter">{stats.pending}</span>
            <span className="text-[10px] md:text-[11px] font-medium text-indigo-200">Requires review</span>
          </div>
          <span className="material-symbols-outlined absolute right-0 bottom-[-10px] text-[80px] md:text-[100px] opacity-10 pointer-events-none">assignment</span>
        </div>
        <div className="bg-white p-6 md:p-8 rounded-2xl md:rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-center">
          <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Total Products</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter">{stats.products}</span>
            <span className="text-[10px] md:text-[11px] font-bold text-[#2e3785]">₫ average price</span>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden mb-6 md:mb-8 flex flex-col flex-1">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left whitespace-nowrap min-w-[700px]">
            <thead className="bg-white border-b border-slate-50">
              <tr>
                <th className="px-4 md:px-6 py-4 md:py-5 font-black text-[9px] md:text-[10px] uppercase tracking-widest text-slate-400">Shop Name</th>
                <th className="px-4 md:px-6 py-4 md:py-5 font-black text-[9px] md:text-[10px] uppercase tracking-widest text-slate-400">Seller Name</th>
                <th className="px-4 md:px-6 py-4 md:py-5 font-black text-[9px] md:text-[10px] uppercase tracking-widest text-slate-400 text-center">Products</th>
                <th className="px-4 md:px-6 py-4 md:py-5 font-black text-[9px] md:text-[10px] uppercase tracking-widest text-slate-400">Join Date</th>
                <th className="px-4 md:px-6 py-4 md:py-5 font-black text-[9px] md:text-[10px] uppercase tracking-widest text-slate-400">Status</th>
                <th className="px-4 md:px-6 py-4 md:py-5 font-black text-[9px] md:text-[10px] uppercase tracking-widest text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan="6" className="text-center py-10 text-slate-400">Loading...</td></tr>
              ) : shops.map((s, idx) => (
                <tr key={s.id || idx} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 md:px-6 py-4 md:py-5">
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200 flex items-center justify-center">
                         <img src={`https://picsum.photos/seed/${s.id || idx}/150`} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-xs md:text-sm mb-0.5">{s.name}</p>
                        <p className="text-[10px] md:text-[11px] font-medium text-slate-400">{s.sub || 'Retail'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-4 md:py-5 text-xs md:text-sm font-medium text-slate-600 whitespace-pre-wrap leading-tight max-w-[100px]">{s.sellerId}</td>
                  <td className="px-4 md:px-6 py-4 md:py-5 text-xs md:text-sm font-black text-[#2e3785] text-center">{s.products || 0}</td>
                  <td className="px-4 md:px-6 py-4 md:py-5 text-[11px] md:text-xs font-medium text-slate-500 whitespace-pre-wrap leading-tight max-w-[80px]">
                    {new Date(s.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                  </td>
                  <td className="px-4 md:px-6 py-4 md:py-5">
                    {s.status === 'ACTIVE' && <span className="px-2 md:px-3 py-1 bg-emerald-50 text-emerald-700 text-[8px] md:text-[10px] font-black uppercase tracking-wider rounded-full">ACTIVE</span>}
                    {s.status === 'PENDING' && <span className="px-2 md:px-3 py-1 bg-indigo-50 text-[#2e3785] text-[8px] md:text-[10px] font-black uppercase tracking-wider rounded-full">PENDING</span>}
                    {s.status === 'INACTIVE' && <span className="px-2 md:px-3 py-1 bg-rose-50 text-rose-700 text-[8px] md:text-[10px] font-black uppercase tracking-wider rounded-full">SUSPENDED</span>}
                  </td>
                  <td className="px-4 md:px-6 py-4 md:py-5 text-right">
                    <div className="flex justify-end gap-1 md:gap-2 items-center">
                      <button className="text-slate-400 hover:text-[#2e3785] transition p-1"><span className="material-symbols-outlined text-[16px] md:text-[18px]">visibility</span></button>
                      
                      {s.status === 'PENDING' && (
                        <>
                          <button onClick={() => handleUpdateStatus(s.id, 'ACTIVE')} className="w-7 h-7 md:w-8 md:h-8 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full flex items-center justify-center transition shadow-sm" title="Approve"><span className="material-symbols-outlined text-[14px] md:text-[16px]">check</span></button>
                          <button onClick={() => handleUpdateStatus(s.id, 'INACTIVE')} className="w-7 h-7 md:w-8 md:h-8 bg-rose-500 hover:bg-rose-600 text-white rounded-full flex items-center justify-center transition shadow-sm" title="Reject"><span className="material-symbols-outlined text-[14px] md:text-[16px]">close</span></button>
                        </>
                      )}
                      
                      {s.status === 'ACTIVE' && (
                        <button onClick={() => handleUpdateStatus(s.id, 'INACTIVE')} className="w-7 h-7 md:w-8 md:h-8 bg-orange-500 hover:bg-orange-600 text-white rounded-full flex items-center justify-center transition shadow-sm" title="Suspend"><span className="material-symbols-outlined text-[14px] md:text-[16px]">pause</span></button>
                      )}

                      {s.status === 'INACTIVE' && (
                        <button onClick={() => handleUpdateStatus(s.id, 'ACTIVE')} className="px-3 py-1 md:py-1.5 border border-[#2e3785] text-[#2e3785] text-[9px] md:text-[10px] font-bold rounded-full hover:bg-indigo-50 transition">Re-activate</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-4 border-t border-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white mt-auto">
          <span className="text-[10px] md:text-[11px] font-bold text-slate-400 uppercase tracking-widest">Showing 4 of 1,248 shops</span>
          <div className="flex gap-1">
            <button className="w-8 h-8 rounded-full border border-slate-200 text-slate-400 flex items-center justify-center"><span className="material-symbols-outlined text-sm">chevron_left</span></button>
            <button className="w-8 h-8 rounded-full bg-[#2e3785] text-white font-bold text-xs shadow-sm">1</button>
            <button className="w-8 h-8 rounded-full border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50">2</button>
            <button className="w-8 h-8 rounded-full border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50">3</button>
            <button className="w-8 h-8 rounded-full border border-slate-200 text-slate-400 flex items-center justify-center"><span className="material-symbols-outlined text-sm">chevron_right</span></button>
          </div>
        </div>
      </div>

      {/* Bottom Banners */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mt-auto">
        <div className="bg-indigo-50/70 p-6 md:p-8 rounded-2xl md:rounded-3xl border border-indigo-100/50 flex gap-3 md:gap-4">
          <span className="material-symbols-outlined text-[#2e3785] shrink-0">verified</span>
          <div>
            <h4 className="font-bold text-[#2e3785] mb-2 text-xs md:text-sm">Merchant Verification Policy</h4>
            <p className="text-[11px] md:text-xs text-[#2e3785]/80 leading-relaxed font-medium">Ensure all pending merchants have uploaded valid business permits and identity documents before approval. High-volume sellers require additional verification tiers.</p>
          </div>
        </div>
        <div className="bg-orange-50/70 p-6 md:p-8 rounded-2xl md:rounded-3xl border border-orange-100/50 flex gap-3 md:gap-4">
          <span className="material-symbols-outlined text-orange-800 shrink-0">info</span>
          <div>
            <h4 className="font-bold text-orange-900 mb-2 text-xs md:text-sm">Activity Monitoring</h4>
            <p className="text-[11px] md:text-xs text-orange-900/80 leading-relaxed font-medium">Suspended shops are flagged for manual review by the compliance team. Re-activation requires an audit of recent transaction history and customer feedback.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopManagement;