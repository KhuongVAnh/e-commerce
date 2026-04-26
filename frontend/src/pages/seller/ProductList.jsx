import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../utils/axiosClient';

const ProductList = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Lấy dữ liệu Sản phẩm & Danh mục từ API Backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, catRes] = await Promise.all([
          axiosClient.get('/catalog/products'),
          axiosClient.get('/catalog/categories')
        ]);
        setProducts(prodRes.data || []);
        setCategories(catRes.data || []);
      } catch (error) {
        console.error("Lỗi lấy dữ liệu:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Hàm xóa sản phẩm
  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return;
    try {
      await axiosClient.delete(`/catalog/products/${id}`);
      setProducts(products.filter(p => p.id !== id));
    } catch (error) {
      alert("Lỗi khi xóa sản phẩm!");
    }
  };

  // Hàm map ID danh mục sang Tên danh mục để hiển thị Badge
  const getCategoryName = (id) => {
    const cat = categories.find(c => c.id === id);
    return cat ? cat.name : 'Khác';
  };

  return (
    <div className="p-8 md:p-12 font-sans bg-[#f8fafc] min-h-full">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 mb-2">Product Inventory</h1>
          <p className="text-slate-500 text-sm font-medium">Manage your curated collection and stock levels.</p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
            <input 
              type="text" 
              placeholder="Filter products..." 
              className="w-full bg-slate-200/50 border-none py-2.5 pl-11 pr-4 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <button 
            onClick={() => navigate('/seller/products/new')}
            className="shrink-0 px-6 py-2.5 text-sm font-bold bg-[#313b8e] hover:bg-[#252d70] text-white rounded-xl shadow-md transition flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">add</span> Add New Product
          </button>
        </div>
      </div>

      {/* BẢNG SẢN PHẨM */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden mb-8">
        <table className="w-full text-left">
          <thead className="bg-white border-b border-slate-50 text-[11px] font-black text-slate-400 uppercase tracking-widest">
            <tr>
              <th className="px-6 py-5">Thumbnail</th>
              <th className="px-6 py-5">Product Name</th>
              <th className="px-6 py-5">Category</th>
              <th className="px-6 py-5">Price</th>
              <th className="px-6 py-5">Stock</th>
              <th className="px-6 py-5">Status</th>
              <th className="px-6 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm font-bold text-slate-700">
            {loading ? (
              <tr><td colSpan="7" className="text-center py-10 text-slate-400">Loading...</td></tr>
            ) : products.map((product) => (
              <tr key={product.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                {/* 1. Thumbnail */}
                <td className="px-6 py-4">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 border border-slate-100">
                    <img src={product.thumbnailUrl || 'https://via.placeholder.com/150'} alt={product.name} className="w-full h-full object-cover" />
                  </div>
                </td>
                {/* 2. Product Name & SKU */}
                <td className="px-6 py-4">
                  <p className="text-slate-900 mb-1">{product.name}</p>
                  <p className="text-[11px] text-slate-400 font-medium">SKU: PROD-{product.id}</p>
                </td>
                {/* 3. Category */}
                <td className="px-6 py-4">
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] uppercase font-black tracking-wider">
                    {getCategoryName(product.categoryId)}
                  </span>
                </td>
                {/* 4. Price */}
                <td className="px-6 py-4 font-black text-slate-900">
                  {product.price.toLocaleString()} ₫
                </td>
                {/* 5. Stock */}
                <td className="px-6 py-4">{product.stockQuantity}</td>
                {/* 6. Status (Dựa theo số lượng tồn kho) */}
                <td className="px-6 py-4">
                  {product.stockQuantity > 0 ? (
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] uppercase font-black flex items-center gap-1 w-fit">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div> In Stock
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-[10px] uppercase font-black flex items-center gap-1 w-fit">
                      <div className="w-1.5 h-1.5 bg-rose-500 rounded-full"></div> Out of Stock
                    </span>
                  )}
                </td>
                {/* 7. Actions */}
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => navigate(`/seller/products/${product.id}/edit`)} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition">
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    <button onClick={() => handleDelete(product.id)} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition">
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* Pagination */}
        <div className="p-4 flex items-center justify-between text-[11px] font-black text-slate-400 tracking-widest uppercase">
          <span>Showing {products.length} products</span>
          <div className="flex gap-1">
            <button className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"><span className="material-symbols-outlined text-sm">chevron_left</span></button>
            <button className="w-8 h-8 rounded-lg border border-slate-200 text-[#313b8e] bg-white">1</button>
            <button className="w-8 h-8 rounded-lg hover:bg-slate-100">2</button>
            <button className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"><span className="material-symbols-outlined text-sm">chevron_right</span></button>
          </div>
        </div>
      </div>

      {/* 2 KHỐI INSIGHT BÊN DƯỚI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#313b8e] rounded-3xl p-8 text-white relative overflow-hidden shadow-lg shadow-indigo-900/20">
          <span className="material-symbols-outlined absolute right-[-20px] top-[-20px] text-[150px] opacity-10">trending_up</span>
          <div className="flex items-center gap-2 mb-4 text-indigo-200">
            <span className="material-symbols-outlined">trending_up</span>
            <h3 className="font-bold text-sm">Sales Peak</h3>
          </div>
          <p className="text-sm text-indigo-100 mb-6 leading-relaxed opacity-90">Textiles are performing 24% better this week.</p>
          <h2 className="text-3xl font-black leading-tight">Curated<br/>Growth</h2>
        </div>

        <div className="md:col-span-2 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-8">
          <div className="w-full md:w-1/3 h-32 bg-slate-200 rounded-2xl overflow-hidden shrink-0">
             <img src="https://images.unsplash.com/photo-1610701596007-11502861dcfa?q=80&w=500" alt="Pottery" className="w-full h-full object-cover grayscale" />
          </div>
          <div>
            <h3 className="text-lg font-black text-[#2e3785] mb-2">Stock Optimization</h3>
            <p className="text-sm text-slate-500 font-medium leading-relaxed mb-4">Our AI-driven editorial insights suggest replenishing 'Minimalist Tea Set' before the mid-autumn festival peak season.</p>
            <button className="text-[#313b8e] font-black text-[11px] tracking-widest uppercase flex items-center gap-1 hover:opacity-70 transition">
              EXPLORE TRENDS <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductList;