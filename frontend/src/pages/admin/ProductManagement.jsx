import React, { useState, useEffect, useCallback } from 'react';
import axiosClient from '../../utils/axiosClient';

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [filters, setFilters] = useState({ q: '', status: '', shopId: '', categoryId: '' });
  const [stats, setStats] = useState({ total: 0, active: 0, outOfStock: 0, deleted: 0 });

  // Dữ liệu cho Filter Dropdown
  const [filterShops, setFilterShops] = useState([]);
  const [filterCats, setFilterCats] = useState([]);

  useEffect(() => {
    // Tải danh sách shops và categories để đổ vào Dropdown
    axiosClient.get('/catalog/admin/shops?limit=100').then(res => setFilterShops(res?.data?.shops || []));
    axiosClient.get('/catalog/categories').then(res => setFilterCats(res?.data || []));
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, val]) => { if (val) queryParams.append(key, val); });

      const res = await axiosClient.get(`/catalog/admin/products?${queryParams.toString()}`);
      const data = res?.data?.products || res?.products || res?.data || [];
      const safeData = Array.isArray(data) ? data : [];
      setProducts(safeData);
      
      setStats({
        total: res?.data?.pagination?.total || safeData.length,
        active: safeData.filter(p => p.status === 'ACTIVE').length,
        outOfStock: safeData.filter(p => p.status === 'OUT_OF_STOCK').length,
        deleted: safeData.filter(p => p.status === 'DELETED').length
      });
    } catch (error) {
      setProducts([]);
      setErrorMsg(error.message || "Không thể tải danh sách sản phẩm.");
    } finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  return (
    <div className="p-4 md:p-6 lg:p-10 font-sans bg-[#f8fafc] min-h-full flex flex-col">
      <header className="mb-6 md:mb-10 flex flex-col lg:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-[#2e3785] tracking-tight mb-2">Global Product Directory</h1>
          <p className="text-slate-500 font-medium text-xs md:text-sm">Active listings across shops</p>
        </div>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
        <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-100 shadow-sm"><h3 className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-1">Total Products</h3><div className="text-3xl font-black text-slate-900">{stats.total}</div></div>
        <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-100 shadow-sm"><h3 className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-1">Active Listings</h3><div className="text-3xl font-black text-[#2e3785]">{stats.active}</div></div>
        <div className="bg-orange-50 p-5 md:p-6 rounded-2xl border border-orange-100 shadow-sm"><h3 className="text-orange-800 font-bold text-[10px] uppercase tracking-widest mb-1">Out Of Stock</h3><div className="text-3xl font-black text-orange-600">{stats.outOfStock}</div></div>
        <div className="bg-rose-50 p-5 md:p-6 rounded-2xl border border-rose-100 shadow-sm"><h3 className="text-rose-800 font-bold text-[10px] uppercase tracking-widest mb-1">Deleted</h3><div className="text-3xl font-black text-rose-600">{stats.deleted}</div></div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col flex-1">
        <div className="p-4 md:p-6 border-b border-slate-50 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full lg:w-96">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
            <input type="text" placeholder="Search product..." onChange={e => setFilters({...filters, q: e.target.value})} className="w-full bg-slate-50 border-none py-3 pl-11 pr-4 rounded-xl text-sm outline-none" />
          </div>
          <div className="flex gap-2 w-full sm:w-auto overflow-x-auto scrollbar-hide">
            <select onChange={e => setFilters({...filters, shopId: e.target.value})} className="bg-slate-50 border border-slate-100 px-4 py-3 rounded-xl font-bold text-sm outline-none text-slate-600">
              <option value="">All Shops</option>
              {filterShops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select onChange={e => setFilters({...filters, categoryId: e.target.value})} className="bg-slate-50 border border-slate-100 px-4 py-3 rounded-xl font-bold text-sm outline-none text-slate-600">
              <option value="">All Categories</option>
              {filterCats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select onChange={e => setFilters({...filters, status: e.target.value})} className="bg-slate-50 border border-slate-100 px-4 py-3 rounded-xl font-bold text-sm outline-none text-slate-600">
              <option value="">All Status</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option><option value="OUT_OF_STOCK">Out of Stock</option><option value="DELETED">Deleted</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left whitespace-nowrap min-w-[800px]">
            <thead className="bg-white border-b border-slate-50">
              <tr>
                <th className="px-6 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Product Details</th>
                <th className="px-6 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Shop / Seller</th>
                <th className="px-6 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Category</th>
                <th className="px-6 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Price & Stock</th>
                <th className="px-6 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? <tr><td colSpan="5" className="text-center py-10 text-slate-400">Loading...</td></tr> : errorMsg ? <tr><td colSpan="5" className="text-center py-10 text-rose-500">{errorMsg}</td></tr> : products.length === 0 ? <tr><td colSpan="5" className="text-center py-10 text-slate-400">Không có sản phẩm.</td></tr> : products.map((p, idx) => (
                <tr key={p.id || idx} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-100 rounded-xl overflow-hidden flex items-center justify-center font-black text-slate-300">
                        {p.thumbnailUrl ? <img src={p.thumbnailUrl} className="w-full h-full object-cover" /> : p.name?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{p.name}</p>
                        <p className="text-[11px] font-medium text-slate-400 uppercase">SKU: PROD-{p.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-[#2e3785] text-sm">{p.shop?.name || `Shop #${p.shopId}`}</td>
                  <td className="px-6 py-4"><span className="px-3 py-1 font-black text-[10px] uppercase rounded-full bg-slate-100 text-slate-600">{p.category?.name || p.categoryId || 'N/A'}</span></td>
                  <td className="px-6 py-4">
                    <p className="font-black text-slate-900 text-sm">{(p.price || 0).toLocaleString()} ₫</p>
                    <p className="text-[11px] font-medium text-slate-500 mt-0.5">{p.stockQuantity || 0} in stock</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 font-bold text-[10px] uppercase rounded-full">{p.status}</span>
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
export default ProductManagement;