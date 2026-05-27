import React, { useState, useEffect } from 'react';
import axiosClient from '../../utils/axiosClient';

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState('All Orders');

  useEffect(() => { fetchOrders(); }, [activeTab]);

  const fetchOrders = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      // Gọi API chuẩn: GET /api/commerce/admin/orders
      // Tuỳ biến filter status dựa vào activeTab
      const res = await axiosClient.get(`/commerce/admin/orders?limit=10`);
      setOrders(res.data.orders || []);
    } catch (error) {
      setOrders([]);
      setErrorMsg(error.message || "Không thể tải danh sách đơn hàng.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-10 font-sans bg-[#f8fafc] min-h-full flex flex-col">
      <header className="mb-6 md:mb-8 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-[#2e3785] tracking-tight mb-2">Global Order Transactions</h1>
          <p className="text-slate-500 font-medium text-xs md:text-sm">Quản lý toàn bộ giao dịch.</p>
        </div>
      </header>

      <div className="flex overflow-x-auto border-b border-slate-200 mb-6 md:mb-8 scrollbar-hide gap-6 md:gap-8">
        {['', 'PENDING', 'CONFIRMED', 'SHIPPING', 'DELIVERED', 'CANCELLED'].map((tab, i) => (
          <button 
            key={i} onClick={() => setActiveTab(tab)}
            className={`pb-3 md:pb-4 text-xs md:text-sm font-bold whitespace-nowrap transition-colors relative ${activeTab === tab ? 'text-[#2e3785]' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {tab || 'All Orders'}
            {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#2e3785] rounded-t-full"></div>}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden mb-6 md:mb-8 flex flex-col flex-1">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left whitespace-nowrap min-w-[800px]">
            <thead className="bg-white border-b border-slate-50">
              <tr>
                <th className="px-4 md:px-6 py-4 md:py-5 font-black text-[9px] md:text-[10px] uppercase tracking-widest text-slate-400">Order Code</th>
                <th className="px-4 md:px-6 py-4 md:py-5 font-black text-[9px] md:text-[10px] uppercase tracking-widest text-slate-400">Customer</th>
                <th className="px-4 md:px-6 py-4 md:py-5 font-black text-[9px] md:text-[10px] uppercase tracking-widest text-slate-400">Shop Source</th>
                <th className="px-4 md:px-6 py-4 md:py-5 font-black text-[9px] md:text-[10px] uppercase tracking-widest text-slate-400">Method</th>
                <th className="px-4 md:px-6 py-4 md:py-5 font-black text-[9px] md:text-[10px] uppercase tracking-widest text-slate-400">Total Amount</th>
                <th className="px-4 md:px-6 py-4 md:py-5 font-black text-[9px] md:text-[10px] uppercase tracking-widest text-slate-400">Status</th>
                <th className="px-4 md:px-6 py-4 md:py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan="8" className="text-center py-10 text-slate-400">Loading orders...</td></tr>
              ) : errorMsg ? (
                <tr><td colSpan="8" className="text-center py-10 text-rose-500">{errorMsg}</td></tr>
              ) : orders.map((o, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 md:px-6 py-4 font-bold text-[#2e3785] text-xs md:text-sm">#{o.orderCode}</td>
                  <td className="px-4 md:px-6 py-4">
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-slate-200 overflow-hidden text-slate-500 font-bold text-[10px] md:text-xs flex items-center justify-center shrink-0 border border-slate-100">
                        {idx % 2 === 0 ? <img src={`https://i.pravatar.cc/150?u=${idx}`} alt="" className="w-full h-full object-cover" /> : 'TD'}
                      </div>
                      <span className="font-bold text-slate-900 text-xs md:text-sm">{o.receiverName}</span>
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-4"><span className="px-2 md:px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[9px] md:text-[10px] font-black">Shop #{o.shopId}</span></td>
                  <td className="px-4 md:px-6 py-4">
                    <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm font-bold text-[#2e3785]">
                      <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${o.paymentMethod === 'VNPAY' ? 'bg-[#2e3785]' : 'bg-orange-500'}`}></div> {o.paymentMethod}
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-4 text-xs md:text-sm font-medium text-slate-500">{new Date(o.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 md:px-6 py-4 font-black text-[#2e3785] text-xs md:text-sm">{o.totalAmount.toLocaleString()} ₫</td>
                  <td className="px-4 md:px-6 py-4">
                    {o.orderStatus === 'DELIVERED' && <span className="px-2 md:px-3 py-1 bg-emerald-50 text-emerald-600 font-black text-[9px] md:text-[10px] uppercase rounded-md tracking-wider">DELIVERED</span>}
                    {o.orderStatus === 'PENDING' && <span className="px-2 md:px-3 py-1 bg-orange-50 text-orange-600 font-black text-[9px] md:text-[10px] uppercase rounded-md tracking-wider">PENDING</span>}
                    {o.orderStatus === 'CANCELLED' && <span className="px-2 md:px-3 py-1 bg-rose-50 text-rose-600 font-black text-[9px] md:text-[10px] uppercase rounded-md tracking-wider">CANCELLED</span>}
                    {!['DELIVERED', 'PENDING', 'CANCELLED'].includes(o.orderStatus) && <span className="px-2 md:px-3 py-1 bg-indigo-50 text-indigo-600 font-black text-[9px] md:text-[10px] uppercase rounded-md tracking-wider">{o.orderStatus}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL ORDER DETAIL (XEM ITEMS, RECEIVER, PAYMENT) */}
      {isModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-3xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 md:p-8 border-b border-slate-100 relative shrink-0">
              <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 bg-slate-50 p-2 rounded-full"><span className="material-symbols-outlined text-[20px]">close</span></button>
              <h2 className="text-2xl font-black text-[#2e3785] mb-1">Order #{selectedOrder.orderCode}</h2>
              <div className="flex gap-2">
                <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-black uppercase rounded">Status: {selectedOrder.orderStatus}</span>
                <span className="px-2 py-1 bg-indigo-50 text-[#2e3785] text-[10px] font-black uppercase rounded">Payment: {selectedOrder.paymentStatus} ({selectedOrder.paymentMethod})</span>
              </div>
            </div>

            <div className="p-6 md:p-8 overflow-y-auto flex-1 bg-slate-50/50">
              {detailLoading ? <p className="text-center text-slate-400 py-10">Đang tải chi tiết...</p> : (
                <div className="space-y-6">
                  <div className="bg-white p-5 rounded-2xl border border-slate-100">
                    <h3 className="font-bold text-slate-900 mb-3 border-b pb-2">Thông tin giao hàng (Receiver)</h3>
                    <p className="text-sm"><span className="font-bold">Người nhận:</span> {selectedOrder.receiverName}</p>
                    <p className="text-sm mt-1"><span className="font-bold">SĐT:</span> {selectedOrder.receiverPhone}</p>
                    <p className="text-sm mt-1"><span className="font-bold">Địa chỉ:</span> {selectedOrder.receiverAddress}</p>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                    <h3 className="font-bold text-slate-900 p-5 border-b border-slate-100">Danh sách sản phẩm (Items)</h3>
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black">
                        <tr><th className="px-5 py-3">Sản phẩm</th><th className="px-5 py-3">SL</th><th className="px-5 py-3">Đơn giá</th><th className="px-5 py-3 text-right">Tổng</th></tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {selectedOrder.items?.map((item, i) => (
                          <tr key={i}>
                            <td className="px-5 py-3 font-bold text-[#2e3785]">{item.productName}</td>
                            <td className="px-5 py-3 font-medium">x{item.quantity}</td>
                            <td className="px-5 py-3">{item.unitPrice?.toLocaleString()} ₫</td>
                            <td className="px-5 py-3 text-right font-black text-slate-900">{item.subtotal?.toLocaleString()} ₫</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="p-5 bg-slate-50 flex justify-end">
                      <div className="text-right">
                        <p className="text-xs text-slate-500 font-bold uppercase mb-1">Phí vận chuyển: {selectedOrder.shippingFee?.toLocaleString() || 0} ₫</p>
                        <p className="text-lg text-[#2e3785] font-black uppercase">Thành tiền: {selectedOrder.totalAmount?.toLocaleString()} ₫</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-white shrink-0">
              <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-xl">Đóng</button>
              {selectedOrder.orderStatus === 'PENDING' && (
                <button onClick={() => updateStatus(selectedOrder.id, 'CONFIRMED')} className="px-5 py-2.5 bg-[#2e3785] text-white text-sm font-bold rounded-xl shadow-md hover:bg-indigo-700 transition">Xác nhận đơn (Confirm)</button>
              )}
              {selectedOrder.orderStatus === 'CONFIRMED' && (
                <button onClick={() => updateStatus(selectedOrder.id, 'PROCESSING')} className="px-5 py-2.5 bg-orange-500 text-white text-sm font-bold rounded-xl shadow-md hover:bg-orange-600 transition">Đang xử lý (Processing)</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderManagement;
