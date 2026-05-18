import React, { useState, useEffect } from 'react';
import axiosClient from '../../utils/axiosClient';

const ShopManagement = () => {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const res = await axiosClient.get('/catalog/admin/shops');
        setShops(res.data || []);
      } catch (error) {
        setShops([
          { id: 1, sellerId: 'USR-019', name: 'Luxe Homeware', status: 'INACTIVE' },
          { id: 2, sellerId: 'USR-042', name: 'Hanoi Silk', status: 'ACTIVE' },
        ]);
      } finally { setLoading(false); }
    };
    fetchShops();
  }, []);

  return (
    <div className="p-6 md:p-10 font-sans bg-[#f8fafc] min-h-full">
      <header className="mb-10">
        <h1 className="text-3xl md:text-4xl font-black text-[#2e3785] tracking-tight mb-2">Shop Directory</h1>
        <p className="text-slate-500 font-medium text-sm">Scalable vendor onboarding and shop directory control.</p>
      </header>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-black text-slate-900">All Registered Shops</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">ID</th>
                <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Shop Name</th>
                <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Seller ID</th>
                <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan="5" className="text-center py-8">Loading shops...</td></tr>
              ) : shops.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm font-bold text-slate-500">{s.id}</td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-900">{s.name}</td>
                  <td className="px-6 py-4 text-sm text-[#2e3785]">{s.sellerId}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-[10px] font-black rounded ${s.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-orange-50 text-orange-700'}`}>{s.status}</span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    {s.status === 'INACTIVE' && (
                      <button className="px-3 py-1.5 bg-[#2e3785] text-white text-xs font-bold rounded hover:bg-[#252d70]">Approve</button>
                    )}
                    <button className="px-3 py-1.5 border border-slate-200 text-slate-600 text-xs font-bold rounded hover:bg-slate-100">Suspend</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ShopManagement;