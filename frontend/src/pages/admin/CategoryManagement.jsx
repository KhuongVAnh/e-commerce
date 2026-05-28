import React, { useState, useEffect } from 'react';
import axiosClient from '../../utils/axiosClient';

const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newCat, setNewCat] = useState({ name: '', slug: '' });

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

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      await axiosClient.post('/catalog/categories', { name: newCat.name });
      alert("Tạo danh mục thành công!");
      setShowModal(false);
      setNewCat({ name: '', slug: '' });
      fetchCategories();
    } catch (error) { alert("Lỗi: " + (error.response?.data?.message || 'Không thể tạo.')); }
  };

  const handleDeleteCategory = async (catId) => {
    if(!window.confirm('Xóa danh mục này?')) return;
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
        <button onClick={() => setShowModal(true)} className="px-5 py-2.5 bg-[#2e3785] hover:bg-[#252d70] text-white text-sm font-bold rounded-xl shadow-sm transition flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-[18px]">add</span> Add New Category
        </button>
      </header>

      <div className="mb-6 md:mb-10 w-full sm:w-1/3">
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div><p className="text-xs font-bold text-slate-500 mb-1">Total Categories</p><div className="text-3xl md:text-4xl font-black text-[#2e3785]">{categories.length}</div></div>
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-400"><span className="material-symbols-outlined text-[32px]">category</span></div>
        </div>
      </div>

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
                <th className="px-6 py-5 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? <tr><td colSpan="4" className="text-center py-10 text-slate-400">Loading...</td></tr> : errorMsg ? <tr><td colSpan="4" className="text-center py-10 text-rose-500">{errorMsg}</td></tr> : categories.map((c, idx) => (
                <tr key={c.id || idx} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4 font-bold text-[#2e3785] text-sm">{c.name}</td>
                  <td className="px-6 py-4 text-xs font-mono text-slate-500">{c.slug}</td>
                  <td className="px-6 py-4">
                    {c.status === 'ACTIVE' ? <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-full">Active</span> : <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-full">Hidden</span>}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleDeleteCategory(c.id)} className="w-8 h-8 rounded-full hover:bg-rose-50 text-slate-400 hover:text-rose-600 flex items-center justify-center transition"><span className="material-symbols-outlined text-[18px]">delete</span></button>
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
            <h2 className="text-2xl font-black text-slate-900 mb-6">Add Category</h2>
            <form onSubmit={handleCreateCategory} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-2">Category Name</label>
                <input type="text" value={newCat.name} onChange={(e) => setNewCat({...newCat, name: e.target.value})} required className="w-full bg-slate-100 px-4 py-3 rounded-xl outline-none" />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 text-sm font-bold text-slate-600 bg-slate-100 rounded-xl">Cancel</button>
                <button type="submit" className="px-6 py-3 bg-[#2e3785] text-white text-sm font-bold rounded-xl">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default CategoryManagement;