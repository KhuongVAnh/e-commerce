import React, { useState, useEffect } from 'react';
import axiosClient from '../../utils/axiosClient';

const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ id: null, name: '', slug: '' });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await axiosClient.get('/catalog/categories');
      if (!res.data) throw new Error("API Fallback");
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

  const handleSubmit = async (e) => {
    e.preventDefault(); setIsSaving(true);
    try {
      if (isEditing) await axiosClient.put(`/catalog/categories/${formData.id}`, { name: formData.name });
      else await axiosClient.post('/catalog/categories', { name: formData.name, status: 'ACTIVE' });
      alert(isEditing ? "Cập nhật thành công!" : "Tạo mới thành công!");
    } catch (error) { alert("Lỗi: " + (error.response?.data?.message || 'Giả lập: Đã lưu.')); } 
    finally { setShowModal(false); fetchCategories(); setIsSaving(false); }
  };

  const handleDeleteCategory = async (cat) => {
    if(!window.confirm(`Bạn có chắc muốn XÓA VĨNH VIỄN danh mục "${cat.name}"?`)) return;
    try {
      await axiosClient.delete(`/catalog/categories/${cat.id}`);
      alert('Đã xóa danh mục thành công!');
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
          <p className="text-slate-500 font-medium text-xs md:text-sm max-w-2xl leading-relaxed">Quản lý danh mục sản phẩm.</p>
        </div>
        <button onClick={openCreateModal} className="px-5 py-2.5 bg-[#2e3785] hover:bg-[#252d70] text-white text-sm font-bold rounded-xl shadow-sm transition">Add New Category</button>
      </header>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col flex-1">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left whitespace-nowrap min-w-[700px]">
            <thead className="bg-white border-b border-slate-50">
              <tr>
                <th className="px-4 md:px-6 py-4 md:py-5 font-black text-[9px] md:text-[10px] uppercase tracking-widest text-slate-400">Category Name</th>
                <th className="px-4 md:px-6 py-4 md:py-5 font-black text-[9px] md:text-[10px] uppercase tracking-widest text-slate-400">Slug</th>
                <th className="px-4 md:px-6 py-4 md:py-5 font-black text-[9px] md:text-[10px] uppercase tracking-widest text-slate-400">Status</th>
                <th className="px-4 md:px-6 py-4 md:py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan="6" className="text-center py-10 text-slate-400">Loading...</td></tr>
              ) : errorMsg ? (
                <tr><td colSpan="6" className="text-center py-10 text-rose-500">{errorMsg}</td></tr>
              ) : categories.map((c, idx) => (
                <tr key={c.id || idx} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 md:px-6 py-3 md:py-4 font-bold text-[#2e3785] text-xs md:text-sm">{c.name}</td>
                  <td className="px-4 md:px-6 py-3 md:py-4 text-[11px] md:text-xs font-mono text-slate-500">/collections/{c.slug}</td>
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
                    <button onClick={() => openEditModal(c)} className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-[#2e3785] transition"><span className="material-symbols-outlined text-[16px]">edit</span></button>
                    <button onClick={() => handleDeleteCategory(c)} className="w-8 h-8 rounded-full hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition"><span className="material-symbols-outlined text-[16px]">delete</span></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 md:px-6 border-t border-slate-50 flex justify-between items-center bg-white mt-auto">
          <span className="text-[10px] md:text-[11px] font-bold text-slate-400">Showing {currentCategories.length} of {categories.length} categories</span>
          <div className="flex gap-2">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className="px-4 py-2 rounded-lg border border-slate-200 text-slate-500 font-bold text-[10px] disabled:opacity-50">Previous</button>
            <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(prev => prev + 1)} className="px-4 py-2 rounded-lg border border-[#2e3785] text-[#2e3785] font-bold text-[10px] disabled:opacity-50">Next</button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 md:p-8 relative">
              <button type="button" onClick={() => setShowModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 transition"><span className="material-symbols-outlined text-[20px]">close</span></button>
              <h2 className="text-2xl font-black text-[#2e3785] mb-1">{isEditing ? 'Edit Category' : 'Add New Category'}</h2>
              <form onSubmit={handleSubmit} className="space-y-6 mt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Category Name</label>
                    <input type="text" value={formData.name} onChange={handleNameChange} placeholder="e.g. Vintage Watches" required className="w-full bg-slate-50 border border-slate-100 px-4 py-3.5 rounded-xl text-sm outline-none font-bold text-slate-900" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">URL Slug</label>
                    <input type="text" value={`/${formData.slug}`} disabled className="w-full bg-slate-50/50 border border-slate-50 px-4 py-3.5 rounded-xl text-sm outline-none font-mono text-slate-400 cursor-not-allowed" />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button type="button" onClick={() => setShowModal(false)} className="px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition">Cancel</button>
                  <button type="submit" disabled={isSaving} className="px-6 py-3 bg-[#2e3785] text-white text-sm font-bold rounded-xl shadow-md transition disabled:opacity-70">{isSaving ? 'Saving...' : (isEditing ? 'Save' : 'Create')}</button>
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
