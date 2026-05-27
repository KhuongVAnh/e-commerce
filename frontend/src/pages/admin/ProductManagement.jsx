import React, { useState, useEffect, useCallback } from 'react';
import axiosClient from '../../utils/axiosClient';

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [filters] = useState({ q: '', status: '', shopId: '', categoryId: '' });

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const res = await axiosClient.get(`/catalog/admin/products?${queryParams}&limit=10`);
      setProducts(res.data.products || []);
    } catch (error) {
      setProducts([]);
      setErrorMsg(error.message || "Không thể tải danh sách sản phẩm.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return (
    <div className="p-4 md:p-6 lg:p-10 font-sans bg-[#f8fafc] min-h-full flex flex-col">
      <header className="mb-6 md:mb-10 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-[#2e3785] tracking-tight mb-2">Global Product Directory</h1>
          <p className="text-slate-500 font-medium text-xs md:text-sm flex items-center gap-2">Quản lý toàn bộ sản phẩm.</p>
        </div>
      </header>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col flex-1">
        <div className="p-4 md:p-6 border-b border-slate-50 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full lg:w-96">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
            <input type="text" placeholder="Search by Product Name..." onChange={(e) => setFilters({...filters, q: e.target.value, page: 1})} className="w-full bg-slate-50 border-none py-2.5 md:py-3 pl-11 pr-4 rounded-xl text-xs md:text-sm focus:outline-none" />
          </div>
          <select onChange={(e) => setFilters({...filters, status: e.target.value, page: 1})} className="px-4 py-2.5 bg-white border border-slate-200 text-slate-600 text-xs md:text-sm font-bold rounded-xl outline-none">
            <option value="">All Status</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option><option value="OUT_OF_STOCK">Out of Stock</option><option value="DELETED">Deleted</option>
          </select>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left whitespace-nowrap min-w-[800px]">
            <thead className="bg-white border-b border-slate-50">
              <tr>
                <th className="px-4 md:px-6 py-4 md:py-5 font-black text-[9px] md:text-[10px] uppercase tracking-widest text-slate-400">Product Details</th>
                <th className="px-4 md:px-6 py-4 md:py-5 font-black text-[9px] md:text-[10px] uppercase tracking-widest text-slate-400">Shop ID / Name</th>
                <th className="px-4 md:px-6 py-4 md:py-5 font-black text-[9px] md:text-[10px] uppercase tracking-widest text-slate-400">Category</th>
                <th className="px-4 md:px-6 py-4 md:py-5 font-black text-[9px] md:text-[10px] uppercase tracking-widest text-slate-400">Price & Stock</th>
                <th className="px-4 md:px-6 py-4 md:py-5 font-black text-[9px] md:text-[10px] uppercase tracking-widest text-slate-400">Status</th>
                <th className="px-4 md:px-6 py-4 md:py-5 font-black text-[9px] md:text-[10px] uppercase tracking-widest text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan="6" className="text-center py-10 text-slate-400">Loading products...</td></tr>
              ) : errorMsg ? (
                <tr><td colSpan="6" className="text-center py-10 text-rose-500">{errorMsg}</td></tr>
              ) : products.map((p, idx) => (
                <tr key={p.id || idx} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 md:px-6 py-4">
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="w-12 h-12 md:w-14 md:h-14 bg-slate-100 rounded-xl overflow-hidden shrink-0 border border-slate-200">
                        <img src={p.thumbnailUrl || `https://picsum.photos/seed/${p.id}/150`} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-xs md:text-sm mb-0.5">{p.name}</p>
                        <p className="text-[10px] md:text-[11px] font-medium text-slate-400 uppercase">SKU: PROD-{p.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-4 font-bold text-[#2e3785] text-xs md:text-sm">{p.shop?.name || `Shop #${p.shopId}`}</td>
                  <td className="px-4 md:px-6 py-4">
                    <span className={`px-2 md:px-3 py-1 font-black text-[9px] md:text-[10px] uppercase tracking-wider rounded-full ${
                      idx % 3 === 0 ? 'bg-indigo-50 text-indigo-700' : idx % 2 === 0 ? 'bg-orange-50 text-orange-700' : 'bg-blue-50 text-blue-700'
                    }`}>{p.category?.name || p.categoryId}</span>
                  </td>
                  <td className="px-4 md:px-6 py-4">
                    <p className="font-black text-slate-900 text-xs md:text-sm">{p.price?.toLocaleString()} ₫</p>
                    {p.status === 'DELETED' ? (
                      <p className="text-[9px] md:text-[10px] font-bold text-rose-500 uppercase tracking-widest mt-0.5">Deleted</p>
                    ) : (
                      <p className="text-[10px] md:text-[11px] font-medium text-slate-500 mt-0.5">{p.stockQuantity} in stock</p>
                    )}
                  </td>
                  <td className="px-4 md:px-6 py-4">
                    {p.status === 'ACTIVE' && <span className="px-2 md:px-3 py-1 bg-emerald-50 text-emerald-700 font-bold text-[10px] md:text-xs rounded-full flex items-center gap-1 w-fit"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div> ACTIVE</span>}
                    {p.status === 'OUT_OF_STOCK' && <span className="px-2 md:px-3 py-1 bg-slate-100 text-slate-500 font-bold text-[10px] md:text-xs rounded-full flex items-center gap-1 w-fit"><div className="w-1.5 h-1.5 bg-slate-400 rounded-full"></div> OUT OF STOCK</span>}
                    {p.status === 'DELETED' && <span className="px-2 md:px-3 py-1 bg-rose-50 text-rose-700 font-bold text-[10px] md:text-xs rounded-full flex items-center gap-1 w-fit"><div className="w-1.5 h-1.5 bg-rose-500 rounded-full"></div> DELETED</span>}
                    {p.status === 'INACTIVE' && <span className="px-2 md:px-3 py-1 bg-orange-50 text-orange-700 font-bold text-[10px] md:text-xs rounded-full flex items-center gap-1 w-fit"><div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div> INACTIVE</span>}
                  </td>
                  <td className="px-4 md:px-6 py-4 text-right">
                    <button className="w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 transition"><span className="material-symbols-outlined text-[18px] md:text-[20px]">more_vert</span></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-slate-50 flex justify-between items-center bg-white mt-auto">
          <span className="text-[10px] md:text-[11px] font-bold text-slate-400">Page {filters.page} of {pagination.totalPages}</span>
          <div className="flex gap-1">
            <button disabled={filters.page <= 1} onClick={() => setFilters({ ...filters, page: filters.page - 1 })} className="px-3 py-1.5 rounded bg-slate-100 disabled:opacity-50 text-sm font-bold text-slate-600">Prev</button>
            <button disabled={filters.page >= pagination.totalPages} onClick={() => setFilters({ ...filters, page: filters.page + 1 })} className="px-3 py-1.5 rounded bg-slate-100 disabled:opacity-50 text-sm font-bold text-slate-600">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ProductManagement;
