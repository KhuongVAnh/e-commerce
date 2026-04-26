import { Link, useSearchParams } from 'react-router-dom';

const ProductList = () => {
  const [searchParams] = useSearchParams();
  const categoryFromUrl = searchParams.get('category');
  const searchFromUrl = searchParams.get('search');
  // Mảng dữ liệu sản phẩm mẫu
  const products = [
    {
      id: 1,
      brand: "Hue Ceramics",
      name: "Hand-Turned Indigo Vase",
      price: "2.500.000",
      rating: 5,
      reviews: 48,
      image: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=500&q=80",
      isLimited: false
    },
    {
      id: 2,
      brand: "Lotus Textiles",
      name: "Hand-Embroidered Silk Set",
      price: "1.850.000",
      rating: 5,
      reviews: 12,
      image: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e6?w=500&q=80",
      isLimited: true
    },
    {
      id: 3,
      brand: "Bamboo Collective",
      name: "Architectural Bamboo Lamp",
      price: "4.200.000",
      rating: 5,
      reviews: 94,
      image: "https://images.unsplash.com/photo-1513506003901-1e6a229e9d15?w=500&q=80",
      isLimited: false
    },
    {
      id: 4,
      brand: "Da Nang Workshop",
      name: "Solid Oak Coffee Table",
      price: "12.000.000",
      rating: 4.5,
      reviews: 215,
      image: "https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?w=500&q=80",
      isLimited: false
    },
    {
      id: 5,
      brand: "Craft Heritage",
      name: "Lacquerware Serving Tray",
      price: "950.000",
      rating: 5,
      reviews: 37,
      image: "https://images.unsplash.com/photo-1606041011872-59659ceb7eb8?w=500&q=80",
      isLimited: false
    },
    {
      id: 6,
      brand: "Studio Saigon",
      name: "'Horizon' Abstract Canvas",
      price: "6.800.000",
      rating: 5,
      reviews: 5,
      image: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=500&q=80",
      isLimited: false
    }
  ];

  return (
    <>
      {/* 1. ĐIỀU HƯỚNG */}
      <nav className="flex mb-8 text-xs font-bold uppercase tracking-widest text-gray-400">
        <Link to="/" className="hover:text-[#2b3896] transition-colors">Trang chủ</Link>
        <span className="mx-3 text-gray-300">/</span>
        <Link to="/categories" className="hover:text-[#2b3896] transition-colors">Danh mục</Link>
        <span className="mx-3 text-gray-300">/</span>
        <span className="text-[#2b3896] font-extrabold">Danh sách sản phẩm</span>
      </nav>

      <div className="flex gap-12">
        
        {/* 2. SIDEBAR FILTERS */}
        <aside className="hidden lg:flex flex-col gap-8 w-64 flex-shrink-0 sticky top-24 h-fit">
          <div>
            <h2 className="text-lg font-extrabold text-[#2b3896] mb-1 font-headline">Bộ Lọc</h2>
            <p className="text-xs text-gray-500 mb-6 uppercase tracking-wider font-semibold">Tinh chỉnh lựa chọn</p>
          </div>

          {/* Danh mục */}
          <div className="space-y-4">
            <h3 className="font-bold text-[#2b3896]">Danh mục con</h3>
            <div className="space-y-3">
              {['Điện tử', 'Thời trang', 'Làm đẹp', 'Nội thất', 'Tạp hóa', 'Thể thao', 'Đồ chơi'].map((item, idx) => (
                <label key={idx} className="flex items-center gap-3 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    // 3. SỬA CHỖ NÀY: Nếu item đang render trùng với tham số URL thì tự động check
                    defaultChecked={item === categoryFromUrl} 
                    className="w-4 h-4 rounded text-[#2b3896] focus:ring-[#2b3896] border-gray-300 cursor-pointer" 
                  />
                  <span className="text-gray-600 text-sm group-hover:translate-x-1 transition-transform">{item}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Khoảng giá */}
          <div className="space-y-4">
            <h3 className="font-bold text-[#2b3896]">Khoảng giá</h3>
            <div className="px-2">
              <input type="range" min="0" max="10000000" step="100000" className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#2b3896]" />
              <div className="flex justify-between mt-2 text-xs font-semibold text-gray-500">
                <span>0₫</span>
                <span>10Tr₫</span>
              </div>
            </div>
          </div>

          {/* Đánh giá */}
          <div className="space-y-4">
            <h3 className="font-bold text-[#2b3896]">Đánh giá</h3>
            <button className="flex items-center gap-2 text-gray-600 hover:translate-x-1 transition-transform">
              <div className="flex text-yellow-500">
                {[1, 2, 3, 4].map((star) => (
                  <span key={star} className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                ))}
                <span className="material-symbols-outlined text-sm">star</span>
              </div>
              <span className="text-xs font-semibold">& Trở lên</span>
            </button>
          </div>

          <button className="mt-4 bg-[#2b3896] text-white py-3 rounded-xl font-bold hover:bg-[#1f2970] transition-colors shadow-lg shadow-[#2b3896]/20">
            Áp dụng bộ lọc
          </button>
        </aside>

        {/* 3. MAIN CONTENT */}
        <section className="flex-1">
          
          {/* Header & Sắp xếp */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-[#2b3896] tracking-tight mb-2 font-headline">
                {searchFromUrl ? `Kết quả cho "${searchFromUrl}"` : (categoryFromUrl ? `Danh mục: ${categoryFromUrl}` : 'Tất cả sản phẩm')}
              </h1>
              <p className="text-gray-500 font-medium text-sm">Tìm thấy {products.length} kết quả phù hợp.</p>
            </div>
            <div className="flex items-center gap-4">
              <button className="lg:hidden flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 text-[#2b3896]">
                <span className="material-symbols-outlined">tune</span>
                <span className="text-sm font-bold">Lọc</span>
              </button>
              <div className="relative group">
                <select className="appearance-none bg-white px-6 py-2.5 pr-10 rounded-xl shadow-sm border border-gray-100 focus:ring-2 focus:ring-[#2b3896]/20 text-sm font-bold text-[#2b3896] cursor-pointer outline-none">
                  <option>Mới nhất</option>
                  <option>Giá: Thấp đến Cao</option>
                  <option>Giá: Cao đến Thấp</option>
                  <option>Bán chạy nhất</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[#2b3896] pointer-events-none">expand_more</span>
              </div>
            </div>
          </div>

          {/* Lưới sản phẩm */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
            {products.map((product) => (
              <Link to={`/product/${product.id}`} key={product.id} className="group flex flex-col h-full cursor-pointer">
                {/* Ảnh sản phẩm */}
                <div className="aspect-[4/5] bg-gray-100 overflow-hidden rounded-2xl relative mb-4">
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  
                  {/* Nút tim */}
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg text-gray-400 hover:text-red-500">
                    <span className="material-symbols-outlined flex items-center justify-center">favorite</span>
                  </div>

                  {/* Badge Limited */}
                  {product.isLimited && (
                    <div className="absolute top-4 left-4 bg-[#8f4700] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-tighter shadow-md">
                      Limited
                    </div>
                  )}
                </div>

                {/* Thông tin sản phẩm */}
                <div className="space-y-1 flex flex-col flex-1">
                  <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">{product.brand}</span>
                  
                  
                  <div className="flex items-center gap-2 my-1">
                    <div className="flex text-yellow-500">
                      {[1, 2, 3, 4].map((star) => (
                        <span key={star} className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      ))}
                      <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: product.rating === 5 ? "'FILL' 1" : "'FILL' 0.5" }}>
                        {product.rating === 5 ? 'star' : 'star_half'}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-500 font-bold">({product.reviews})</span>
                  </div>
                  
                  {/* Nút mua hàng */}
                  <div className="mt-auto flex items-center justify-between pt-4">
                    <div className="text-xl font-extrabold text-[#2b3896]">
                      {product.price}<span className="text-xs align-top ml-0.5 opacity-80">₫</span>
                    </div>
                    <button className="w-10 h-10 rounded-xl bg-[#2b3896] text-white flex items-center justify-center hover:bg-[#1f2970] active:scale-90 transition-transform shadow-md">
                      <span className="material-symbols-outlined">add_shopping_cart</span>
                    </button>
                  </div>

                </div>
              </Link>
            ))}
          </div>

          {/* Phân trang */}
          <div className="mt-20 flex justify-center gap-2">
            <button className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-200 text-gray-400 hover:bg-[#2b3896] hover:text-white hover:border-[#2b3896] transition-colors">
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <button className="w-10 h-10 flex items-center justify-center rounded-full bg-[#2b3896] text-white font-bold shadow-md">1</button>
            <button className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-200 text-gray-600 hover:bg-[#2b3896] hover:text-white hover:border-[#2b3896] transition-colors font-bold">2</button>
            <button className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-200 text-gray-600 hover:bg-[#2b3896] hover:text-white hover:border-[#2b3896] transition-colors font-bold">3</button>
            <button className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-200 text-gray-400 hover:bg-[#2b3896] hover:text-white hover:border-[#2b3896] transition-colors">
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>

        </section>
      </div>
    </>
  );
};

export default ProductList;