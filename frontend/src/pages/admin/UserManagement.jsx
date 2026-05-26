import React, { useState, useEffect } from 'react';
import axiosClient from '../../utils/axiosClient';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ q: '', role: '', status: '' });

  useEffect(() => {
    fetchUsers();
  }, [filters]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // API chuẩn: GET /api/auth/admin/users
      const queryParams = new URLSearchParams(filters).toString();
      const res = await axiosClient.get(`/auth/admin/users?${queryParams}`);
      setUsers(res.data || []);
    } catch (error) {
      // Mock data hiển thị y hệt Figma
      setUsers([
        { id: '#USR-88219', fullName: 'Linh Nguyen', email: 'linh.nguyen@merchant.vn', role: 'ADMIN', status: 'ACTIVE', avatar: 'https://i.pravatar.cc/150?u=1' },
        { id: '#USR-77312', fullName: 'Minh Tran', email: 'minh.seller@elevated.co', role: 'SELLER', status: 'ACTIVE', avatar: 'https://i.pravatar.cc/150?u=2' },
        { id: '#USR-12893', fullName: 'Quoc Bao', email: 'q.bao@gmail.com', role: 'CUSTOMER', status: 'BANNED', avatar: null },
        { id: '#USR-55401', fullName: 'Mai Anh', email: 'anh.mai@shoppe.vn', role: 'CUSTOMER', status: 'ACTIVE', avatar: 'https://i.pravatar.cc/150?u=4' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  // Logic Xóa User / Block User (Cập nhật Status)
  const handleBlockUser = async (userId, currentRole) => {
    if (!window.confirm('Bạn có chắc chắn muốn thao tác với tài khoản này?')) return;
    
    try {
      // Gọi API DELETE hoặc PATCH status (Tuỳ BE thiết kế block bằng gì)
      await axiosClient.delete(`/auth/admin/users/${userId}`);
      alert('Thao tác thành công!');
      fetchUsers();
    } catch (error) {
      // Xử lý bắt lỗi đặc thù theo yêu cầu
      if (error.response?.data?.error?.code === 'LAST_ADMIN_PROTECTED') {
        alert("LỖI HỆ THỐNG: Không thể khoá/xoá tài khoản Admin cuối cùng của hệ thống!");
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
          <p className="text-slate-500 font-medium text-xs md:text-sm max-w-2xl">
            Orchestrate your marketplace ecosystem. Manage permissions, monitor account standing, and review historical activity for all platform participants.
          </p>
        </div>
        <div className="flex gap-2 md:gap-3 w-full md:w-auto">
          <button className="flex-1 md:flex-none px-4 py-2 md:py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs md:text-sm font-bold rounded-xl transition whitespace-nowrap">Export Users</button>
          <button className="flex-1 md:flex-none px-4 py-2 md:py-2.5 bg-[#2e3785] hover:bg-[#252d70] text-white text-xs md:text-sm font-bold rounded-xl shadow-sm transition whitespace-nowrap">Create New</button>
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
            <option value="BANNED">Banned</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden mb-6 md:mb-8 flex flex-col flex-1">
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
                <tr><td colSpan="5" className="p-6 text-center text-slate-400">Loading...</td></tr>
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
                        {u.status === 'ACTIVE' ? 'Active' : 'Banned'}
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
        
        {/* Pagination */}
        <div className="p-4 border-t border-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white mt-auto">
          <span className="text-[10px] md:text-[11px] font-bold text-slate-400">Showing {users.length} users</span>
          <div className="flex gap-1">
            <button className="w-7 h-7 md:w-8 md:h-8 rounded border border-slate-200 text-slate-400 flex items-center justify-center"><span className="material-symbols-outlined text-xs md:text-sm">chevron_left</span></button>
            <button className="w-7 h-7 md:w-8 md:h-8 rounded bg-[#2e3785] text-white font-bold text-[10px] md:text-xs">1</button>
            <button className="w-7 h-7 md:w-8 md:h-8 rounded border border-slate-200 text-slate-600 font-bold text-[10px] md:text-xs hover:bg-slate-50">2</button>
            <button className="w-7 h-7 md:w-8 md:h-8 rounded border border-slate-200 text-slate-400 flex items-center justify-center"><span className="material-symbols-outlined text-xs md:text-sm">chevron_right</span></button>
          </div>
        </div>
      </div>

      {/* Bottom Insights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mt-auto">
        <div className="bg-[#2e3785] p-6 md:p-8 rounded-3xl text-white relative overflow-hidden shadow-lg sm:col-span-2 lg:col-span-1">
          <h3 className="text-indigo-200 font-bold text-[9px] md:text-[10px] uppercase tracking-widest mb-3 md:mb-4">Growth Performance</h3>
          <div className="text-3xl md:text-4xl font-black tracking-tighter mb-1 md:mb-2">+12.4% <span className="text-sm md:text-lg font-medium text-indigo-200">this month</span></div>
          <p className="text-xs md:text-sm text-indigo-100/80 pr-6 md:pr-10">Organic user acquisition continues to exceed quarterly targets.</p>
          <span className="material-symbols-outlined absolute right-[-10px] bottom-[-10px] text-[100px] md:text-[120px] opacity-10 pointer-events-none">trending_up</span>
        </div>
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center mb-3 md:mb-4"><span className="material-symbols-outlined text-sm md:text-base">storefront</span></div>
            <div className="text-2xl md:text-3xl font-black text-slate-900 mb-1">482</div>
            <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Sellers</p>
          </div>
          <div className="text-[9px] md:text-[10px] font-bold text-emerald-600 flex items-center gap-1 mt-4 md:mt-6"><span className="material-symbols-outlined text-[10px] md:text-[12px]">arrow_upward</span> 3 new today</div>
        </div>
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 md:mb-4"><span className="material-symbols-outlined text-sm md:text-base">verified_user</span></div>
            <div className="text-2xl md:text-3xl font-black text-slate-900 mb-1">1.2k</div>
            <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Verified Identity</p>
          </div>
          <div className="text-[9px] md:text-[10px] font-bold text-blue-600 mt-4 md:mt-6">98% compliance</div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;