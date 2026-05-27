import React, { useState, useEffect } from 'react';
import axiosClient from '../../utils/axiosClient';

const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  
  // State quản lý Modal thêm mới
  const [showModal, setShowModal] = useState(false);
  const [newCat, setNewCat] = useState({ name: '', slug: '' });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      // API chuẩn: GET /api/catalog/categories
      const res = await axiosClient.get('/catalog/categories');
      setCategories(res.data || []);
    } catch (error) {
      setCategories([]);
      setErrorMsg(error.message || "Không thể tải danh mục.");
    } finally { setLoading(false); }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      await axiosClient.post('/catalog/categories', { name: newCat.name });
      alert("Tạo danh mục thành công!");
      setShowModal(false);
      setNewCat({ name: '', slug: '' });
      fetchCategories();
    } catch (error) {
      alert("Lỗi: " + (error.message || 'Không thể tạo danh mục.'));
    }
  };

  const handleDeleteCategory = async (catId, productCount) => {
    // Xử lý chặn xoá ngay ở FE nếu thấy có product (tối ưu UX)
    if (productCount > 0) {
      alert(`CẢNH BÁO: Không thể xóa danh mục này vì đang có ${productCount} sản phẩm trực thuộc. Vui lòng chuyển sản phẩm sang danh mục khác trước!`);
      return;
    }
    
    if(!window.confirm('Bạn có chắc muốn xóa danh mục này?')) return;
    
    try {
      await axiosClient.delete(`/catalog/categories/${catId}`);
      alert('Đã xóa thành công!');
      fetchCategories();
    } catch (error) {
      // Bắt lỗi từ BE trả về (ví dụ BE check thấy vẫn còn product ẩn)
      alert("Lỗi khi xóa: " + (error.message || 'Có lỗi hệ thống.'));
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-10 font-sans bg-[#f8fafc] min-h-full flex flex-col relative">
      <header className="mb-6 md:mb-10 flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-[#2e3785] tracking-tight mb-2">Editorial Hierarchy</h1>
          <p className="text-slate-500 font-medium text-xs md:text-sm max-w-2xl leading-relaxed">
            Organize your premium offerings into curated segments. Use the editorial focus to guide customer discovery journeys.
          </p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:hidden lg:block lg:w-64">
             <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
             <input type="text" placeholder="Search categories..." className="w-full bg-white border border-slate-200 py-2.5 pl-10 pr-4 rounded-xl text-sm outline-none" />
          </div>
          <button onClick={() => setShowModal(true)} className="flex-1 lg:flex-none px-5 py-2.5 bg-[#2e3785] hover:bg-[#252d70] text-white text-sm font-bold rounded-xl shadow-sm transition flex items-center justify-center gap-2 whitespace-nowrap">
            <span className="material-symbols-outlined text-[18px]">add</span> Add New Category
          </button>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-10">
        <div className="bg-white p-6 md:p-8 rounded-2xl md:rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] md:text-xs font-bold text-slate-500 mb-1">Total Categories</p>
            <div className="text-3xl md:text-4xl font-black text-[#2e3785]">24</div>
          </div>
          <div className="w-12 h-12 md:w-16 md:h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-400"><span className="material-symbols-outlined text-[24px] md:text-[32px]">category</span></div>
        </div>
        <div className="bg-white p-6 md:p-8 rounded-2xl md:rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] md:text-xs font-bold text-slate-500 mb-1">Most Popular</p>
            <div className="text-2xl md:text-3xl font-black text-orange-900">Textiles</div>
          </div>
          <div className="w-12 h-12 md:w-16 md:h-16 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-400"><span className="material-symbols-outlined text-[24px] md:text-[32px]">trending_up</span></div>
        </div>
        <div className="bg-white p-6 md:p-8 rounded-2xl md:rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] md:text-xs font-bold text-slate-500 mb-1">Empty Categories</p>
            <div className="text-3xl md:text-4xl font-black text-slate-900">2</div>
          </div>
          <div className="w-12 h-12 md:w-16 md:h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400"><span className="material-symbols-outlined text-[24px] md:text-[32px]">inbox</span></div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col flex-1">
        <div className="p-4 md:p-6 border-b border-slate-50 flex justify-between items-center">
          <h2 className="text-sm md:text-base font-black text-[#2e3785]">Active Catalog Structure</h2>
          <div className="flex gap-2">
            <button className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-500 flex items-center justify-center transition"><span className="material-symbols-outlined text-[18px]">filter_list</span></button>
            <button className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-500 flex items-center justify-center transition"><span className="material-symbols-outlined text-[18px]">download</span></button>
          </div>
        </div>
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left whitespace-nowrap min-w-[700px]">
            <thead className="bg-white border-b border-slate-50">
              <tr>
                <th className="px-4 md:px-6 py-4 md:py-5 font-black text-[9px] md:text-[10px] uppercase tracking-widest text-slate-400">Preview</th>
                <th className="px-4 md:px-6 py-4 md:py-5 font-black text-[9px] md:text-[10px] uppercase tracking-widest text-slate-400">Category Name</th>
                <th className="px-4 md:px-6 py-4 md:py-5 font-black text-[9px] md:text-[10px] uppercase tracking-widest text-slate-400">Slug</th>
                <th className="px-4 md:px-6 py-4 md:py-5 font-black text-[9px] md:text-[10px] uppercase tracking-widest text-slate-400">Product Count</th>
                <th className="px-4 md:px-6 py-4 md:py-5 font-black text-[9px] md:text-[10px] uppercase tracking-widest text-slate-400">Status</th>
                <th className="px-4 md:px-6 py-4 md:py-5 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan="6" className="text-center py-10 text-slate-400">Loading...</td></tr>
              ) : errorMsg ? (
                <tr><td colSpan="6" className="text-center py-10 text-rose-500">{errorMsg}</td></tr>
              ) : categories.map((c, idx) => (
                <tr key={c.id || idx} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 md:px-6 py-3 md:py-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden">
                      <img src={`https://picsum.photos/seed/${c.name}/100`} alt="" className="w-full h-full object-cover" />
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-3 md:py-4 font-bold text-[#2e3785] text-xs md:text-sm">{c.name}</td>
                  <td className="px-4 md:px-6 py-3 md:py-4 text-[11px] md:text-xs font-mono text-slate-500">{c.slug}</td>
                  <td className="px-4 md:px-6 py-3 md:py-4">
                    <p className="font-black text-slate-900 text-xs md:text-sm">{c.productCount ?? 0}</p>
                    <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase">Products</p>
                  </td>
                  <td className="px-4 md:px-6 py-3 md:py-4">
                    {c.status === 'ACTIVE' && (c.productCount ?? 0) > 0 && <span className="px-3 py-1 bg-emerald-50 border border-emerald-100 text-emerald-600 text-[9px] md:text-[10px] font-bold rounded-full">Active</span>}
                    {c.status === 'INACTIVE' && <span className="px-3 py-1 bg-slate-100 border border-slate-200 text-slate-500 text-[9px] md:text-[10px] font-bold rounded-full">Hidden</span>}
                    {(c.productCount ?? 0) === 0 && <span className="px-3 py-1 bg-rose-50 border border-rose-100 text-rose-500 text-[9px] md:text-[10px] font-bold rounded-full">Empty</span>}
                  </td>
                  <td className="px-4 md:px-6 py-3 md:py-4 text-right">
                    <div className="flex justify-end gap-1 md:gap-2">
                      <button className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-[#2e3785] flex items-center justify-center transition"><span className="material-symbols-outlined text-[16px] md:text-[18px]">edit</span></button>
                      <button onClick={() => handleDeleteCategory(c.id, c.productCount)} className="w-8 h-8 rounded-full hover:bg-rose-50 text-slate-400 hover:text-rose-600 flex items-center justify-center transition"><span className="material-symbols-outlined text-[16px] md:text-[18px]">delete</span></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-4 md:px-6 border-t border-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white mt-auto">
          <span className="text-[10px] md:text-[11px] font-bold text-slate-400">Showing 6 of 24 categories</span>
          <div className="flex gap-2">
            <button className="px-4 py-2 rounded-lg border border-slate-200 text-slate-400 font-bold text-[10px] md:text-xs">Previous</button>
            <button className="px-4 py-2 rounded-lg border border-[#2e3785] text-[#2e3785] hover:bg-indigo-50 font-bold text-[10px] md:text-xs transition">Next Page</button>
          </div>
        </div>
      </div>

      {/* MODAL THÊM CATEGORY (Ảnh 5) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 md:p-8 relative">
              <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-900"><span className="material-symbols-outlined">close</span></button>
              <h2 className="text-2xl font-black text-slate-900 mb-1">Add New Category</h2>
              <p className="text-sm text-slate-500 font-medium mb-8">Define a new collection for your marketplace.</p>

              <form onSubmit={handleCreateCategory} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Category Name</label>
                    <input type="text" value={newCat.name} onChange={(e) => setNewCat({...newCat, name: e.target.value})} placeholder="e.g. Vintage Watches" required className="w-full bg-slate-100 border-none px-4 py-3.5 rounded-xl text-sm focus:ring-2 focus:ring-[#2e3785]/20 outline-none font-medium" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">URL Slug</label>
                    <input type="text" value={newCat.slug} onChange={(e) => setNewCat({...newCat, slug: e.target.value})} placeholder="/vintage-watches" className="w-full bg-slate-100/50 border-none px-4 py-3.5 rounded-xl text-sm focus:outline-none text-slate-400 font-mono" />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Category Icon</label>
                  <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition cursor-pointer">
                    <div className="w-12 h-12 bg-indigo-50 text-[#2e3785] rounded-full flex items-center justify-center mb-3"><span className="material-symbols-outlined">cloud_upload</span></div>
                    <p className="text-sm font-bold text-slate-900 mb-1">Click or drag to upload</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">PNG, JPG, SVG up to 2MB</p>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition">Cancel</button>
                  <button type="submit" className="px-6 py-3 bg-[#2e3785] hover:bg-[#252d70] text-white text-sm font-bold rounded-xl shadow-md transition">Create Category</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManagement;
