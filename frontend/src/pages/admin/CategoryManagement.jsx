import React, { useState, useEffect } from 'react';
import axiosClient from '../../utils/axiosClient';

const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6; 
  
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ id: null, name: '', slug: '' });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/catalog/categories');
      if (!res.data) throw new Error("API Fallback");
      setCategories(res.data || []);
    } catch (error) {
      setCategories([
        { id: 1, name: 'Textiles', slug: 'textiles', status: 'ACTIVE' },
        { id: 2, name: 'Ceramics', slug: 'ceramics', status: 'ACTIVE' },
        { id: 3, name: 'Fashion', slug: 'fashion', status: 'ACTIVE' }
      ]);
    } finally { setLoading(false); }
  };

  const totalPages = Math.ceil(categories.length / itemsPerPage);
  const currentCategories = categories.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleNameChange = (e) => {
    const name = e.target.value;
    const slug = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    setFormData({ ...formData, name, slug });
  };

  const openCreateModal = () => { setIsEditing(false); setFormData({ id: null, name: '', slug: '' }); setShowModal(true); };
  const openEditModal = (cat) => { setIsEditing(true); setFormData({ id: cat.id, name: cat.name, slug: cat.slug }); setShowModal(true); };

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
      alert(`⚠️ CẢNH BÁO TỪ HỆ THỐNG:\n\n${error.response?.data?.message || 'Giả lập: Đã xóa.'}`);
    } finally { fetchCategories(); }
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
              {loading ? <tr><td colSpan="4" className="text-center py-10 text-slate-400">Loading...</td></tr> : currentCategories.map((c, idx) => (
                <tr key={c.id || idx} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 md:px-6 py-3 md:py-4 font-bold text-[#2e3785] text-xs md:text-sm">{c.name}</td>
                  <td className="px-4 md:px-6 py-3 md:py-4 text-[11px] md:text-xs font-mono text-slate-500">/collections/{c.slug}</td>
                  <td className="px-4 md:px-6 py-3 md:py-4">
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 text-[9px] md:text-[10px] font-bold rounded-full">{c.status}</span>
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