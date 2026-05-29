import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const About = () => {
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
    <div className="max-w-4xl mx-auto py-12 px-6">
      
      {/* 1. Giới thiệu  */}
      <section id="intro" className="scroll-mt-32 mb-20 text-center">
        <h1 className="text-4xl md:text-5xl font-black text-[#2b3896] mb-6 font-['Be_Vietnam_Pro'] tracking-tight">Về E-Commerce Nhóm 31</h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
          Chúng tôi xây dựng một nền tảng thương mại điện tử hiện đại, kết nối người mua và người bán thông qua những công nghệ tiên tiến nhất.
        </p>
        <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=800&auto=format&fit=crop" alt="Team working" className="rounded-3xl shadow-[0_20px_50px_rgba(43,56,150,0.15)] mt-10 mx-auto" />
      </section>

      {/* 2. Tuyển dụng  */}
      <section id="careers" className="scroll-mt-32 mb-20 bg-indigo-50 p-10 rounded-3xl border border-indigo-100">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-[#2b3896] rounded-2xl flex items-center justify-center text-white shrink-0">
            <span className="material-symbols-outlined">work</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 font-['Be_Vietnam_Pro']">Tuyển dụng</h2>
        </div>
        <p className="text-gray-600 leading-relaxed mb-6">
          Gia nhập đội ngũ E-Commerce Nhóm 31 để cùng nhau kiến tạo những trải nghiệm mua sắm tuyệt vời nhất. Chúng tôi luôn tìm kiếm những tài năng đam mê công nghệ và sáng tạo.
        </p>
        <button className="px-6 py-3 bg-white text-[#2b3896] font-bold rounded-full shadow-sm hover:shadow-md transition-all">Xem vị trí đang tuyển</button>
      </section>

      {/* 3. Điều khoản */}
      <section id="terms" className="scroll-mt-32 mb-20">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">Điều khoản dịch vụ</h2>
        <div className="space-y-4 text-gray-600">
          <p><strong>1. Quy định chung:</strong> Khi sử dụng dịch vụ của E-Commerce, bạn đồng ý tuân thủ các quy tắc và chính sách cộng đồng của chúng tôi.</p>
          <p><strong>2. Quyền lợi người mua:</strong> Người mua được đảm bảo quyền lợi về đổi trả, khiếu nại nếu hàng hóa không đúng mô tả.</p>
          <p><strong>3. Trách nhiệm người bán:</strong> Người bán cam kết cung cấp hàng hóa rõ nguồn gốc, chất lượng và hỗ trợ khách hàng tận tình.</p>
        </div>
      </section>

      {/* 4. Bảo mật */}
      <section id="privacy" className="scroll-mt-32 mb-20">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">Chính sách bảo mật</h2>
        <div className="space-y-4 text-gray-600">
          <p>Bảo mật thông tin của bạn là ưu tiên hàng đầu của chúng tôi. Chúng tôi áp dụng các công nghệ mã hóa (Encryption) tiên tiến nhất để bảo vệ dữ liệu cá nhân, thông tin thanh toán và lịch sử giao dịch của bạn.</p>
          <p>E-Commerce cam kết KHÔNG chia sẻ, bán hoặc trao đổi dữ liệu của bạn cho bất kỳ bên thứ ba nào mà không có sự đồng ý rõ ràng từ phía bạn.</p>
        </div>
      </section>

    </div>
  );
};

export default About;