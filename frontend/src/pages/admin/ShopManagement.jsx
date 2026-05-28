import React, { useState, useEffect, useCallback } from 'react';
import axiosClient from '../../utils/axiosClient';

const ShopManagement = () => {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [filters, setFilters] = useState({ q: '', status: '' });
  const [shopStats, setShopStats] = useState({ total: 0, pending: 0, active: 0 });
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedShop, setSelectedShop] = useState(null);

  const fetchShops = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, val]) => {
        if (val) queryParams.append(key, val);
      });

      const res = await axiosClient.get(`/catalog/admin/shops?${queryParams.toString()}`);
      const data = res?.data?.shops || res?.shops || res?.data || [];
      const totalShops = res?.data?.pagination?.total || res?.pagination?.total || 0;
      
      setShops(Array.isArray(data) ? data : []);
      
      const [pendingRes, activeRes] = await Promise.allSettled([
        axiosClient.get('/catalog/admin/shops?status=PENDING&limit=1'),
        axiosClient.get('/catalog/admin/shops?status=ACTIVE&limit=1')
      ]);

      setShopStats({
        total: totalShops,
        pending: pendingRes.status === 'fulfilled' ? (pendingRes.value?.data?.pagination?.total || pendingRes.value?.pagination?.total || 0) : 0,
        active: activeRes.status === 'fulfilled' ? (activeRes.value?.data?.pagination?.total || activeRes.value?.pagination?.total || 0) : 0
      });
    } catch (error) {
      setShops([]);
      setErrorMsg(error.message || "Không thể tải danh sách shop.");
    } finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchShops(); }, [fetchShops]);

  const openShopDetail = async (shop) => {
    setIsDetailModalOpen(true);
    try {
      const res = await axiosClient.get(`/catalog/admin/shops/${shop.id}`);
      setSelectedShop(res?.data?.shop || res?.shop || res?.data || shop);
    } catch (error) { setSelectedShop(shop); }
  };

  const handleUpdateStatus = async (shopId, newStatus) => {
    if(!window.confirm(`Xác nhận chuyển trạng thái sang ${newStatus}?`)) return;
    try {
      await axiosClient.patch(`/catalog/admin/shops/${shopId}/status`, { status: newStatus });
      alert('Cập nhật trạng thái thành công!');
      fetchShops();
      setIsDetailModalOpen(false);
    } catch (error) { alert("Lỗi: " + (error.response?.data?.message || 'Không thể cập nhật.')); }
  };

  return (
    <div className="p-4 md:p-6 lg:p-10 font-sans bg-[#f8fafc] min-h-full flex flex-col relative">
      <header className="mb-6 md:mb-8 flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-[#2e3785] tracking-tight mb-2">Shop Directory</h1>
          <p className="text-slate-500 font-medium text-xs md:text-sm max-w-2xl">Quản lý gian hàng và kiểm duyệt nền tảng.</p>
        </div>
        <div className="relative flex-1 sm:w-64 md:flex-none">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
          <input type="text" placeholder="Search shops..." onChange={(e) => setFilters({...filters, q: e.target.value})} className="w-full bg-white border border-slate-200 py-2.5 pl-10 pr-4 rounded-xl text-sm outline-none" />
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Total Shops</p>
          <div className="text-3xl md:text-4xl font-black text-slate-900">{(shopStats.total || 0).toLocaleString()}</div>
        </div>
        <div className="bg-[#2e3785] p-6 md:p-8 rounded-3xl shadow-lg text-white">
          <p className="text-xs font-bold text-indigo-200 uppercase tracking-widest mb-2">Pending Approval</p>
          <div className="text-3xl md:text-4xl font-black">{(shopStats.pending || 0).toLocaleString()}</div>
        </div>
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Active Shops</p>
          <div className="text-3xl md:text-4xl font-black text-emerald-600">{(shopStats.active || 0).toLocaleString()}</div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden mb-6 flex flex-col flex-1">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left whitespace-nowrap min-w-[700px]">
            <thead className="bg-white border-b border-slate-50">
              <tr>
                <th className="px-6 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Shop Name</th>
                <th className="px-6 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Owner</th>
                <th className="px-6 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Join Date</th>
                <th className="px-6 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Status</th>
                <th className="px-6 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? <tr><td colSpan="5" className="text-center py-10 text-slate-400">Loading...</td></tr> : errorMsg ? <tr><td colSpan="5" className="text-center py-10 text-rose-500">{errorMsg}</td></tr> : shops.length === 0 ? <tr><td colSpan="5" className="text-center py-10 text-slate-400">Không có dữ liệu.</td></tr> : shops.map((s, idx) => (
                <tr key={s.id || idx} className="hover:bg-slate-50/50">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-400">{s.name?.charAt(0)}</div>
                      <p className="font-bold text-slate-900 text-sm">{s.name}</p>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-sm font-medium text-slate-600">{s.sellerId}</td>
                  <td className="px-6 py-5 text-xs font-medium text-slate-500">{s.createdAt ? new Date(s.createdAt).toLocaleDateString() : 'N/A'}</td>
                  <td className="px-6 py-5">
                    {s.status === 'ACTIVE' && <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase rounded-full">ACTIVE</span>}
                    {s.status === 'PENDING' && <span className="px-3 py-1 bg-indigo-50 text-[#2e3785] text-[10px] font-black uppercase rounded-full">PENDING</span>}
                    {s.status === 'INACTIVE' && <span className="px-3 py-1 bg-rose-50 text-rose-700 text-[10px] font-black uppercase rounded-full">INACTIVE</span>}
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button onClick={() => openShopDetail(s)} className="text-slate-400 hover:text-[#2e3785] transition p-1"><span className="material-symbols-outlined text-[18px]">visibility</span></button>
                    {s.status === 'PENDING' && <><button onClick={() => handleUpdateStatus(s.id, 'ACTIVE')} className="ml-2 w-8 h-8 bg-emerald-500 text-white rounded-full"><span className="material-symbols-outlined text-[14px]">check</span></button><button onClick={() => handleUpdateStatus(s.id, 'INACTIVE')} className="ml-2 w-8 h-8 bg-rose-500 text-white rounded-full"><span className="material-symbols-outlined text-[14px]">close</span></button></>}
                    {s.status === 'ACTIVE' && <button onClick={() => handleUpdateStatus(s.id, 'INACTIVE')} className="ml-2 w-8 h-8 bg-orange-500 text-white rounded-full"><span className="material-symbols-outlined text-[14px]">pause</span></button>}
                    {s.status === 'INACTIVE' && <button onClick={() => handleUpdateStatus(s.id, 'ACTIVE')} className="ml-2 px-3 py-1 border border-[#2e3785] text-[#2e3785] text-[10px] font-bold rounded-full">Re-activate</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isDetailModalOpen && selectedShop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="p-8 relative">
              <button onClick={() => setIsDetailModalOpen(false)} className="absolute top-6 right-6 text-slate-400"><span className="material-symbols-outlined">close</span></button>
              <h2 className="text-2xl font-black text-[#2e3785] mb-6">Shop Details</h2>
              <div className="flex gap-5 items-center pb-6 border-b border-slate-100">
                <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center"><span className="text-3xl font-black text-slate-400">{selectedShop.name?.charAt(0)}</span></div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">{selectedShop.name}</h3>
                  <p className="text-sm font-bold text-[#2e3785] mb-1">Owner: {selectedShop.sellerId}</p>
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-black uppercase rounded">{selectedShop.status}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6 bg-slate-50 p-5 rounded-2xl mt-6">
                <div><p className="text-[10px] font-black text-slate-400">Address</p><p className="text-sm font-medium">{selectedShop.address || 'N/A'}</p></div>
                <div><p className="text-[10px] font-black text-slate-400">Join Date</p><p className="text-sm font-medium">{selectedShop.createdAt ? new Date(selectedShop.createdAt).toLocaleDateString() : 'N/A'}</p></div>
                <div className="col-span-2"><p className="text-[10px] font-black text-slate-400">Description</p><p className="text-sm font-medium">{selectedShop.description || 'N/A'}</p></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default ShopManagement;