import React, { useState, useEffect, useCallback } from 'react';
import axiosClient from '../../utils/axiosClient';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [filters, setFilters] = useState({ q: '', role: '', status: '' });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const res = await axiosClient.get(`/auth/admin/users?${queryParams}`);
      setUsers(res.data.users || []);
    } catch (error) {
      setUsers([]);
      setErrorMsg(error.message || "Không thể tải danh sách người dùng.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  // Logic Xóa User / Block User (Cập nhật Status)
  const handleBlockUser = async (userId) => {
    if (!window.confirm('Bạn có chắc chắn muốn thao tác với tài khoản này?')) return;
    
    try {
      // Gọi API DELETE hoặc PATCH status (Tuỳ BE thiết kế block bằng gì)
      await axiosClient.delete(`/auth/admin/users/${userId}`);
      alert('Thao tác thành công!');
      fetchUsers();
    } catch (error) {
      // Xử lý bắt lỗi đặc thù theo yêu cầu
      if (error.error?.code === 'LAST_ADMIN_PROTECTED') {
        alert("LỖI HỆ THỐNG: Không thể khoá/xoá tài khoản Admin cuối cùng của hệ thống!");
      } else {
        alert("Lỗi: " + (error.message || 'Không thể thao tác.'));
      }
    }
  };

  return (
    <div className="p-6 md:p-10 font-sans bg-[#f8fafc] min-h-full flex flex-col relative">
      <header className="mb-8 flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#2e3785] tracking-tight mb-2">User Directory</h1>
          <p className="text-slate-500 font-medium text-sm">Quản lý người dùng hệ thống.</p>
        </div>
      </header>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-3 md:gap-4 mb-6 md:mb-8 bg-white p-3 md:p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
          <input 
            type="text" name="q" value={filters.q} onChange={handleFilterChange}
            placeholder="Filter by name or email address..." 
            className="w-full bg-slate-50 border-none py-2.5 md:py-3 pl-10 md:pl-11 pr-4 rounded-xl text-xs md:text-sm focus:ring-2 focus:ring-[#2e3785]/20 outline-none" 
          />
        </div>
        <div className="flex gap-3 md:gap-4">
          <select name="role" onChange={handleFilterChange} className="w-1/2 md:w-auto px-3 md:px-4 py-2.5 md:py-3 bg-slate-50 border border-slate-100 text-slate-700 text-xs md:text-sm font-bold rounded-xl outline-none appearance-none">
            <option value="">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="SELLER">Seller</option>
            <option value="CUSTOMER">Customer</option>
          </select>
          <select name="status" onChange={handleFilterChange} className="w-1/2 md:w-auto px-3 md:px-4 py-2.5 md:py-3 bg-slate-50 border border-slate-100 text-slate-700 text-xs md:text-sm font-bold rounded-xl outline-none appearance-none">
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="BLOCKED">Blocked</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col flex-1">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">User Details</th>
                <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Role</th>
                <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Status</th>
                <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan="5" className="p-6 text-center text-slate-400">Loading...</td></tr>
              ) : errorMsg ? (
                <tr><td colSpan="5" className="p-6 text-center text-rose-500">{errorMsg}</td></tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 md:px-6 py-3 md:py-4 text-[11px] md:text-xs font-bold text-slate-400">{u.id}</td>
                    <td className="px-4 md:px-6 py-3 md:py-4">
                      <div className="flex items-center gap-3 md:gap-4">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center shrink-0">
                          {u.avatar ? <img src={u.avatar} alt="" className="w-full h-full object-cover" /> : <span className="material-symbols-outlined text-slate-400 text-sm md:text-base">person</span>}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-xs md:text-sm">{u.fullName}</p>
                          <p className="text-[10px] md:text-[11px] font-medium text-slate-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-3 md:py-4">
                      {u.role === 'ADMIN' && <span className="px-2 md:px-3 py-1 bg-indigo-50 text-indigo-700 text-[8px] md:text-[9px] font-black uppercase tracking-wider rounded border border-indigo-100">ADMIN</span>}
                      {u.role === 'SELLER' && <span className="px-2 md:px-3 py-1 bg-orange-50 text-orange-700 text-[8px] md:text-[9px] font-black uppercase tracking-wider rounded border border-orange-100">SELLER</span>}
                      {u.role === 'CUSTOMER' && <span className="px-2 md:px-3 py-1 bg-slate-100 text-slate-600 text-[8px] md:text-[9px] font-black uppercase tracking-wider rounded border border-slate-200">CUSTOMER</span>}
                    </td>
                    <td className="px-4 md:px-6 py-3 md:py-4">
                      <div className={`flex items-center gap-1.5 text-[11px] md:text-xs font-bold ${u.status === 'ACTIVE' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${u.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                        {u.status === 'ACTIVE' ? 'Active' : u.status === 'BLOCKED' ? 'Blocked' : 'Inactive'}
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-3 md:py-4 text-right">
                      <div className="flex justify-end gap-1 md:gap-2 text-slate-400">
                        <button onClick={() => handleBlockUser(u.id, u.role)} className="w-7 h-7 md:w-8 md:h-8 rounded-full hover:bg-slate-100 hover:text-rose-600 flex items-center justify-center transition" title="Block/Delete">
                          <span className="material-symbols-outlined text-[14px] md:text-[16px]">lock</span>
                        </button>
                        <button className="w-7 h-7 md:w-8 md:h-8 rounded-full hover:bg-slate-100 hover:text-[#2e3785] flex items-center justify-center transition" title="View History">
                          <span className="material-symbols-outlined text-[14px] md:text-[16px]">history</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-slate-100 flex justify-between items-center bg-white mt-auto">
          <span className="text-xs font-bold text-slate-400">Page {filters.page} of {pagination.totalPages || 1}</span>
          <div className="flex gap-2">
            <button disabled={filters.page <= 1} onClick={() => setFilters({ ...filters, page: filters.page - 1 })} className="px-3 py-1.5 rounded bg-slate-100 disabled:opacity-50 text-sm font-bold text-slate-600">Prev</button>
            <button disabled={filters.page >= (pagination.totalPages || 1)} onClick={() => setFilters({ ...filters, page: filters.page + 1 })} className="px-3 py-1.5 rounded bg-slate-100 disabled:opacity-50 text-sm font-bold text-slate-600">Next</button>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden">
            <div className="p-6 relative">
              <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-slate-400"><span className="material-symbols-outlined">close</span></button>
              <h2 className="text-2xl font-black text-slate-900 mb-6">User Config</h2>
              {modalLoading ? <div className="py-10 text-center text-slate-500">Đang lấy dữ liệu user từ server...</div> : selectedUser && (
                <form onSubmit={handleUpdateUser} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Email (Read-only)</label>
                    <input type="text" value={selectedUser.email} disabled className="w-full bg-slate-100 border-none p-3 rounded-xl text-sm text-slate-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Full Name</label>
                    <input type="text" value={selectedUser.fullName} onChange={(e) => setSelectedUser({...selectedUser, fullName: e.target.value})} required className="w-full bg-white border border-slate-200 p-3 rounded-xl text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Role</label>
                      <select value={selectedUser.role} onChange={(e) => setSelectedUser({...selectedUser, role: e.target.value})} className="w-full bg-white border border-slate-200 p-3 rounded-xl text-sm">
                        <option value="CUSTOMER">Customer</option><option value="SELLER">Seller</option><option value="ADMIN">Admin</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Status</label>
                      <select value={selectedUser.status} onChange={(e) => setSelectedUser({...selectedUser, status: e.target.value})} className="w-full bg-white border border-slate-200 p-3 rounded-xl text-sm">
                        <option value="ACTIVE">ACTIVE</option><option value="BANNED">BANNED</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-6 border-t mt-4">
                    <button type="button" onClick={handleDeleteUser} className="text-rose-500 text-sm font-bold">Xóa User</button>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 rounded-lg">Hủy</button>
                      <button type="submit" disabled={isSaving} className="px-4 py-2 bg-[#2e3785] text-white text-sm font-bold rounded-lg">{isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default UserManagement;
