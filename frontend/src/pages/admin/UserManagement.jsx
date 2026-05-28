import React, { useState, useEffect, useCallback } from 'react';
import axiosClient from '../../utils/axiosClient';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [stats, setStats] = useState({ total: 0, sellers: 0, admin: 0 });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await axiosClient.get(`/auth/admin/users`);
      const data = res?.data?.users || res?.users || res?.data || [];
      const userList = Array.isArray(data) ? data : [];
      setUsers(userList);
      
      // Tự động map stats
      setStats({
        total: userList.length,
        sellers: userList.filter(u => u.role === 'SELLER').length,
        admin: userList.filter(u => u.role === 'ADMIN').length
      });

    } catch (error) {
      setUsers([]);
      setErrorMsg(error.message || "Không thể tải danh sách người dùng.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleBlockUser = async (userId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa tài khoản này?')) return;
    try {
      await axiosClient.delete(`/auth/admin/users/${userId}`);
      alert('Đã xóa thành công!');
      fetchUsers();
    } catch (error) {
      if (error.response?.data?.error?.code === 'LAST_ADMIN_PROTECTED') {
        alert("LỖI BẢO MẬT: Không thể khoá/xoá tài khoản Admin cuối cùng của hệ thống!");
      } else {
        alert("Lỗi: " + (error.response?.data?.message || 'Không thể thao tác.'));
      }
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-10 font-sans bg-[#f8fafc] min-h-full flex flex-col">
      <header className="mb-6 md:mb-8 flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-[#2e3785] tracking-tight mb-2">User Directory</h1>
          <p className="text-slate-500 font-medium text-xs md:text-sm max-w-2xl">Quản lý người dùng và quyền truy cập.</p>
        </div>
      </header>

      {/* TỰ ĐỘNG LẤY TỪ API */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mt-4 mb-8">
        <div className="bg-[#2e3785] p-6 md:p-8 rounded-3xl text-white relative overflow-hidden shadow-lg sm:col-span-2 lg:col-span-1">
          <h3 className="text-indigo-200 font-bold text-[9px] md:text-[10px] uppercase tracking-widest mb-3">Total Users</h3>
          <div className="text-3xl md:text-4xl font-black tracking-tighter mb-1">{stats.total}</div>
        </div>
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <h3 className="text-slate-400 font-bold text-[9px] md:text-[10px] uppercase tracking-widest mb-1">Sellers</h3>
          <div className="text-2xl md:text-3xl font-black text-slate-900">{stats.sellers}</div>
        </div>
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <h3 className="text-slate-400 font-bold text-[9px] md:text-[10px] uppercase tracking-widest mb-1">Admins</h3>
          <div className="text-2xl md:text-3xl font-black text-slate-900">{stats.admin}</div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden mb-6 flex flex-col flex-1">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left whitespace-nowrap min-w-[700px]">
            <thead className="bg-white border-b border-slate-50">
              <tr>
                <th className="px-4 md:px-6 py-4 md:py-5 font-black text-[9px] md:text-[10px] uppercase tracking-widest text-slate-400">User Identity</th>
                <th className="px-4 md:px-6 py-4 md:py-5 font-black text-[9px] md:text-[10px] uppercase tracking-widest text-slate-400">Role</th>
                <th className="px-4 md:px-6 py-4 md:py-5 font-black text-[9px] md:text-[10px] uppercase tracking-widest text-slate-400">Status</th>
                <th className="px-4 md:px-6 py-4 md:py-5 font-black text-[9px] md:text-[10px] uppercase tracking-widest text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan="4" className="p-6 text-center text-slate-400">Loading...</td></tr>
              ) : errorMsg ? (
                <tr><td colSpan="4" className="p-6 text-center text-rose-500">{errorMsg}</td></tr>
              ) : users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 md:px-6 py-3 md:py-4">
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-slate-400">person</span>
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-xs md:text-sm">{u.fullName}</p>
                        <p className="text-[10px] md:text-[11px] font-medium text-slate-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-3 md:py-4">
                    <span className="px-2 md:px-3 py-1 bg-slate-100 text-slate-600 text-[8px] md:text-[9px] font-black uppercase rounded">{u.role}</span>
                  </td>
                  <td className="px-4 md:px-6 py-3 md:py-4">
                    <div className={`flex items-center gap-1.5 text-[11px] md:text-xs font-bold ${u.status === 'ACTIVE' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${u.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                      {u.status}
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-3 md:py-4 text-right">
                    <button onClick={() => handleBlockUser(u.id)} className="w-7 h-7 md:w-8 md:h-8 rounded-full hover:bg-rose-50 hover:text-rose-600 flex items-center justify-center transition" title="Delete">
                      <span className="material-symbols-outlined text-[14px] md:text-[16px]">delete</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;