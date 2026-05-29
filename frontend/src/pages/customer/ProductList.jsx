import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/useAuthStore';
import useCartStore from '../../store/useCartStore';

const ProductList = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const categoryIdFromUrl = searchParams.get('categoryId');
  const searchFromUrl = searchParams.get('search') || searchParams.get('q'); 

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { isAuthenticated } = useAuthStore();
  const token = localStorage.getItem('accessToken') || '';
  const { fetchCartTotal } = useCartStore();

  const absoluteMin = 0;
  const absoluteMax = 10000;
  
  const [minPrice, setMinPrice] = useState(absoluteMin);
  const [maxPrice, setMaxPrice] = useState(absoluteMax);

  const parseSafeValue = (val, fallback) => {
    if (val === '' || val === null || val === undefined) return fallback;
    const num = Number(val);
    return isNaN(num) ? fallback : num;
  };

  const handleMinSliderChange = (e) => {
    const currentMax = parseSafeValue(maxPrice, absoluteMax);
    const value = Math.min(Number(e.target.value), currentMax - 100); 
    setMinPrice(value);
  };

  const handleMaxSliderChange = (e) => {
    const currentMin = parseSafeValue(minPrice, absoluteMin);
    const value = Math.max(Number(e.target.value), currentMin + 100); 
    setMaxPrice(value);
  };

  const handleMinInputChange = (e) => {
    const val = e.target.value;
    if (val.includes('-')) return;

    if (val === '') {
      setMinPrice('');
      return;
    }

    const numValue = Number(val);
    if (!isNaN(numValue)) {
      setMinPrice(numValue);
    }
  };

  const handleMaxInputChange = (e) => {
    const val = e.target.value;
    if (val.includes('-')) return;

    if (val === '') {
      setMaxPrice('');
      return;
    }

    const numValue = Number(val);
    if (!isNaN(numValue)) {
      setMaxPrice(numValue);
    }
  };

  const handleInputBlur = () => {
    let currentMin = parseSafeValue(minPrice, absoluteMin);
    let currentMax = parseSafeValue(maxPrice, absoluteMax);

    if (currentMin < absoluteMin) currentMin = absoluteMin;
    if (currentMax > absoluteMax) currentMax = absoluteMax;

    if (currentMin >= currentMax) {
      currentMin = Math.max(absoluteMin, currentMax - 100);
    }

    setMinPrice(currentMin);
    setMaxPrice(currentMax);
  };

  const safeMinForPercent = parseSafeValue(minPrice, absoluteMin);
  const safeMaxForPercent = parseSafeValue(maxPrice, absoluteMax);
  const minPercent = ((safeMinForPercent - absoluteMin) / (absoluteMax - absoluteMin)) * 100;
  const maxPercent = ((safeMaxForPercent - absoluteMin) / (absoluteMax - absoluteMin)) * 100;

  const handleAddToCart = async (e, productId) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng!");
      return;
    }

    try {
      const res = await fetch('http://localhost:3000/api/commerce/cart/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ productId: productId, quantity: 1 })
      });
      
      const result = await res.json();
      if (res.ok && (result.success || result.data)) {
        toast.success("Đã thêm sản phẩm vào giỏ hàng!");
        if (fetchCartTotal) fetchCartTotal(); 
      } else {
        toast.error(result.message || "Không thể thêm vào giỏ hàng");
      }
    } catch (err) {
      console.error(err);
      toast.error("Có lỗi xảy ra khi kết nối đến server.");
    }
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/catalog/categories');
        const result = await res.json();
        if (result.success) {
          setCategories(result.data);
        }
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

        const finalMin = parseSafeValue(minPrice, absoluteMin);
        const finalMax = parseSafeValue(maxPrice, absoluteMax);
        
        queryParams.append('minPrice', finalMin * 1000);
        queryParams.append('maxPrice', finalMax * 1000);

        const response = await fetch(`http://localhost:3000/api/catalog/products?${queryParams.toString()}`);
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Lỗi khi tải danh sách sản phẩm");
        }

        const fetchedProducts = Array.isArray(result.data) ? result.data : (result.data?.items || []);
        setProducts(fetchedProducts);

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchProducts();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchFromUrl, categoryIdFromUrl, minPrice, maxPrice]);

  const handleCategoryChange = (categoryId) => {
    const currentParams = new URLSearchParams(searchParams);
    
    if (categoryIdFromUrl === String(categoryId)) {
      currentParams.delete('categoryId');
    } else {
      currentParams.set('categoryId', categoryId);
    }

    navigate(`/products?${currentParams.toString()}`);
  };

  const activeCategoryName = categories.find(c => String(c.id) === categoryIdFromUrl)?.name;

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
        {/* BỘ LỌC */}
        <aside className="hidden lg:flex flex-col gap-8 w-64 flex-shrink-0 sticky top-24 h-fit">
          <div>
            <h2 className="text-lg font-extrabold text-[#2b3896] mb-1 font-headline">Bộ Lọc</h2>
            <p className="text-xs text-gray-500 mb-6 uppercase tracking-wider font-semibold">Tinh chỉnh lựa chọn</p>
          </div>

          {/* DANH MỤC CON */}
          <div className="space-y-4">
            <h3 className="font-bold text-[#2b3896]">Danh mục</h3>
            {categories.length === 0 ? (
              <p className="text-xs text-gray-400">Đang tải danh mục...</p>
            ) : (
              <div className="space-y-3">
                {categories.map((item) => (
                  <label key={item.id} className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={categoryIdFromUrl === String(item.id)} 
                      onChange={() => handleCategoryChange(item.id)}
                      className="w-4 h-4 rounded text-[#2b3896] focus:ring-[#2b3896] border-gray-300 cursor-pointer" 
                    />
                    <span className="text-gray-600 text-sm group-hover:translate-x-1 transition-transform">{item.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* KHOẢNG GIÁ KÉP */}
          <div className="space-y-4">
            <h3 className="font-bold text-[#2b3896]">Khoảng giá (Nghìn ₫)</h3>
            <div className="px-2">

              <div className="relative h-2 rounded-lg bg-gray-200 w-full mb-6">
                 <div 
                    className="absolute h-full bg-[#2b3896] rounded-lg"
                    style={{ left: `${minPercent}%`, right: `${100 - maxPercent}%` }}
                 ></div>

                 <input 
                    type="range" 
                    min={absoluteMin} 
                    max={absoluteMax} 
                    step="10" 
                    value={minPrice}
                    onChange={handleMinSliderChange}
                    className="absolute w-full -top-1 h-4 appearance-none bg-transparent pointer-events-none z-20"
                    style={{ WebkitAppearance: 'none' }}
                 />

                 <input 
                    type="range" 
                    min={absoluteMin} 
                    max={absoluteMax} 
                    step="10" 
                    value={maxPrice}
                    onChange={handleMaxSliderChange}
                    className="absolute w-full -top-1 h-4 appearance-none bg-transparent pointer-events-none z-30"
                    style={{ WebkitAppearance: 'none' }}
                 />
                 
                 <style dangerouslySetInnerHTML={{__html: `
                    input[type=range]::-webkit-slider-thumb {
                        pointer-events: auto;
                        -webkit-appearance: none;
                        width: 16px;
                        height: 16px;
                        border-radius: 50%;
                        background: #2b3896;
                        cursor: pointer;
                        box-shadow: 0 0 0 2px white;
                    }
                    input[type=range]::-moz-range-thumb {
                        pointer-events: auto;
                        width: 16px;
                        height: 16px;
                        border-radius: 50%;
                        background: #2b3896;
                        cursor: pointer;
                        border: 2px solid white;
                    }
                 `}} />
              </div>

              {/* Ô nhập liệu */}
              <div className="flex items-center justify-between gap-2">
                <div className="relative">
                  <input 
                    type="number" 
                    value={minPrice} 
                    onChange={handleMinInputChange}
                    onBlur={handleInputBlur}
                    className="w-full text-center text-sm font-semibold text-gray-700 border border-gray-300 rounded-md py-1.5 focus:border-[#2b3896] focus:ring-1 focus:ring-[#2b3896] outline-none"
                  />
                  <span className="absolute right-2 top-1.5 text-xs text-gray-400">k</span>
                </div>
                <span className="text-gray-400 font-bold">-</span>
                <div className="relative">
                  <input 
                    type="number" 
                    value={maxPrice} 
                    onChange={handleMaxInputChange}
                    onBlur={handleInputBlur}
                    className="w-full text-center text-sm font-semibold text-gray-700 border border-gray-300 rounded-md py-1.5 focus:border-[#2b3896] focus:ring-1 focus:ring-[#2b3896] outline-none"
                  />
                  <span className="absolute right-2 top-1.5 text-xs text-gray-400">k</span>
                </div>
              </div>

            </div>
          </div>
        </aside>

        {/* DANH SÁCH SẢN PHẨM */}
        <section className="flex-1">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-[#2b3896] tracking-tight mb-2 font-headline">
                {searchFromUrl 
                  ? `Kết quả cho "${searchFromUrl}"` 
                  : (activeCategoryName ? `Danh mục: ${activeCategoryName}` : 'Tất cả sản phẩm')
                }
              </h1>
              {!loading && !error && (
                <p className="text-gray-500 font-medium text-sm">Tìm thấy {products.length} kết quả phù hợp.</p>
              )}
            </div>
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
            <div className="py-20 text-center">
              <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">search_off</span>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Không tìm thấy sản phẩm</h2>
              <p className="text-gray-500">Vui lòng thử lại với danh mục hoặc khoảng giá khác.</p>
            </div>
          )}

          {!loading && !error && products.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
              {products.map((product) => (
                <Link 
                  to={`/product/${product.slug ? `${product.slug}-id${product.id}` : product.id}`} 
                  key={product.id} 
                  className="group flex flex-col h-full cursor-pointer"
                >
                  <div className="aspect-[4/5] bg-gray-100 overflow-hidden rounded-2xl relative mb-4">
                    <img src={product.thumbnailUrl || 'https://via.placeholder.com/500'} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    {product.stockQuantity === 0 && (
                      <div className="absolute top-4 left-4 bg-gray-800 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-tighter shadow-md">
                        Hết hàng
                      </div>
                    )}
                  </div>

                  <div className="space-y-1 flex flex-col flex-1">
                    <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">
                       Shop ID: {product.shopId}
                    </span>
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#2b3896] transition-colors leading-tight line-clamp-2">
                      {product.name}
                    </h3>
                    
                    <div className="mt-auto flex items-center justify-between pt-4">
                      <div className="text-xl font-extrabold text-[#2b3896]">
                        {Number(product.price).toLocaleString('vi-VN')}<span className="text-xs align-top ml-0.5 opacity-80">₫</span>
                      </div>
                      <button 
                        onClick={(e) => handleAddToCart(e, product.id)}
                        disabled={product.stockQuantity === 0}
                        className="w-10 h-10 rounded-xl bg-[#2b3896] text-white flex items-center justify-center hover:bg-[#1f2970] active:scale-90 transition-transform shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="material-symbols-outlined">add_shopping_cart</span>
                      </button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
};

export default ProductList;