import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const Help = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    } else {
      window.scrollTo(0, 0);
    }
  }, [location]);

  return (
    <div className="max-w-3xl mx-auto py-12 px-6 font-['Inter']">
      <div className="text-center mb-16">
        <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="material-symbols-outlined text-[#2b3896] text-4xl">support_agent</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-4 tracking-tight">Trung Tâm Hỗ Trợ</h1>
        <p className="text-gray-500 font-medium">Chúng tôi ở đây để hỗ trợ bạn giải quyết mọi vấn đề.</p>
      </div>

      {/* 1. FAQ */}
      <section id="faq" className="scroll-mt-32 mb-16 bg-white rounded-3xl shadow-[0px_12px_32px_rgba(43,56,150,0.04)] border border-gray-100 overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-xl font-bold text-[#2b3896]">Câu Hỏi Thường Gặp (FAQ)</h2>
        </div>
        <div className="divide-y divide-gray-100 p-8 space-y-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-start gap-2">
              <span className="text-[#2b3896]">Q:</span> Làm thế nào để mở gian hàng?
            </h3>
            <p className="text-gray-600 leading-relaxed flex items-start gap-2">
              <span className="font-bold text-gray-400">A:</span> Bạn chỉ cần đăng xuất, sau đó đăng ký một tài khoản với vai trò "Người bán".
            </p>
          </div>
          <div className="pt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-start gap-2">
              <span className="text-[#2b3896]">Q:</span> Hệ thống hỗ trợ những phương thức thanh toán nào?
            </h3>
            <p className="text-gray-600 leading-relaxed flex items-start gap-2">
              <span className="font-bold text-gray-400">A:</span> Chúng tôi hỗ trợ Thanh toán khi nhận hàng (COD) và Thanh toán trực tuyến an toàn qua cổng VNPay.
            </p>
          </div>
        </div>
      </section>

      {/* 2. Vận chuyển */}
      <section id="shipping" className="scroll-mt-32 mb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
          <span className="material-symbols-outlined text-[#2b3896]">local_shipping</span> 
          Chính sách vận chuyển
        </h2>
        <div className="bg-gray-50 p-6 rounded-2xl text-gray-600 space-y-3">
          <p>- <strong>Nội thành:</strong> Nhận hàng trong 1-2 ngày làm việc.</p>
          <p>- <strong>Ngoại thành & Tỉnh khác:</strong> Nhận hàng từ 3-5 ngày làm việc.</p>
          <p>- Dịch vụ vận chuyển nhanh và tiết kiệm chi phí.</p>
        </div>
      </section>

      {/* 3. Trả hàng */}
      <section id="returns" className="scroll-mt-32 mb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
          <span className="material-symbols-outlined text-[#2b3896]">assignment_return</span> 
          Trả hàng & Hoàn tiền
        </h2>
        <p className="text-gray-600 leading-relaxed">
          Khách hàng có thể yêu cầu trả hàng/hoàn tiền trong vòng <strong>7 ngày</strong> kể từ khi nhận được sản phẩm nếu hàng bị lỗi, hư hỏng trong quá trình vận chuyển hoặc không đúng mô tả của Người bán. Vui lòng giữ nguyên tem mác và quay video lúc mở hộp.
        </p>
      </section>

      {/* 4. Liên hệ */}
      <section id="contact" className="scroll-mt-32 mt-12 text-center p-8 bg-gradient-to-br from-[#2b3896] to-[#4551af] rounded-3xl text-white shadow-xl shadow-[#2b3896]/20">
        <h2 className="text-2xl font-bold mb-4">Liên hệ với chúng tôi</h2>
        <p className="mb-8 opacity-80">Đừng ngần ngại gửi email nếu bạn cần hỗ trợ bất cứ điều gì.</p>
        <div className="flex flex-col md:flex-row justify-center gap-4">
          <a href="mailto:support@nhom31.com" className="px-8 py-3 bg-white text-[#2b3896] font-bold rounded-full hover:scale-105 transition-transform shadow-md flex items-center justify-center gap-2">
            <span className="material-symbols-outlined">mail</span> Email: support@nhom31.com
          </a>
          <button className="px-8 py-3 bg-indigo-900 text-white font-bold rounded-full hover:bg-indigo-800 transition-colors flex items-center justify-center gap-2 border border-indigo-400">
            <span className="material-symbols-outlined">call</span> Hotline: 1900 6868
          </button>
        </div>
      </section>
    </div>
  );
};

export default Help;