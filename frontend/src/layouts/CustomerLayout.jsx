import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';

const CustomerLayout = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen font-body">
      
      {/* 1. TOP NAVIGATION BAR */}
      <header className="sticky top-0 w-full z-50 bg-white/80 backdrop-blur-xl shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
          <Link to="/" className="text-2xl font-bold tracking-tighter text-[#2b3896] font-headline">
            E-commerce
          </Link>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <form onSubmit={handleSearch} className="relative w-full">
              <input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface-container-highest border-none rounded-full px-6 py-2 text-sm focus:ring-2 focus:ring-[#2b3896]/20 transition-all outline-none" 
                placeholder="Tìm kiếm sản phẩm..." 
                type="text" 
              />
              <button type="submit" className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-[#2b3896] cursor-pointer bg-transparent border-none">
                search
              </button>
            </form>
          </div>

          {/* Action Cluster */}
          <div className="flex items-center gap-6">
            <nav className="hidden md:flex items-center gap-8">
              <Link to="/" className="text-[#2b3896] font-semibold border-b-2 border-[#2b3896] transition-colors duration-200">Home</Link>
              <Link to="/products" className="text-slate-600 font-medium hover:text-[#2b3896] transition-colors duration-200">Shop</Link>
              <Link to="/categories" className="text-slate-600 font-medium hover:text-[#2b3896] transition-colors duration-200">Categories</Link>
            </nav>
            <div className="flex items-center gap-4">
              <Link to="/cart" className="relative cursor-pointer hover:opacity-70 active:scale-95 transition-all">
                <span className="material-symbols-outlined text-[#2b3896]">shopping_bag</span>
                <span className="absolute -top-2 -right-2 bg-[#2b3896] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">3</span>
              </Link>
              <Link to="/profile" className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary-container cursor-pointer hover:opacity-70 active:scale-95 transition-all bg-gray-200 flex items-center justify-center">
                <span className="material-symbols-outlined text-gray-500">person</span>
              </Link>
            </div>
          </div>
        </div>
        <div className="bg-slate-200 h-[1px] w-full"></div>
      </header>

      {/* 2. MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-6 pb-24 md:pb-12 mt-8">
        <Outlet />
      </main>

      {/* 3. FOOTER */}
      <footer className="bg-slate-900 text-slate-300 py-12 md:py-16 border-t border-slate-800 font-body">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          
          {/* Cột 1: Thông tin thương hiệu */}
          <div className="space-y-4">
            <Link to="/" className="text-2xl font-bold tracking-tighter text-white font-headline">
              E-commerce
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed pr-4">
              Khám phá bộ sưu tập đồ công nghệ và thời trang cao cấp được tuyển chọn kỹ lưỡng dành riêng cho bạn.
            </p>
          </div>

          {/* Cột 2: Chăm sóc khách hàng */}
          <div>
            <h3 className="text-white font-semibold mb-6 uppercase tracking-wider text-sm">Chăm sóc khách hàng</h3>
            <ul className="space-y-3 text-sm">
              <li><Link to="/help" className="hover:text-white transition-colors">Trung tâm trợ giúp</Link></li>
              <li><Link to="/shipping" className="hover:text-white transition-colors">Chính sách vận chuyển</Link></li>
              <li><Link to="/returns" className="hover:text-white transition-colors">Trả hàng & Hoàn tiền</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">Liên hệ với chúng tôi</Link></li>
            </ul>
          </div>

          {/* Cột 3: Về chúng tôi */}
          <div>
            <h3 className="text-white font-semibold mb-6 uppercase tracking-wider text-sm">Về thương hiệu</h3>
            <ul className="space-y-3 text-sm">
              <li><Link to="/about" className="hover:text-white transition-colors">Giới thiệu về chúng tôi</Link></li>
              <li><Link to="/careers" className="hover:text-white transition-colors">Tuyển dụng</Link></li>
              <li><Link to="/terms" className="hover:text-white transition-colors">Điều khoản dịch vụ</Link></li>
              <li><Link to="/privacy" className="hover:text-white transition-colors">Chính sách bảo mật</Link></li>
            </ul>
          </div>

          {/* Cột 4: Thanh toán & Kết nối */}
          <div>
            <h3 className="text-white font-semibold mb-6 uppercase tracking-wider text-sm">Thanh toán an toàn</h3>
            <div className="flex gap-3 mb-8">
              {/* Nút VNPay giả lập */}
              <div className="w-14 h-8 bg-white rounded flex items-center justify-center text-xs font-extrabold text-blue-800 border border-slate-700">
                VNPAY
              </div>
              {/* Nút COD giả lập */}
              <div className="w-14 h-8 bg-white rounded flex items-center justify-center text-xs font-extrabold text-gray-800 border border-slate-700">
                COD
              </div>
            </div>
            
            <h3 className="text-white font-semibold mb-4 uppercase tracking-wider text-sm">Kết nối</h3>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-[#2b3896] hover:text-white transition-colors">
                 <span className="material-symbols-outlined text-xl">share</span>
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-[#2b3896] hover:text-white transition-colors">
                 <span className="material-symbols-outlined text-xl">mail</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bản quyền */}
        <div className="max-w-7xl mx-auto px-6 mt-12 pt-8 border-t border-slate-800 text-sm text-center text-slate-500 flex flex-col md:flex-row justify-between items-center gap-4">
          <p>&copy; 2026 E-Commerce. Mọi quyền được bảo lưu.</p>
          <p>Dự án E-Commerce - Nhóm 26</p>
        </div>
      </footer>

      {/* 4. MOBILE NAVIGATION BAR */}

      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pt-3 pb-8 md:hidden bg-white/90 backdrop-blur-2xl shadow-[0_-4px_20px_rgba(43,56,150,0.08)] border-t border-slate-100">
        <Link to="/" className="flex flex-col items-center justify-center bg-indigo-50 text-[#2b3896] rounded-xl px-4 py-1.5 active:scale-90 duration-150">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
          <span className="text-[11px] font-medium font-body mt-1">Home</span>
        </Link>
        <Link to="/categories" className="flex flex-col items-center justify-center text-slate-500 hover:bg-slate-50 rounded-xl px-4 py-1.5">
          <span className="material-symbols-outlined">grid_view</span>
          <span className="text-[11px] font-medium font-body mt-1">Danh mục</span>
        </Link>
        <Link to="/saved" className="flex flex-col items-center justify-center text-slate-500 hover:bg-slate-50 rounded-xl px-4 py-1.5">
          <span className="material-symbols-outlined">favorite</span>
          <span className="text-[11px] font-medium font-body mt-1">Đã lưu</span>
        </Link>
        <Link to="/cart" className="flex flex-col items-center justify-center text-slate-500 hover:bg-slate-50 rounded-xl px-4 py-1.5">
          <span className="material-symbols-outlined">shopping_cart</span>
          <span className="text-[11px] font-medium font-body mt-1">Giỏ hàng</span>
        </Link>
      </nav>

    </div>
  );
};

export default CustomerLayout;