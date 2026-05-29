import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import useCartStore from '../../store/useCartStore';
import axiosClient from '../../utils/axiosClient';

const ProductList = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const categoryIdFromUrl = searchParams.get('categoryId');
  const searchFromUrl = searchParams.get('search') || searchParams.get('q'); 
  const minPriceFromUrl = searchParams.get('minPrice') || '';
  const maxPriceFromUrl = searchParams.get('maxPrice') || '';
  const pageFromUrl = Number(searchParams.get('page') || '1');
  const limit = 16;

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { isAuthenticated } = useAuthStore();
  const { fetchCartTotal } = useCartStore();

  const handleAddToCart = async (e, productId) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      alert("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng!");
      return;
    }

    try {
      await axiosClient.post('/commerce/cart/items', {
        productId,
        quantity: 1,
      });
      fetchCartTotal();
      alert("Đã thêm sản phẩm vào giỏ hàng thành công!");
    } catch (err) {
      console.error(err);
      alert(err.message || "Không thể thêm vào giỏ hàng");
    }
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const result = await axiosClient.get('/catalog/categories');
        setCategories(result.data);
      } catch (err) {
        console.error("Lỗi khi tải danh mục:", err);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const queryParams = new URLSearchParams();
        
        if (searchFromUrl) queryParams.append('q', searchFromUrl);
        if (categoryIdFromUrl) queryParams.append('categoryId', categoryIdFromUrl);
        if (minPriceFromUrl) queryParams.append('minPrice', minPriceFromUrl);
        if (maxPriceFromUrl) queryParams.append('maxPrice', maxPriceFromUrl);
        queryParams.append('page', String(pageFromUrl));
        queryParams.append('limit', String(limit));

        const result = await axiosClient.get(`/catalog/products?${queryParams.toString()}`);
        setProducts(Array.isArray(result.data) ? result.data : []);
        const metaPag = result.pagination || result.meta?.pagination;
        if (metaPag) {
          setTotalPages(metaPag.totalPages || 1);
          setTotalProducts(metaPag.total || 0);
        }

      } catch (err) {
        setError(err.message || "Lỗi khi tải danh sách sản phẩm");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [searchFromUrl, categoryIdFromUrl, minPriceFromUrl, maxPriceFromUrl, pageFromUrl]);

  const handleCategoryChange = (categoryId) => {
    const currentParams = new URLSearchParams(searchParams);
    
    if (categoryIdFromUrl === String(categoryId)) {
      currentParams.delete('categoryId');
    } else {
      currentParams.set('categoryId', categoryId);
    }
    currentParams.set('page', '1');

    navigate(`/products?${currentParams.toString()}`);
  };

  const activeCategoryName = categories.find(c => String(c.id) === categoryIdFromUrl)?.name;

  const minPrice = 100000;
  const maxPrice = 20000000;

  const [sliderMinVal, setSliderMinVal] = useState(minPriceFromUrl ? Number(minPriceFromUrl) : minPrice);
  const [sliderMaxVal, setSliderMaxVal] = useState(maxPriceFromUrl ? Number(maxPriceFromUrl) : maxPrice);

  useEffect(() => {
    setSliderMinVal(minPriceFromUrl ? Number(minPriceFromUrl) : minPrice);
    setSliderMaxVal(maxPriceFromUrl ? Number(maxPriceFromUrl) : maxPrice);
  }, [minPriceFromUrl, maxPriceFromUrl]);

  const handlePriceRangeChange = (minVal, maxVal) => {
    const currentParams = new URLSearchParams(searchParams);
    if (minVal <= minPrice) {
      currentParams.delete('minPrice');
    } else {
      currentParams.set('minPrice', String(minVal));
    }
    if (maxVal >= maxPrice) {
      currentParams.delete('maxPrice');
    } else {
      currentParams.set('maxPrice', String(maxVal));
    }
    currentParams.set('page', '1');
    navigate(`/products?${currentParams.toString()}`);
  };

  const handlePageChange = (newPage) => {
    const currentParams = new URLSearchParams(searchParams);
    currentParams.set('page', String(newPage));
    navigate(`/products?${currentParams.toString()}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPaginationButtons = () => {
    const buttons = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        buttons.push(i);
      }
    } else {
      buttons.push(1);
      let start = Math.max(2, pageFromUrl - 1);
      let end = Math.min(totalPages - 1, pageFromUrl + 1);
      
      if (pageFromUrl <= 2) {
        end = 3;
      }
      if (pageFromUrl >= totalPages - 1) {
        start = totalPages - 2;
      }
      
      if (start > 2) {
        buttons.push('...');
      }
      for (let i = start; i <= end; i++) {
        buttons.push(i);
      }
      if (end < totalPages - 1) {
        buttons.push('...');
      }
      buttons.push(totalPages);
    }
    return buttons;
  };



  const minPercent = ((sliderMinVal - minPrice) / (maxPrice - minPrice)) * 100;
  const maxPercent = ((sliderMaxVal - minPrice) / (maxPrice - minPrice)) * 100;

  return (
    <>
      <nav className="flex mb-8 text-xs font-bold uppercase tracking-widest text-gray-400">
        <Link to="/" className="hover:text-[#2b3896] transition-colors">Trang chủ</Link>
        <span className="mx-3 text-gray-300">/</span>
        <Link to="/categories" className="hover:text-[#2b3896] transition-colors">Danh mục</Link>
        <span className="mx-3 text-gray-300">/</span>
        <span className="text-[#2b3896] font-extrabold">Danh sách sản phẩm</span>
      </nav>

      <div className="flex gap-12">
        {/* BỘ LỌC DÀNH CHO DESKTOP */}
        <aside className="hidden lg:flex flex-col gap-4 w-60 flex-shrink-0 sticky top-24 h-fit bg-white p-4 rounded-xl border border-gray-100 shadow-[0_4px_20px_rgba(43,56,150,0.02)]">
          {/* DANH MỤC */}
          <div className="space-y-3 pt-3 border-t border-gray-100">
            <h3 className="font-bold text-gray-800 text-xs flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#2b3896] text-[16px]">grid_view</span>
              Danh mục
            </h3>
            <div className="flex flex-col gap-1 max-h-40 overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-gray-50 [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full">
              <button
                onClick={() => {
                  const currentParams = new URLSearchParams(searchParams);
                  currentParams.delete('categoryId');
                  navigate(`/products?${currentParams.toString()}`);
                }}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all duration-150 flex items-center justify-between group ${
                  !categoryIdFromUrl 
                    ? 'bg-[#2b3896]/10 text-[#2b3896]' 
                    : 'text-gray-500 hover:bg-gray-50 hover:text-[#2b3896]'
                }`}
              >
                <span>Tất cả sản phẩm</span>
                {!categoryIdFromUrl && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2b3896]"></span>
                )}
              </button>
              {categories.map((item) => {
                const isActive = categoryIdFromUrl === String(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => handleCategoryChange(item.id)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all duration-150 flex items-center justify-between group ${
                      isActive 
                        ? 'bg-[#2b3896]/10 text-[#2b3896]' 
                        : 'text-gray-500 hover:bg-gray-50 hover:text-[#2b3896]'
                    }`}
                  >
                    <span className="group-hover:translate-x-0.5 transition-transform">{item.name}</span>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#2b3896]"></span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* LỌC GIÁ */}
          <div className="space-y-3 pt-3 border-t border-gray-100">
            <h3 className="font-bold text-gray-800 text-xs flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#2b3896] text-[16px]">payments</span>
              Lọc theo giá
            </h3>
            
            <div className="space-y-3 px-1">
              <div className="flex justify-between text-[9px] text-gray-400 font-bold uppercase tracking-wider">
                <span>Khoảng giá</span>
                <span className="text-[#2b3896] font-extrabold">
                  {Number(sliderMinVal).toLocaleString('vi-VN')} - {Number(sliderMaxVal).toLocaleString('vi-VN')}₫
                </span>
              </div>
              
              {/* Double range slider */}
              <div className="relative w-full h-5 flex items-center">
                <input
                  type="range"
                  min={minPrice}
                  max={maxPrice}
                  step={100000}
                  value={sliderMinVal}
                  onChange={(e) => {
                    const val = Math.min(Number(e.target.value), sliderMaxVal - 500000);
                    setSliderMinVal(val);
                  }}
                  onMouseUp={() => handlePriceRangeChange(sliderMinVal, sliderMaxVal)}
                  onTouchEnd={() => handlePriceRangeChange(sliderMinVal, sliderMaxVal)}
                  className={`absolute pointer-events-none appearance-none z-30 w-full h-1 bg-transparent accent-[#2b3896] [&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:pointer-events-auto ${
                    sliderMinVal > maxPrice - 2000000 ? 'z-40' : ''
                  }`}
                />
                <input
                  type="range"
                  min={minPrice}
                  max={maxPrice}
                  step={100000}
                  value={sliderMaxVal}
                  onChange={(e) => {
                    const val = Math.max(Number(e.target.value), sliderMinVal + 500000);
                    setSliderMaxVal(val);
                  }}
                  onMouseUp={() => handlePriceRangeChange(sliderMinVal, sliderMaxVal)}
                  onTouchEnd={() => handlePriceRangeChange(sliderMinVal, sliderMaxVal)}
                  className="absolute pointer-events-none appearance-none z-30 w-full h-1 bg-transparent accent-[#2b3896] [&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:pointer-events-auto"
                />
                {/* Custom Track Background */}
                <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1.5 bg-gray-100 rounded-full z-10"></div>
                {/* Active Colored Track */}
                <div 
                  className="absolute top-1/2 -translate-y-1/2 h-1.5 bg-[#2b3896] rounded-full z-20"
                  style={{ left: `${minPercent}%`, right: `${100 - maxPercent}%` }}
                ></div>
              </div>

              <div className="flex justify-between text-[8px] font-bold text-gray-400">
                <span>100K₫</span>
                <span>20Tr₫</span>
              </div>
            </div>


          </div>
        </aside>

        {/* DANH SÁCH SẢN PHẨM */}
        <section className="flex-1">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <h1 className="text-2xl md:text-4xl font-black text-[#2b3896] tracking-tight mb-1 font-headline">
                {searchFromUrl 
                  ? `Kết quả cho "${searchFromUrl}"` 
                  : (activeCategoryName ? `Danh mục: ${activeCategoryName}` : 'Tất cả sản phẩm')
                }
              </h1>
              {!loading && !error && (
                <p className="text-gray-500 font-medium text-xs md:text-sm">Tìm thấy {totalProducts} kết quả phù hợp.</p>
              )}
            </div>

            {/* Mobile Filter Button */}
            <button
              onClick={() => setIsMobileFilterOpen(true)}
              className="lg:hidden flex items-center justify-center gap-2 self-start md:self-end px-4 py-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl transition-all shadow-sm active:scale-95"
            >
              <span className="material-symbols-outlined text-[16px] text-[#2b3896]">filter_alt</span>
              Bộ lọc sản phẩm
            </button>
          </div>

          {loading && (
            <div className="py-20 text-center">
               <span className="material-symbols-outlined animate-spin text-4xl text-[#2b3896]">progress_activity</span>
               <p className="mt-4 text-gray-500 font-medium">Đang tải sản phẩm...</p>
            </div>
          )}

          {error && (
            <div className="py-20 text-center text-red-500 font-bold">{error}</div>
          )}

          {!loading && !error && products.length === 0 && (
            <div className="py-20 text-center bg-white rounded-2xl border border-gray-50 p-8 shadow-sm">
              <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">search_off</span>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Không tìm thấy sản phẩm</h2>
              <p className="text-gray-500">Vui lòng thử lại với danh mục hoặc bộ lọc khác.</p>
            </div>
          )}

          {!loading && !error && products.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-8">
              {products.map((product) => (
                <Link 
                  to={`/product/${product.id}`} 
                  key={product.id} 
                  className="group flex flex-col h-full cursor-pointer bg-white p-3 rounded-2xl border border-gray-100 shadow-[0_4px_12px_rgba(43,56,150,0.02)] hover:shadow-md hover:-translate-y-1 transition-all"
                >
                  <div className="aspect-[4/5] bg-gray-50 overflow-hidden rounded-xl relative mb-3">
                    <img src={product.thumbnailUrl || 'https://via.placeholder.com/500'} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    {product.stockQuantity === 0 && (
                      <div className="absolute top-2 left-2 bg-gray-800 text-white text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-tighter shadow-md">
                        Hết hàng
                      </div>
                    )}
                  </div>

                  <div className="space-y-1 flex flex-col flex-1">
                    <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">
                       Shop ID: {product.shopId}
                    </span>
                    <h3 className="text-xs md:text-sm font-bold text-gray-900 group-hover:text-[#2b3896] transition-colors leading-tight line-clamp-2">
                      {product.name}
                    </h3>
                    
                    <div className="mt-auto flex items-center justify-between pt-3 border-t border-gray-50 mt-2">
                      <div className="text-sm md:text-base font-extrabold text-[#2b3896]">
                        {Number(product.price).toLocaleString('vi-VN')}<span className="text-[10px] align-top ml-0.5 opacity-80">₫</span>
                      </div>
                      <button 
                        onClick={(e) => handleAddToCart(e, product.id)}
                        disabled={product.stockQuantity === 0}
                        className="w-8 h-8 rounded-lg bg-[#2b3896] text-white flex items-center justify-center hover:bg-[#1f2970] active:scale-90 transition-transform shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="material-symbols-outlined text-[18px]">add_shopping_cart</span>
                      </button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* PHÂN TRANG */}
          {!loading && !error && totalPages > 1 && (
            <div className="mt-12 flex justify-center items-center gap-1.5 md:gap-2">
              <button
                disabled={pageFromUrl <= 1}
                onClick={() => handlePageChange(pageFromUrl - 1)}
                className="w-8 h-8 md:w-10 md:h-10 rounded-xl border border-gray-200 bg-white text-gray-600 flex items-center justify-center hover:border-[#2b3896] hover:text-[#2b3896] disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px] md:text-[20px]">chevron_left</span>
              </button>

              {renderPaginationButtons().map((p, idx) => {
                if (p === '...') {
                  return (
                    <span key={`dots-${idx}`} className="px-2 text-gray-400 font-bold">
                      ...
                    </span>
                  );
                }
                const isActive = p === pageFromUrl;
                return (
                  <button
                    key={p}
                    onClick={() => handlePageChange(p)}
                    className={`w-8 h-8 md:w-10 md:h-10 rounded-xl font-bold text-xs md:text-sm transition-all active:scale-95 cursor-pointer flex items-center justify-center ${
                      isActive
                        ? 'bg-[#2b3896] text-white shadow-md shadow-[#2b3896]/10'
                        : 'border border-gray-200 bg-white text-gray-600 hover:border-[#2b3896] hover:text-[#2b3896]'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}

              <button
                disabled={pageFromUrl >= totalPages}
                onClick={() => handlePageChange(pageFromUrl + 1)}
                className="w-8 h-8 md:w-10 md:h-10 rounded-xl border border-gray-200 bg-white text-gray-600 flex items-center justify-center hover:border-[#2b3896] hover:text-[#2b3896] disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px] md:text-[20px]">chevron_right</span>
              </button>
            </div>
          )}
        </section>
      </div>

      {/* MOBILE FILTER DRAWER */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden flex items-end justify-center">
          {/* Backdrop click close */}
          <div className="absolute inset-0 animate-fade-in" onClick={() => setIsMobileFilterOpen(false)}></div>
          
          <div className="relative w-full bg-white rounded-t-3xl p-6 shadow-2xl flex flex-col gap-6 max-h-[85vh] overflow-y-auto z-10 animate-slide-up pb-10">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-gray-900 font-headline">Bộ Lọc Tìm Kiếm</h3>
                <p className="text-[9px] text-gray-400 uppercase tracking-widest font-semibold">Tinh chỉnh kết quả</p>
              </div>
              <button 
                onClick={() => setIsMobileFilterOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Categories filter */}
            <div className="space-y-3">
              <h4 className="font-bold text-gray-800 text-xs flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#2b3896] text-[16px]">grid_view</span>
                Danh mục
              </h4>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    const currentParams = new URLSearchParams(searchParams);
                    currentParams.delete('categoryId');
                    currentParams.set('page', '1');
                    navigate(`/products?${currentParams.toString()}`);
                    setIsMobileFilterOpen(false);
                  }}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${
                    !categoryIdFromUrl 
                      ? 'bg-[#2b3896] text-white shadow-md' 
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Tất cả sản phẩm
                </button>
                {categories.map((item) => {
                  const isActive = categoryIdFromUrl === String(item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        handleCategoryChange(item.id);
                        setIsMobileFilterOpen(false);
                      }}
                      className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${
                        isActive 
                          ? 'bg-[#2b3896] text-white shadow-md' 
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {item.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Price filter slider */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <h4 className="font-bold text-gray-800 text-xs flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#2b3896] text-[16px]">payments</span>
                Khoảng giá
              </h4>
              
              <div className="space-y-3">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-[#2b3896]">
                  <span>Khoảng giá chọn:</span>
                  <span>
                    {Number(sliderMinVal).toLocaleString('vi-VN')} - {Number(sliderMaxVal).toLocaleString('vi-VN')}₫
                  </span>
                </div>
                
                {/* Double range slider */}
                <div className="relative w-full h-8 flex items-center">
                  <input
                    type="range"
                    min={minPrice}
                    max={maxPrice}
                    step={100000}
                    value={sliderMinVal}
                    onChange={(e) => {
                      const val = Math.min(Number(e.target.value), sliderMaxVal - 500000);
                      setSliderMinVal(val);
                    }}
                    onMouseUp={() => handlePriceRangeChange(sliderMinVal, sliderMaxVal)}
                    onTouchEnd={() => handlePriceRangeChange(sliderMinVal, sliderMaxVal)}
                    className={`absolute pointer-events-none appearance-none z-30 w-full h-1 bg-transparent accent-[#2b3896] [&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:pointer-events-auto ${
                      sliderMinVal > maxPrice - 2000000 ? 'z-40' : ''
                    }`}
                  />
                  <input
                    type="range"
                    min={minPrice}
                    max={maxPrice}
                    step={100000}
                    value={sliderMaxVal}
                    onChange={(e) => {
                      const val = Math.max(Number(e.target.value), sliderMinVal + 500000);
                      setSliderMaxVal(val);
                    }}
                    onMouseUp={() => handlePriceRangeChange(sliderMinVal, sliderMaxVal)}
                    onTouchEnd={() => handlePriceRangeChange(sliderMinVal, sliderMaxVal)}
                    className="absolute pointer-events-none appearance-none z-30 w-full h-1 bg-transparent accent-[#2b3896] [&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:pointer-events-auto"
                  />
                  <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1.5 bg-gray-100 rounded-full z-10"></div>
                  <div 
                    className="absolute top-1/2 -translate-y-1/2 h-1.5 bg-[#2b3896] rounded-full z-20"
                    style={{ left: `${minPercent}%`, right: `${100 - maxPercent}%` }}
                  ></div>
                </div>
                
                <div className="flex justify-between text-[9px] font-bold text-gray-400">
                  <span>100K₫</span>
                  <span>20Tr₫</span>
                </div>
              </div>
            </div>

            {/* Clear filters inside drawer */}
            <div className="pt-4 border-t border-gray-100">
              <button
                onClick={() => {
                  const currentParams = new URLSearchParams(searchParams);
                  currentParams.delete('minPrice');
                  currentParams.delete('maxPrice');
                  setSliderMinVal(minPrice);
                  setSliderMaxVal(maxPrice);
                  navigate(`/products?${currentParams.toString()}`);
                  setIsMobileFilterOpen(false);
                }}
                className="w-full py-2.5 bg-gray-50 text-xs font-bold text-gray-500 hover:text-red-500 hover:bg-red-50/50 rounded-xl transition-all flex items-center justify-center gap-1.5 border border-dashed border-gray-200"
              >
                <span className="material-symbols-outlined text-[14px]">restart_alt</span>
                Reset bộ lọc giá
              </button>
            </div>
            
            <button 
              onClick={() => setIsMobileFilterOpen(false)}
              className="w-full mt-2 py-3 bg-[#2b3896] text-white font-bold text-xs rounded-xl shadow-lg active:scale-95 transition-all text-center"
            >
              Áp dụng bộ lọc
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductList;
