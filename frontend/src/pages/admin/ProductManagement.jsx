import React, { useState, useEffect, useCallback } from 'react';
import axiosClient from '../../utils/axiosClient';

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [filters, setFilters] = useState({ q: '', status: '', shopId: '', categoryId: '' });
  const [stats, setStats] = useState({ total: 0, active: 0, outOfStock: 0, deleted: 0 });

  const [filterShops, setFilterShops] = useState([]);
  const [filterCats, setFilterCats] = useState([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
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

  const handleDelete = async (id) => {
    if (!window.confirm("Xóa sản phẩm này vĩnh viễn?")) return;
    try {
      await axiosClient.delete(`/catalog/admin/products/${id}`);
      fetchProducts();
    } catch (error) { alert("Lỗi khi xóa!"); }
  };

  const openEditModal = async (productId) => {
    setIsModalOpen(true);
    try {
      const res = await axiosClient.get(`/catalog/admin/products/${productId}`);
      setSelectedProduct(res?.data?.product || res?.product || res?.data);
    } catch (error) {
      alert("Lỗi tải chi tiết: " + error.message);
      setIsModalOpen(false);
    }
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    try {
      await axiosClient.put(`/catalog/admin/products/${selectedProduct.id}`, {
        name: selectedProduct.name,
        price: parseFloat(selectedProduct.price),
        stockQuantity: parseInt(selectedProduct.stockQuantity),
        status: selectedProduct.status
      });
      alert('Cập nhật thành công!');
      setIsModalOpen(false);
      fetchProducts();
    } catch (error) { alert("Lỗi: " + (error.response?.data?.message || 'Không thể lưu.')); }
  };

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
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? <tr><td colSpan="6" className="text-center py-10 text-slate-400">Loading...</td></tr> : errorMsg ? <tr><td colSpan="6" className="text-center py-10 text-rose-500">{errorMsg}</td></tr> : products.length === 0 ? <tr><td colSpan="6" className="text-center py-10 text-slate-400">Không có sản phẩm.</td></tr> : products.map((p, idx) => (
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
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => openEditModal(p.id)} className="w-8 h-8 rounded-full hover:bg-indigo-50 text-slate-400 hover:text-[#2e3785] flex items-center justify-center transition inline-flex"><span className="material-symbols-outlined text-[18px]">edit</span></button>
                    <button onClick={() => handleDelete(p.id)} className="w-8 h-8 rounded-full hover:bg-rose-50 text-slate-400 hover:text-rose-600 flex items-center justify-center transition inline-flex"><span className="material-symbols-outlined text-[18px]">delete</span></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg p-8 relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-slate-400"><span className="material-symbols-outlined">close</span></button>
            <h2 className="text-2xl font-black text-slate-900 mb-6">Edit Product (Admin)</h2>
            <form onSubmit={handleUpdateProduct} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Product Name</label>
                <input type="text" value={selectedProduct.name} onChange={(e) => setSelectedProduct({...selectedProduct, name: e.target.value})} required className="w-full bg-slate-100 px-4 py-3 rounded-xl outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Price (VND)</label>
                  <input type="number" value={selectedProduct.price} onChange={(e) => setSelectedProduct({...selectedProduct, price: e.target.value})} required className="w-full bg-slate-100 px-4 py-3 rounded-xl outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Stock</label>
                  <input type="number" value={selectedProduct.stockQuantity} onChange={(e) => setSelectedProduct({...selectedProduct, stockQuantity: e.target.value})} required className="w-full bg-slate-100 px-4 py-3 rounded-xl outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Status</label>
                <select value={selectedProduct.status} onChange={(e) => setSelectedProduct({...selectedProduct, status: e.target.value})} className="w-full bg-slate-100 px-4 py-3 rounded-xl outline-none">
                  <option value="ACTIVE">ACTIVE</option><option value="INACTIVE">INACTIVE</option><option value="OUT_OF_STOCK">OUT_OF_STOCK</option><option value="DELETED">DELETED</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-sm font-bold text-slate-600 bg-slate-100 rounded-xl">Cancel</button>
                <button type="submit" className="px-6 py-3 bg-[#2e3785] text-white text-sm font-bold rounded-xl">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default ProductManagement;