import React, { useState, useEffect } from 'react';
import axiosClient from '../../utils/axiosClient';

const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  
  // State Modal (Dùng chung cho Add và Edit)
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ id: null, name: '', slug: '', status: 'ACTIVE' });

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await axiosClient.get('/catalog/categories');
      const data = res?.data?.data || res?.data || res || [];
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      setCategories([]);
      setErrorMsg(error.message || "Không thể tải danh mục.");
    } finally { setLoading(false); }
  };

  const openCreateModal = () => {
    setIsEditing(false);
    setFormData({ id: null, name: '', slug: '', status: 'ACTIVE' });
    setShowModal(true);
  };

  const openEditModal = (cat) => {
    setIsEditing(true);
    setFormData({ id: cat.id, name: cat.name, slug: cat.slug, status: cat.status });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await axiosClient.put(`/catalog/categories/${formData.id}`, { name: formData.name, status: formData.status });
        alert("Cập nhật thành công!");
      } else {
        await axiosClient.post('/catalog/categories', { name: formData.name, status: formData.status });
        alert("Tạo danh mục thành công!");
      }
      setShowModal(false);
      fetchCategories();
    } catch (error) { alert("Lỗi: " + (error.response?.data?.message || 'Không thể lưu.')); }
  };

  const handleDeleteCategory = async (catId) => {
    if(!window.confirm('Xóa danh mục này? Backend có thể chặn nếu đang có sản phẩm!')) return;
    try {
      await axiosClient.delete(`/catalog/categories/${catId}`);
      alert('Đã xóa thành công!');
      fetchCategories();
    } catch (error) { alert("Lỗi khi xóa: " + (error.response?.data?.message || 'Lỗi.')); }
  };

  return (
    <div className="p-4 md:p-6 lg:p-10 font-sans bg-[#f8fafc] min-h-full flex flex-col relative">
      <header className="mb-6 md:mb-10 flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-[#2e3785] tracking-tight mb-2">Editorial Hierarchy</h1>
          <p className="text-slate-500 font-medium text-xs md:text-sm max-w-2xl">Organize your premium offerings into curated segments.</p>
        </div>
        <button onClick={openCreateModal} className="px-5 py-2.5 bg-[#2e3785] hover:bg-[#252d70] text-white text-sm font-bold rounded-xl shadow-sm transition flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-[18px]">add</span> Add New Category
        </button>
      </header>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col flex-1">
        <div className="p-6 border-b border-slate-50">
          <h2 className="text-base font-black text-[#2e3785]">Active Catalog Structure</h2>
        </div>
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left whitespace-nowrap min-w-[700px]">
            <thead className="bg-white border-b border-slate-50">
              <tr>
                <th className="px-6 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Category Name</th>
                <th className="px-6 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Slug</th>
                <th className="px-6 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Status</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? <tr><td colSpan="4" className="text-center py-10 text-slate-400">Loading...</td></tr> : errorMsg ? <tr><td colSpan="4" className="text-center py-10 text-rose-500">{errorMsg}</td></tr> : categories.map((c, idx) => (
                <tr key={c.id || idx} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4 font-bold text-[#2e3785] text-sm">{c.name}</td>
                  <td className="px-6 py-4 text-xs font-mono text-slate-500">{c.slug}</td>
                  <td className="px-6 py-4">
                    {c.status === 'ACTIVE' ? <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-full">Active</span> : <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-full">Inactive</span>}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => openEditModal(c)} className="w-8 h-8 rounded-full hover:bg-indigo-50 text-slate-400 hover:text-[#2e3785] flex items-center justify-center transition inline-flex"><span className="material-symbols-outlined text-[18px]">edit</span></button>
                    <button onClick={() => handleDeleteCategory(c.id)} className="w-8 h-8 rounded-full hover:bg-rose-50 text-slate-400 hover:text-rose-600 flex items-center justify-center transition inline-flex"><span className="material-symbols-outlined text-[18px]">delete</span></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 relative">
            <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 text-slate-400"><span className="material-symbols-outlined">close</span></button>
            <h2 className="text-2xl font-black text-slate-900 mb-6">{isEditing ? 'Edit Category' : 'Add Category'}</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-2">Category Name</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required className="w-full bg-slate-100 px-4 py-3 rounded-xl outline-none" />
              </div>
              {isEditing && (
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-2">Status</label>
                  <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full bg-slate-100 px-4 py-3 rounded-xl outline-none">
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              )}
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 text-sm font-bold text-slate-600 bg-slate-100 rounded-xl">Cancel</button>
                <button type="submit" className="px-6 py-3 bg-[#2e3785] text-white text-sm font-bold rounded-xl">{isEditing ? 'Save' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default CategoryManagement;