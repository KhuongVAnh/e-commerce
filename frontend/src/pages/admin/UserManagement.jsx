import React, { useState, useEffect, useCallback } from 'react';
import axiosClient from '../../utils/axiosClient';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Phân trang & Lọc
  const [filters, setFilters] = useState({ q: '', role: '', status: '' });
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  
  // Stats (Lấy thật từ API limit=1)
  const [stats, setStats] = useState({ total: 0, sellers: 0, admins: 0 });

  // State Modal Cập nhật
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const queryParams = new URLSearchParams();
      if (filters.q) queryParams.append('q', filters.q);
      if (filters.role) queryParams.append('role', filters.role);
      if (filters.status) queryParams.append('status', filters.status);
      queryParams.append('page', pagination.page);
      queryParams.append('limit', pagination.limit);

      const res = await axiosClient.get(`/auth/admin/users?${queryParams.toString()}`);
      
      // Bóc tách an toàn
      const data = res?.data?.users || res?.users || res?.data || [];
      setUsers(Array.isArray(data) ? data : []);
      
      const metaPag = res?.data?.pagination || res?.pagination || res?.meta?.pagination;
      if (metaPag) {
        setPagination(prev => ({ ...prev, total: metaPag.total || 0, totalPages: metaPag.totalPages || 1 }));
      }
    } catch (error) {
      setUsers([]);
      setErrorMsg(error.response?.data?.message || "Không thể tải danh sách người dùng.");
    } finally { setLoading(false); }
  }, [filters, pagination.page, pagination.limit]);

  // Lấy tổng số liệu thực tế toàn hệ thống bằng thủ thuật limit=1
  const fetchStats = useCallback(async () => {
    try {
      const [allRes, sellerRes, adminRes] = await Promise.allSettled([
        axiosClient.get('/auth/admin/users?limit=1'),
        axiosClient.get('/auth/admin/users?role=SELLER&limit=1'),
        axiosClient.get('/auth/admin/users?role=ADMIN&limit=1')
      ]);

      const getTotal = (res) => res.status === 'fulfilled' ? (res.value?.data?.pagination?.total || res.value?.pagination?.total || 0) : 0;

      setStats({
        total: getTotal(allRes),
        sellers: getTotal(sellerRes),
        admins: getTotal(adminRes)
      });
    } catch (error) { console.warn("Không thể tải Stats:", error); }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => { fetchStats(); }, [fetchStats]); // Chỉ chạy 1 lần khi load hoặc có thay đổi lớn

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
    setPagination(prev => ({ ...prev, page: 1 })); // Reset về trang 1 khi lọc
  };

  const openEditModal = async (userId) => {
    setIsModalOpen(true);
    setSelectedUser(null);
    try {
      const res = await axiosClient.get(`/auth/admin/users/${userId}`);
      setSelectedUser(res?.data?.user || res?.user || res?.data);
    } catch (error) {
      alert("Lỗi tải chi tiết: " + (error.response?.data?.message || error.message));
      setIsModalOpen(false);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await axiosClient.patch(`/auth/admin/users/${selectedUser.id}`, {
        fullName: selectedUser.fullName,
        role: selectedUser.role,
        status: selectedUser.status
      });
      alert('Cập nhật người dùng thành công!');
      setIsModalOpen(false);
      fetchUsers();
      fetchStats(); // Update lại cục Stats lỡ có đổi Role
    } catch (error) {
      if (error.response?.data?.error?.code === 'LAST_ADMIN_PROTECTED') {
        alert("LỖI BẢO MẬT: Không thể thay đổi quyền hoặc khóa tài khoản Admin cuối cùng!");
      } else {
        alert("Lỗi: " + (error.response?.data?.message || 'Không thể cập nhật.'));
      }
    } finally { setIsSaving(false); }
  };

  const handleBlockUser = async (userId) => {
    if (!window.confirm('Bạn có chắc chắn muốn khóa (Block) tài khoản này?')) return;
    try {
      // API DELETE sẽ set status thành BLOCKED theo PDF
      await axiosClient.delete(`/auth/admin/users/${userId}`);
      alert('Đã khóa tài khoản thành công!');
      fetchUsers();
    } catch (error) {
      if (error.response?.data?.error?.code === 'LAST_ADMIN_PROTECTED') {
        alert("LỖI BẢO MẬT: Không thể khóa tài khoản Admin cuối cùng của hệ thống!");
      } else {
        alert("Lỗi: " + (error.response?.data?.message || 'Không thể thao tác.'));
      }
    }
  };

  // Logic sinh ra các nút trang (1, 2, 3...)
  const getVisiblePages = () => {
    let start = Math.max(1, pagination.page - 1);
    let end = Math.min(pagination.totalPages, pagination.page + 1);
    if (pagination.page === 1) end = Math.min(pagination.totalPages, 3);
    if (pagination.page === pagination.totalPages) start = Math.max(1, pagination.totalPages - 2);
    
    const pages = [];
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  return (
    <div className="p-4 md:p-6 lg:p-10 font-sans bg-[#f8fafc] min-h-full flex flex-col">
      <header className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-[#2e3785] tracking-tight mb-2">User Directory</h1>
        <p className="text-slate-500 font-medium text-xs md:text-sm max-w-2xl">
          Orchestrate your marketplace ecosystem. Manage permissions and monitor account standing.
        </p>
      </header>

      {/* FILTER BAR */}
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
          <select name="role" onChange={handleFilterChange} className="w-1/2 md:w-auto px-3 md:px-4 py-2.5 md:py-3 bg-slate-50 text-slate-700 text-xs md:text-sm font-bold rounded-xl outline-none">
            <option value="">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="SELLER">Seller</option>
            <option value="CUSTOMER">Customer</option>
          </select>
          <select name="status" onChange={handleFilterChange} className="w-1/2 md:w-auto px-3 md:px-4 py-2.5 md:py-3 bg-slate-50 text-slate-700 text-xs md:text-sm font-bold rounded-xl outline-none">
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="BLOCKED">Blocked</option>
          </select>
        </div>
      </div>

      {/* BẢNG DỮ LIỆU */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden mb-6 flex flex-col flex-1">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left whitespace-nowrap min-w-[700px]">
            <thead className="bg-white border-b border-slate-50">
              <tr>
                <th className="px-4 md:px-6 py-4 md:py-5 font-black text-[9px] md:text-[10px] uppercase tracking-widest text-slate-400">User ID</th>
                <th className="px-4 md:px-6 py-4 md:py-5 font-black text-[9px] md:text-[10px] uppercase tracking-widest text-slate-400">User Identity</th>
                <th className="px-4 md:px-6 py-4 md:py-5 font-black text-[9px] md:text-[10px] uppercase tracking-widest text-slate-400">Platform Role</th>
                <th className="px-4 md:px-6 py-4 md:py-5 font-black text-[9px] md:text-[10px] uppercase tracking-widest text-slate-400">Current Status</th>
                <th className="px-4 md:px-6 py-4 md:py-5 font-black text-[9px] md:text-[10px] uppercase tracking-widest text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan="5" className="p-6 text-center text-slate-400">Loading data...</td></tr>
              ) : errorMsg ? (
                <tr><td colSpan="5" className="p-6 text-center text-rose-500">{errorMsg}</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan="5" className="p-6 text-center text-slate-400">Không tìm thấy người dùng.</td></tr>
              ) : users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 md:px-6 py-3 md:py-4 text-[11px] md:text-xs font-bold text-slate-400">#USR-{u.id}</td>
                  <td className="px-4 md:px-6 py-3 md:py-4">
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                        <span className="font-black text-[#2e3785]">{u.fullName?.charAt(0) || 'U'}</span>
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
                      {u.status === 'ACTIVE' ? 'Active' : u.status === 'BLOCKED' ? 'Banned' : 'Inactive'}
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-3 md:py-4 text-right">
                    <div className="flex justify-end gap-1 md:gap-2">
                      <button onClick={() => openEditModal(u.id)} className="w-7 h-7 md:w-8 md:h-8 rounded-full text-slate-400 hover:bg-slate-100 hover:text-[#2e3785] flex items-center justify-center transition" title="Edit User">
                        <span className="material-symbols-outlined text-[14px] md:text-[16px]">edit</span>
                      </button>
                      <button onClick={() => handleBlockUser(u.id)} className="w-7 h-7 md:w-8 md:h-8 rounded-full text-slate-400 hover:bg-rose-50 hover:text-rose-600 flex items-center justify-center transition" title="Block User">
                        <span className="material-symbols-outlined text-[14px] md:text-[16px]">lock</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* PHÂN TRANG THỰC TẾ */}
        <div className="p-4 md:p-6 border-t border-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white mt-auto">
          <span className="text-[10px] md:text-[11px] font-bold text-slate-400">
            Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
          </span>
          <div className="flex gap-1">
            <button 
              disabled={pagination.page <= 1} 
              onClick={() => setPagination({...pagination, page: pagination.page - 1})} 
              className="w-7 h-7 md:w-8 md:h-8 rounded border border-slate-200 text-slate-400 flex items-center justify-center disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-xs md:text-sm">chevron_left</span>
            </button>
            
            {getVisiblePages().map(p => (
              <button 
                key={p} 
                onClick={() => setPagination({...pagination, page: p})}
                className={`w-7 h-7 md:w-8 md:h-8 rounded text-[10px] md:text-xs font-bold transition-colors ${
                  pagination.page === p ? 'bg-[#2e3785] text-white shadow-sm' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {p}
              </button>
            ))}

            <button 
              disabled={pagination.page >= pagination.totalPages} 
              onClick={() => setPagination({...pagination, page: pagination.page + 1})} 
              className="w-7 h-7 md:w-8 md:h-8 rounded border border-slate-200 text-slate-400 flex items-center justify-center disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-xs md:text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* THỐNG KÊ THẬT (Thay thế cục giao diện lỗi logic) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mt-auto">
        <div className="bg-[#2e3785] p-6 md:p-8 rounded-3xl text-white relative overflow-hidden shadow-lg flex flex-col justify-center">
          <h3 className="text-indigo-200 font-bold text-[9px] md:text-[10px] uppercase tracking-widest mb-2">Total System Users</h3>
          <div className="text-3xl md:text-4xl font-black tracking-tighter">{stats.total.toLocaleString()}</div>
          <span className="material-symbols-outlined absolute right-[-10px] bottom-[-10px] text-[80px] opacity-10 pointer-events-none">public</span>
        </div>
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-center">
          <h3 className="text-slate-400 font-bold text-[9px] md:text-[10px] uppercase tracking-widest mb-2">Active Sellers</h3>
          <div className="text-3xl md:text-4xl font-black text-slate-900">{stats.sellers.toLocaleString()}</div>
        </div>
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-center">
          <h3 className="text-slate-400 font-bold text-[9px] md:text-[10px] uppercase tracking-widest mb-2">Verified Admins</h3>
          <div className="text-3xl md:text-4xl font-black text-slate-900">{stats.admins.toLocaleString()}</div>
        </div>
      </div>

      {/* MODAL CẬP NHẬT USER */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 md:p-8 relative">
              <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 transition"><span className="material-symbols-outlined">close</span></button>
              <h2 className="text-2xl font-black text-slate-900 mb-6">User Configuration</h2>
              
              {!selectedUser ? (
                <div className="py-10 text-center text-slate-500 font-medium">Đang lấy dữ liệu an toàn...</div>
              ) : (
                <form onSubmit={handleUpdateUser} className="space-y-5">
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-widest text-slate-500 mb-2">Email Address</label>
                    <input type="text" value={selectedUser.email} disabled className="w-full bg-slate-100 border-none px-4 py-3.5 rounded-xl text-sm text-slate-500 cursor-not-allowed font-medium" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-widest text-slate-500 mb-2">Full Name</label>
                    <input type="text" value={selectedUser.fullName} onChange={(e) => setSelectedUser({...selectedUser, fullName: e.target.value})} required className="w-full bg-slate-50 border border-slate-200 px-4 py-3.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#2e3785]/20 font-bold text-slate-900" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-black uppercase tracking-widest text-slate-500 mb-2">Platform Role</label>
                      <select value={selectedUser.role} onChange={(e) => setSelectedUser({...selectedUser, role: e.target.value})} className="w-full bg-slate-50 border border-slate-200 px-4 py-3.5 rounded-xl text-sm outline-none font-bold text-slate-700">
                        <option value="CUSTOMER">Customer</option><option value="SELLER">Seller</option><option value="ADMIN">Admin</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-black uppercase tracking-widest text-slate-500 mb-2">Account Status</label>
                      <select value={selectedUser.status} onChange={(e) => setSelectedUser({...selectedUser, status: e.target.value})} className="w-full bg-slate-50 border border-slate-200 px-4 py-3.5 rounded-xl text-sm outline-none font-bold text-slate-700">
                        <option value="ACTIVE">ACTIVE</option><option value="INACTIVE">INACTIVE</option><option value="BLOCKED">BLOCKED</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 mt-2">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-3 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition">Cancel</button>
                    <button type="submit" disabled={isSaving} className="px-6 py-3 bg-[#2e3785] hover:bg-[#252d70] text-white text-sm font-bold rounded-xl shadow-md transition disabled:opacity-70 flex items-center gap-2">
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
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