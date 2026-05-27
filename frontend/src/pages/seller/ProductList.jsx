import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../utils/axiosClient';

const ProductList = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const shopRes = await axiosClient.get('/catalog/shops/my-shop');
        const shopId = shopRes.data.shop.id;
        const [prodRes, catRes] = await Promise.all([
          axiosClient.get('/catalog/products', { params: { shopId } }),
          axiosClient.get('/catalog/categories')
        ]);
        setProducts(Array.isArray(prodRes.data) ? prodRes.data : []);
        setCategories(catRes.data || []);
      } catch (error) {
        console.error("Lỗi lấy dữ liệu:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return;
    try {
      await axiosClient.delete(`/catalog/products/${id}`);
      setProducts(products.filter(p => p.id !== id));
    } catch {
      alert("Lỗi khi xóa sản phẩm!");
    }
  };

  const getCategoryName = (id) => {
    const cat = categories.find(c => c.id === id);
    return cat ? cat.name : 'Unknown';
  };

  return (
    <div className="p-4 md:p-8 lg:p-12 font-sans bg-[#f8fafc] min-h-full">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4 mt-8 md:mt-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 mb-2">Product Inventory</h1>
          <p className="text-slate-500 text-xs md:text-sm font-medium">Manage your curated collection and stock levels.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
          <button onClick={() => navigate('/seller/products/new')} className="w-full sm:w-auto shrink-0 px-6 py-2.5 text-sm font-bold bg-[#313b8e] hover:bg-[#252d70] text-white rounded-xl shadow-md transition flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-[18px]">add</span> Add New Product
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden mb-8 w-full">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-white border-b border-slate-50 text-[11px] font-black text-slate-400 uppercase tracking-widest">
              <tr>
                <th className="px-4 md:px-6 py-5">Thumbnail</th>
                <th className="px-4 md:px-6 py-5">Product Name</th>
                <th className="px-4 md:px-6 py-5">Category</th>
                <th className="px-4 md:px-6 py-5">Price</th>
                <th className="px-4 md:px-6 py-5">Stock</th>
                <th className="px-4 md:px-6 py-5">Status</th>
                <th className="px-4 md:px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm font-bold text-slate-700">
              {loading ? (
                <tr><td colSpan="7" className="text-center py-10 text-slate-400">Loading...</td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan="7" className="text-center py-10 text-slate-400">Không tìm thấy sản phẩm.</td></tr>
              ) : products.map((product) => (
                <tr key={product.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 md:px-6 py-4">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl overflow-hidden bg-slate-100 border border-slate-100">
                      {product.thumbnailUrl ? <img src={product.thumbnailUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><span className="material-symbols-outlined">image</span></div>}
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-4">
                    <p className="text-slate-900 mb-1">{product.name}</p>
                    <p className="text-[11px] text-slate-400 font-medium">SKU: PROD-{product.id}</p>
                  </td>
                  <td className="px-4 md:px-6 py-4"><span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] uppercase font-black tracking-wider">{getCategoryName(product.categoryId)}</span></td>
                  <td className="px-4 md:px-6 py-4 font-black text-slate-900">{product.price.toLocaleString()} ₫</td>
                  <td className="px-4 md:px-6 py-4">{product.stockQuantity}</td>
                  <td className="px-4 md:px-6 py-4">
                    {product.status === 'ACTIVE' && <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] uppercase font-black">ACTIVE</span>}
                    {product.status === 'INACTIVE' && <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] uppercase font-black">INACTIVE</span>}
                    {(product.status === 'OUT_OF_STOCK' || product.status === 'OUT OF STOCK') && <span className="px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-[10px] uppercase font-black">OUT OF STOCK</span>}
                    {product.status === 'DELETED' && <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-[10px] uppercase font-black">DELETED</span>}
                  </td>
                  <td className="px-4 md:px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 md:gap-2">
                      <button onClick={() => navigate(`/seller/products/${product.id}/edit`)} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition"><span className="material-symbols-outlined text-[18px]">edit</span></button>
                      <button onClick={() => handleDelete(product.id)} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"><span className="material-symbols-outlined text-[18px]">delete</span></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-[#313b8e] rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-lg shadow-indigo-900/20">
          <span className="material-symbols-outlined absolute right-[-20px] top-[-20px] text-[150px] opacity-10">trending_up</span>
          <div className="flex items-center gap-2 mb-4 text-indigo-200"><span className="material-symbols-outlined">trending_up</span><h3 className="font-bold text-sm">Sales Peak</h3></div>
          <p className="text-sm text-indigo-100 mb-6 leading-relaxed opacity-90">Keep track of your fastest moving items here.</p>
        </div>
      </div>
    </div>
  );
};
export default ProductList;
