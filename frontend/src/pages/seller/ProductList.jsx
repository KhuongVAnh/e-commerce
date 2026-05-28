import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../utils/axiosClient';

const SellerProductList = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [filters, setFilters] = useState({ q: '' });
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [shopId, setShopId] = useState(null);

  useEffect(() => {
    const initData = async () => {
      try {
        const [shopRes, catRes] = await Promise.allSettled([
          axiosClient.get('/catalog/shops/my-shop'),
          axiosClient.get('/catalog/categories')
        ]);
        if (shopRes.status === 'fulfilled') setShopId(shopRes.value?.data?.shop?.id || shopRes.value?.shop?.id);
        if (catRes.status === 'fulfilled') setCategories(catRes.value?.data?.data || catRes.value?.data || []);
      } catch (error) { setErrorMsg("Không thể lấy thông tin khởi tạo."); }
    };
    initData();
  }, []);

  const fetchProducts = useCallback(async () => {
    if (!shopId) { setLoading(false); return; }
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('shopId', shopId);
      queryParams.append('page', pagination.page);
      queryParams.append('limit', pagination.limit);
      if (filters.q) queryParams.append('q', filters.q);

      const res = await axiosClient.get(`/catalog/products?${queryParams.toString()}`);
      const pData = res?.data?.products || res?.products || res?.data || [];
      setProducts(Array.isArray(pData) ? pData : []);
      
      const metaPag = res?.data?.pagination || res?.meta?.pagination || res?.pagination;
      if (metaPag) setPagination(prev => ({ ...prev, total: metaPag.total || 0, totalPages: metaPag.totalPages || 1 }));
    } catch (error) {
      setErrorMsg("Không thể tải danh sách sản phẩm.");
    } finally { setLoading(false); }
  }, [shopId, filters.q, pagination.page, pagination.limit]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleSearch = (e) => {
    setFilters({ q: e.target.value });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return;
    try {
      await axiosClient.delete(`/catalog/products/${id}`);
      fetchProducts();
    } catch (error) { alert("Lỗi khi xóa sản phẩm: " + (error.response?.data?.message || 'Có lỗi xảy ra')); }
  };

  const handleAddProduct = () => {
    if (!shopId) {
      alert("Bạn cần khởi tạo gian hàng trước khi có thể đăng sản phẩm mới!");
      navigate('/seller/shop/settings');
    } else {
      navigate('/seller/products/new');
    }
  };

  const getCategoryName = (id) => {
    const cat = categories.find(c => c.id === id);
    return cat ? cat.name : 'Khác';
  };

  const getVisiblePages = () => {
    let start = Math.max(1, pagination.page - 1);
    let end = Math.min(pagination.totalPages, pagination.page + 1);
    if (pagination.page === 1) end = Math.min(pagination.totalPages, 3);
    if (pagination.page === pagination.totalPages) start = Math.max(1, pagination.totalPages - 2);
    const pages = [];
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  return (
    <div className="p-4 md:p-8 lg:p-12 font-sans bg-[#f8fafc] min-h-full">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4 mt-8 md:mt-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 mb-2">Product Inventory</h1>
          <p className="text-slate-500 text-xs md:text-sm font-medium">Manage your curated collection and stock levels.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
          <div className="relative w-full sm:w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
            <input type="text" value={filters.q} onChange={handleSearch} placeholder="Filter products..." className="w-full bg-white border border-slate-200 py-2.5 pl-10 pr-4 rounded-xl text-sm focus:ring-2 focus:ring-[#2e3785]/20 outline-none" />
          </div>
          <button onClick={handleAddProduct} className="w-full sm:w-auto shrink-0 px-6 py-2.5 text-sm font-bold bg-[#313b8e] hover:bg-[#252d70] text-white rounded-xl shadow-md transition flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-[18px]">add</span> Add New Product
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden mb-8 w-full flex flex-col">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-white border-b border-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <tr>
                <th className="px-6 py-5">Thumbnail</th><th className="px-6 py-5">Product Name</th><th className="px-6 py-5">Category</th>
                <th className="px-6 py-5">Price</th><th className="px-6 py-5">Stock</th><th className="px-6 py-5">Status</th><th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm font-bold text-slate-700 divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan="7" className="text-center py-10 text-slate-400">Loading...</td></tr>
              ) : errorMsg ? (
                <tr><td colSpan="7" className="text-center py-10 text-rose-500">{errorMsg}</td></tr>
              ) : !shopId ? (
                <tr><td colSpan="7" className="text-center py-10 text-slate-400">Vui lòng thiết lập gian hàng để quản lý và đăng bán sản phẩm.</td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan="7" className="text-center py-10 text-slate-400">Không tìm thấy sản phẩm.</td></tr>
              ) : products.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-100 flex items-center justify-center">
                      {product.thumbnailUrl ? <img src={product.thumbnailUrl} className="w-full h-full object-cover" /> : <span className="material-symbols-outlined text-slate-300">image</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-slate-900 mb-0.5">{product.name}</p>
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">SKU: PROD-{product.id}</p>
                  </td>
                  <td className="px-6 py-4"><span className="px-3 py-1 bg-indigo-50 text-[#2e3785] rounded-full text-[10px] uppercase font-black tracking-wider">{getCategoryName(product.categoryId)}</span></td>
                  <td className="px-6 py-4 font-black text-slate-900">{(product.price || 0).toLocaleString()} ₫</td>
                  <td className="px-6 py-4">{product.stockQuantity || 0}</td>
                  <td className="px-6 py-4">
                    {product.status === 'ACTIVE' && <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] uppercase font-black flex items-center w-fit gap-1"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div> In Stock</span>}
                    {(product.status === 'OUT_OF_STOCK' || product.status === 'OUT OF STOCK') && <span className="px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-[10px] uppercase font-black flex items-center w-fit gap-1"><div className="w-1.5 h-1.5 bg-rose-500 rounded-full"></div> Out of Stock</span>}
                    {product.status === 'INACTIVE' && <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] uppercase font-black flex items-center w-fit gap-1"><div className="w-1.5 h-1.5 bg-slate-400 rounded-full"></div> Hidden</span>}
                    {product.status === 'DELETED' && <span className="px-3 py-1 bg-slate-100 text-rose-700 rounded-full text-[10px] uppercase font-black">Deleted</span>}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => navigate(`/seller/products/${product.id}/edit`)} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 transition"><span className="material-symbols-outlined text-[18px]">edit</span></button>
                      <button onClick={() => handleDelete(product.id)} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"><span className="material-symbols-outlined text-[18px]">delete</span></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 md:px-6 border-t border-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white mt-auto">
          <span className="text-[10px] md:text-xs font-medium text-slate-400">
            Showing {pagination.total > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} products
          </span>
          <div className="flex gap-1">
            <button disabled={pagination.page <= 1} onClick={() => setPagination({...pagination, page: pagination.page - 1})} className="w-7 h-7 md:w-8 md:h-8 rounded border border-slate-200 text-slate-400 flex items-center justify-center disabled:opacity-50"><span className="material-symbols-outlined text-xs md:text-sm">chevron_left</span></button>
            {getVisiblePages().map(p => (
              <button key={p} onClick={() => setPagination({...pagination, page: p})} className={`w-7 h-7 md:w-8 md:h-8 rounded text-[10px] md:text-xs font-bold transition-colors ${pagination.page === p ? 'bg-[#2e3785] text-white shadow-sm' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>{p}</button>
            ))}
            <button disabled={pagination.page >= pagination.totalPages} onClick={() => setPagination({...pagination, page: pagination.page + 1})} className="w-7 h-7 md:w-8 md:h-8 rounded border border-slate-200 text-slate-400 flex items-center justify-center disabled:opacity-50"><span className="material-symbols-outlined text-xs md:text-sm">chevron_right</span></button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default SellerProductList;