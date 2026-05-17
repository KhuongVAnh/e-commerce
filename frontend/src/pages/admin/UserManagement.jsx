import React from 'react';

const UserManagement = () => {
  // Mock data vì API Users chưa có trong tài liệu
  const users = [
    { id: 'USR-001', name: 'Nguyễn Văn Admin', email: 'admin@elevated.com', role: 'ADMIN', status: 'ACTIVE' },
    { id: 'USR-002', name: 'Trần Thị Seller', email: 'seller@silk.com', role: 'SELLER', status: 'ACTIVE' },
    { id: 'USR-003', name: 'Lê Khách Hàng', email: 'customer@gmail.com', role: 'CUSTOMER', status: 'INACTIVE' },
  ];

  return (
    <div className="p-6 md:p-10 font-sans bg-[#f8fafc] min-h-full">
      <header className="mb-10">
        <h1 className="text-3xl md:text-4xl font-black text-[#2e3785] tracking-tight mb-2">User Directory</h1>
        <p className="text-slate-500 font-medium text-sm">Comprehensive account auditing and role-based access control.</p>
      </header>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-lg font-black text-slate-900">All Accounts</h2>
          <button className="bg-[#2e3785] text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-[#252d70]">Add User</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">User ID</th>
                <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Name</th>
                <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Email</th>
                <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Role</th>
                <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm font-bold text-[#2e3785]">{u.id}</td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-900">{u.name}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{u.email}</td>
                  <td className="px-6 py-4"><span className="px-2 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-black rounded">{u.role}</span></td>
                  <td className="px-6 py-4"><span className={`px-2 py-1 text-[10px] font-black rounded ${u.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{u.status}</span></td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-slate-400 hover:text-[#2e3785]"><span className="material-symbols-outlined text-[18px]">edit</span></button>
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