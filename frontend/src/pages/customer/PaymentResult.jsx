import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import axiosClient from '../../utils/axiosClient';

const PaymentResult = () => {
  const location = useLocation();
  const [status, setStatus] = useState(() => location.search ? 'loading' : 'failed');
  const [orderCode] = useState(() => sessionStorage.getItem('currentOrderCode'));

  useEffect(() => {
    const searchParams = location.search;

    if (!searchParams) {
        return;
    }

    const checkPayment = async () => {
      try {
        const res = await axiosClient.get(`/commerce/payments/check-result${searchParams}`);
        const resultData = res.data ?? res;

        if (resultData?.result) {
          const { isPaid, isFailed, isPending } = resultData.result;
          
          if (isPaid) setStatus('success');
          else if (isFailed) setStatus('failed');
          else if (isPending) setStatus('pending');
          else setStatus('failed');
        } else {
            setStatus('failed');
        }
      } catch (error) {
        console.error('Lỗi khi kiểm tra thanh toán VNPay:', error);
        setStatus('failed');
      }
    };

    checkPayment();
  }, [location.search]);

  // ĐANG KIỂM TRA CHỮ KÝ BẢO MẬT
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#f9f9fc] flex flex-col items-center justify-center px-4">
        <span className="material-symbols-outlined animate-spin text-6xl text-[#2b3896] mb-6">autorenew</span>
        <h2 className="text-2xl font-bold text-gray-900 mb-2 font-['Be_Vietnam_Pro']">Đang xử lý thanh toán</h2>
        <p className="text-gray-500 text-center max-w-md">Vui lòng không đóng trình duyệt. Hệ thống đang đồng bộ kết quả giao dịch từ ngân hàng một cách bảo mật...</p>
      </div>
    );
  }

  // THANH TOÁN THÀNH CÔNG
  if (status === 'success') {
    return (
      <div className="min-h-screen bg-[#f9f9fc] flex items-center justify-center px-4 py-24">
        <div className="bg-white p-10 md:p-14 rounded-3xl shadow-[0px_12px_32px_rgba(43,56,150,0.06)] max-w-lg w-full text-center border border-gray-100">
          <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
            <span className="material-symbols-outlined text-5xl text-emerald-600" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-4 font-['Be_Vietnam_Pro']">Thanh toán thành công!</h1>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Tuyệt vời! Giao dịch của bạn đã được xác nhận. {orderCode && <span>Mã đơn hàng của bạn là <strong className="text-gray-900">#{orderCode}</strong>.</span>}
          </p>
          <div className="flex flex-col gap-4">
            <Link to="/orders" className="w-full bg-[#2b3896] text-white font-bold py-4 rounded-xl hover:bg-[#1f2970] active:scale-95 transition-all shadow-md">
              Xem chi tiết đơn hàng
            </Link>
            <Link to="/" className="w-full bg-gray-50 text-gray-700 font-bold py-4 rounded-xl hover:bg-gray-100 active:scale-95 transition-all">
              Tiếp tục mua sắm
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // KẾT QUẢ CHƯA ĐỒNG BỘ
  if (status === 'pending') {
    return (
      <div className="min-h-screen bg-[#f9f9fc] flex items-center justify-center px-4 py-24">
        <div className="bg-white p-10 md:p-14 rounded-3xl shadow-[0px_12px_32px_rgba(43,56,150,0.06)] max-w-lg w-full text-center border border-gray-100">
          <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
            <span className="material-symbols-outlined text-5xl text-amber-600" style={{ fontVariationSettings: "'FILL' 1" }}>hourglass_top</span>
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-4 font-['Be_Vietnam_Pro']">Đang xác nhận thanh toán</h1>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Giao dịch đã được gửi về hệ thống nhưng ngân hàng/VNPay có thể cần thêm thời gian để đồng bộ. Đơn hàng {orderCode ? `#${orderCode}` : ''} vẫn đang chờ xác nhận thanh toán.
          </p>
          <div className="flex flex-col gap-4">
            <Link to="/orders" className="w-full bg-[#2b3896] text-white font-bold py-4 rounded-xl hover:bg-[#1f2970] active:scale-95 transition-all shadow-md">
              Kiểm tra đơn hàng
            </Link>
            <Link to="/" className="w-full bg-gray-50 text-gray-700 font-bold py-4 rounded-xl hover:bg-gray-100 active:scale-95 transition-all">
              Tiếp tục mua sắm
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // THANH TOÁN THẤT BẠI
  return (
    <div className="min-h-screen bg-[#f9f9fc] flex items-center justify-center px-4 py-24">
      <div className="bg-white p-10 md:p-14 rounded-3xl shadow-[0px_12px_32px_rgba(43,56,150,0.06)] max-w-lg w-full text-center border border-gray-100">
        <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
          <span className="material-symbols-outlined text-5xl text-red-600" style={{ fontVariationSettings: "'FILL' 1" }}>cancel</span>
        </div>
        <h1 className="text-3xl font-black text-gray-900 mb-4 font-['Be_Vietnam_Pro']">Thanh toán thất bại</h1>
        <p className="text-gray-600 mb-8 leading-relaxed">
          Rất tiếc, giao dịch của bạn đã bị hủy hoặc xảy ra lỗi từ phía ngân hàng. Đơn hàng {orderCode ? `#${orderCode}` : ''} hiện đang ở trạng thái chờ thanh toán.
        </p>
        <div className="flex flex-col gap-4">
          <Link to="/orders" className="w-full bg-[#2b3896] text-white font-bold py-4 rounded-xl hover:bg-[#1f2970] active:scale-95 transition-all shadow-md">
            Kiểm tra đơn hàng
          </Link>
          <Link to="/cart" className="w-full bg-gray-50 text-gray-700 font-bold py-4 rounded-xl hover:bg-gray-100 active:scale-95 transition-all">
            Quay lại giỏ hàng
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentResult;
