import { Link, useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  return (
    <>
      {/* 1. HERO BANNER */}
      <section className="mt-4 mb-12">
        <div className="relative overflow-hidden rounded-[2rem] bg-[#2b3896] text-white min-h-[480px] flex items-center">
          <div className="absolute inset-0 opacity-60">
            <img 
              className="w-full h-full object-cover" 
              src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1999&auto=format&fit=crop" 
              alt="Luxury Watch" 
            />
          </div>
          <div className="relative z-10 px-8 md:px-24 max-w-2xl">
            <span className="inline-block px-4 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold tracking-widest uppercase mb-6">
              New Collection 2026
            </span>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter leading-tight mb-6 font-headline">
              Đẳng Cấp Thời Thượng.
            </h1>
            <p className="text-lg md:text-xl text-indigo-100 mb-8 font-body opacity-90">
              Khám phá bộ sưu tập đồ công nghệ và thời trang cao cấp được tuyển chọn kỹ lưỡng dành riêng cho bạn.
            </p>
            <button className="bg-gradient-to-br from-[#2b3896] to-[#4551af] px-8 py-4 rounded-full font-bold text-lg hover:scale-105 transition-transform active:scale-95 shadow-lg">
              Mua Sắm Ngay
            </button>
          </div>
        </div>
      </section>

      {/* 2. CATEGORY BAR */}
      <section className="mb-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 font-headline">Danh Mục Nổi Bật</h2>
          <Link to="/categories" className="text-sm font-semibold text-[#2b3896] hover:underline">Xem tất cả</Link>
        </div>
        
        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-2 px-2">
          {[
            { icon: 'devices', name: 'Điện tử' },
            { icon: 'apparel', name: 'Thời trang' },
            { icon: 'content_cut', name: 'Làm đẹp' },
            { icon: 'chair', name: 'Nội thất' },
            { icon: 'local_mall', name: 'Tạp hóa' },
            { icon: 'fitness_center', name: 'Thể thao' },
            { icon: 'toys', name: 'Đồ chơi' }
          ].map((cat, index) => (
            
            <div 
              key={index} 
              onClick={() => navigate(`/products?category=${encodeURIComponent(cat.name)}`)}
              className="flex-shrink-0 flex flex-col items-center gap-3 group cursor-pointer"
            >
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-[#2b3896] group-hover:text-white transition-all duration-300">
                <span className="material-symbols-outlined text-3xl">{cat.icon}</span>
              </div>
              <span className="text-xs font-semibold tracking-wide text-gray-700">{cat.name}</span>
            </div>

          ))}
        </div>
      </section>

      {/* 3. PRODUCT GRID */}
      <section>
        <div className="flex items-baseline justify-between mb-10">
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 font-headline">Khám Phá Sản Phẩm</h2>
          <div className="flex gap-4 hidden md:flex">
            <button className="px-4 py-2 rounded-full bg-gray-200 text-sm font-medium text-gray-900">Bán chạy</button>
            <button className="px-4 py-2 rounded-full text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors">Mới nhất</button>
          </div>
        </div>

        {/* Lưới sản phẩm */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* SẢN PHẨM 1 */}
          <div className="group flex flex-col bg-white rounded-[2rem] overflow-hidden shadow-[0px_12px_32px_rgba(43,56,150,0.06)] hover:-translate-y-2 transition-all duration-300 border border-gray-50">
            <div className="relative aspect-square overflow-hidden bg-gray-100">
              <img className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80" alt="Tai nghe" />
              <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center text-[#2b3896] shadow-sm hover:bg-red-50 hover:text-red-500 transition-colors">
                <span className="material-symbols-outlined">favorite</span>
              </button>
            </div>
            <div className="p-6 flex flex-col flex-1">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Audio Excellence</span>
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm text-yellow-500" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="text-xs font-bold text-gray-700">4.8</span>
                </div>
              </div>
              <h3 className="text-lg font-bold mb-4 line-clamp-2 leading-snug text-gray-900">Tai nghe Wireless Studio Pro Max – Midnight Black</h3>
              <div className="mt-auto flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-500 font-medium">Official Store</span>
                  <p className="text-xl font-extrabold text-[#2b3896] mt-1">4.500.000<span className="text-xs font-medium align-top ml-0.5">₫</span></p>
                </div>
                <button className="w-10 h-10 rounded-xl bg-[#2b3896] text-white flex items-center justify-center active:scale-90 transition-transform">
                  <span className="material-symbols-outlined">add_shopping_cart</span>
                </button>
              </div>
            </div>
          </div>

          {/* SẢN PHẨM 2 */}
          <div className="group flex flex-col bg-white rounded-[2rem] overflow-hidden shadow-[0px_12px_32px_rgba(43,56,150,0.06)] hover:-translate-y-2 transition-all duration-300 border border-gray-50">
            <div className="relative aspect-square overflow-hidden bg-gray-100">
              <img className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" src="https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500&q=80" alt="Laptop" />
              <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center text-[#2b3896] shadow-sm hover:bg-red-50 hover:text-red-500 transition-colors">
                <span className="material-symbols-outlined">favorite</span>
              </button>
              <div className="absolute bottom-4 left-4 px-3 py-1 bg-[#6c3400] text-white text-[10px] font-bold rounded-lg uppercase">Sale 15%</div>
            </div>
            <div className="p-6 flex flex-col flex-1">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Computing</span>
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm text-yellow-500" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="text-xs font-bold text-gray-700">4.9</span>
                </div>
              </div>
              <h3 className="text-lg font-bold mb-4 line-clamp-2 leading-snug text-gray-900">Laptop ZenBook 14 - Titanium Gray Edition</h3>
              <div className="mt-auto flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-500 font-medium">Tech Center</span>
                  <p className="text-xl font-extrabold text-[#8f4700] mt-1">28.900.000<span className="text-xs font-medium align-top ml-0.5">₫</span></p>
                </div>
                <button className="w-10 h-10 rounded-xl bg-[#2b3896] text-white flex items-center justify-center active:scale-90 transition-transform">
                  <span className="material-symbols-outlined">add_shopping_cart</span>
                </button>
              </div>
            </div>
          </div>

          {/* SẢN PHẨM 3 */}
          <div className="group flex flex-col bg-white rounded-[2rem] overflow-hidden shadow-[0px_12px_32px_rgba(43,56,150,0.06)] hover:-translate-y-2 transition-all duration-300 border border-gray-50">
            <div className="relative aspect-square overflow-hidden bg-gray-100">
              <img className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80" alt="Giày chạy bộ" />
              <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center text-[#2b3896] shadow-sm hover:bg-red-50 hover:text-red-500 transition-colors">
                <span className="material-symbols-outlined">favorite</span>
              </button>
            </div>
            <div className="p-6 flex flex-col flex-1">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Sportswear</span>
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm text-yellow-500" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="text-xs font-bold text-gray-700">4.5</span>
                </div>
              </div>
              <h3 className="text-lg font-bold mb-4 line-clamp-2 leading-snug text-gray-900">Giày Chạy Bộ Performance X1 - Crimson Red</h3>
              <div className="mt-auto flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-500 font-medium">Official Store</span>
                  <p className="text-xl font-extrabold text-[#2b3896] mt-1">2.250.000<span className="text-xs font-medium align-top ml-0.5">₫</span></p>
                </div>
                <button className="w-10 h-10 rounded-xl bg-[#2b3896] text-white flex items-center justify-center active:scale-90 transition-transform">
                  <span className="material-symbols-outlined">add_shopping_cart</span>
                </button>
              </div>
            </div>
          </div>

          {/* SẢN PHẨM 4 */}
          <div className="group flex flex-col bg-white rounded-[2rem] overflow-hidden shadow-[0px_12px_32px_rgba(43,56,150,0.06)] hover:-translate-y-2 transition-all duration-300 border border-gray-50">
            <div className="relative aspect-square overflow-hidden bg-gray-100">
              <img className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" src="https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=500&q=80" alt="Kính mát" />
              <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center text-[#2b3896] shadow-sm hover:bg-red-50 hover:text-red-500 transition-colors">
                <span className="material-symbols-outlined">favorite</span>
              </button>
            </div>
            <div className="p-6 flex flex-col flex-1">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Accessories</span>
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm text-yellow-500" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="text-xs font-bold text-gray-700">4.7</span>
                </div>
              </div>
              <h3 className="text-lg font-bold mb-4 line-clamp-2 leading-snug text-gray-900">Kính Mát Phi Công Classic Gold - Limited</h3>
              <div className="mt-auto flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-500 font-medium">Luxury Vision</span>
                  <p className="text-xl font-extrabold text-[#2b3896] mt-1">1.800.000<span className="text-xs font-medium align-top ml-0.5">₫</span></p>
                </div>
                <button className="w-10 h-10 rounded-xl bg-[#2b3896] text-white flex items-center justify-center active:scale-90 transition-transform">
                  <span className="material-symbols-outlined">add_shopping_cart</span>
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* --- KHU VỰC PHÂN TRANG --- */}
        <div className="flex justify-center items-center gap-2 mt-12 font-body">
          <button className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-[#2b3896] transition-colors cursor-not-allowed" disabled>
            <span className="material-symbols-outlined">chevron_left</span>
          </button>

          <button className="w-10 h-10 flex items-center justify-center rounded-full bg-[#2b3896] text-white font-bold shadow-md">
            1
          </button>
          <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white text-gray-600 hover:bg-gray-100 border border-gray-200 font-semibold transition-colors">
            2
          </button>
          <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white text-gray-600 hover:bg-gray-100 border border-gray-200 font-semibold transition-colors hidden sm:flex">
            3
          </button>
          
          <span className="text-gray-400 font-bold tracking-widest px-2">...</span>
          
          <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white text-gray-600 hover:bg-gray-100 border border-gray-200 font-semibold transition-colors">
            8
          </button>

          <button className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-[#2b3896] transition-colors">
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      </section>
    </>
  );
};

export default Home;