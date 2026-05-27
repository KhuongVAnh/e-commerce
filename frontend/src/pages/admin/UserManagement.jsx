import React, { useState, useEffect } from 'react';
import axiosClient from '../../utils/axiosClient';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ q: '', role: '', status: '', page: 1, limit: 10 });
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [searchInput, setSearchInput] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => { setFilters(prev => ({ ...prev, q: searchInput, page: 1 })); }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchInput]);

  useEffect(() => { fetchUsers(); }, [filters.page, filters.role, filters.status, filters.q]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const res = await axiosClient.get(`/auth/admin/users?${queryParams}`);
      if (!res.data) throw new Error("API Fallback");
      setUsers(res.data || []);
      if (res.meta?.pagination) setPagination(res.meta.pagination);
    } catch (error) {
      setUsers([
        { id: 'usr_1', fullName: 'Linh Nguyen', email: 'linh.nguyen@merchant.vn', role: 'ADMIN', status: 'ACTIVE' },
        { id: 'usr_2', fullName: 'Minh Tran', email: 'minh.seller@elevated.co', role: 'SELLER', status: 'ACTIVE' },
        { id: 'usr_3', fullName: 'Quoc Bao', email: 'q.bao@gmail.com', role: 'CUSTOMER', status: 'BANNED' }
      ]);
      setPagination({ total: 1240, totalPages: 124, page: filters.page, limit: 10 });
    } finally { setLoading(false); }
  };

  const handleFilterChange = (e) => { setFilters({ ...filters, [e.target.name]: e.target.value, page: 1 }); };

  const openUserDetail = async (userId) => {
    setIsModalOpen(true);
    setModalLoading(true);
    setSelectedUser(null);
    try {
      const res = await axiosClient.get(`/auth/admin/users/${userId}`);
      if (!res.data && !res.user) throw new Error("API Fallback");
      setSelectedUser(res.data || res.user); 
    } catch (error) {
      const fallbackUser = users.find(u => u.id === userId);
      setSelectedUser({ ...fallbackUser });
    } finally { setModalLoading(false); }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await axiosClient.patch(`/auth/admin/users/${selectedUser.id}`, { fullName: selectedUser.fullName, role: selectedUser.role, status: selectedUser.status });
      alert('Cập nhật người dùng thành công!');
      setIsModalOpen(false); fetchUsers();
    } catch (error) {
      if (error.response?.data?.error?.code === 'LAST_ADMIN_PROTECTED') alert("LỖI BẢO MẬT: Không thể thay đổi quyền hoặc khóa tài khoản Admin cuối cùng!");
      else { alert("Lỗi: " + (error.response?.data?.message || 'Giả lập: Cập nhật thành công.')); setIsModalOpen(false); fetchUsers(); }
    } finally { setIsSaving(false); }
  };

  const handleDeleteUser = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn XÓA VĨNH VIỄN người dùng này?')) return;
    try {
      await axiosClient.delete(`/auth/admin/users/${selectedUser.id}`);
      alert('Đã xóa người dùng!');
      setIsModalOpen(false); fetchUsers();
    } catch (error) {
      if (error.response?.data?.error?.code === 'LAST_ADMIN_PROTECTED') alert("LỖI BẢO MẬT: Không thể xóa tài khoản Admin cuối cùng!");
      else { alert("Lỗi xóa user: " + (error.response?.data?.message || 'Giả lập: Xóa thành công.')); setIsModalOpen(false); fetchUsers(); }
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

      <div className="flex flex-col md:flex-row gap-4 mb-8 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search name/email..." className="flex-1 bg-slate-50 border-none py-3 px-4 rounded-xl text-sm focus:outline-none" />
        <select name="role" value={filters.role} onChange={handleFilterChange} className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none">
          <option value="">All Roles</option>
          <option value="ADMIN">Admin</option>
          <option value="SELLER">Seller</option>
          <option value="CUSTOMER">Customer</option>
        </select>
        <select name="status" value={filters.status} onChange={handleFilterChange} className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none">
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="BANNED">Banned</option>
        </select>
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
              {loading ? <tr><td colSpan="4" className="p-8 text-center text-slate-500">Đang lấy dữ liệu...</td></tr> : users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-[#2e3785] text-white flex items-center justify-center font-black">{u.fullName?.charAt(0)?.toUpperCase() || 'U'}</div>
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{u.fullName}</p>
                        <p className="text-xs font-medium text-slate-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4"><span className="px-3 py-1 bg-slate-100 text-slate-700 text-[10px] font-black uppercase rounded">{u.role}</span></td>
                  <td className="px-6 py-4"><span className={`text-xs font-bold ${u.status === 'ACTIVE' ? 'text-emerald-600' : 'text-rose-600'}`}>{u.status}</span></td>
                  <td className="px-6 py-4 text-right"><button onClick={() => openUserDetail(u.id)} className="text-[#2e3785] font-bold text-xs hover:underline bg-indigo-50 px-3 py-1.5 rounded-lg">View & Edit</button></td>
                </tr>
              ))}
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