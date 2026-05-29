import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import axiosClient from '../../utils/axiosClient';
import useAuthStore from '../../store/useAuthStore';
import useCartStore from '../../store/useCartStore';

const formatPrice = (price) => new Intl.NumberFormat('vi-VN').format(price);

const slides = [
  {
    title: "Đa dạng Deal chất lượng",
    description: "Nơi hội tụ hàng ngàn sản phẩm chất lượng cao, từ công nghệ, thời trang đến phong cách sống hiện đại.",
    link: "/products",
    gradient: "from-[#2b3896] to-[#4551af]",
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1200&auto=format&fit=crop"
  },
  {
    title: "Bùng nổ Deal Công nghệ",
    description: "Khám phá các thiết bị thông minh, điện thoại, máy tính với ưu đãi cực khủng lên đến 50%.",
    link: "/products",
    gradient: "from-[#1f2937] to-[#111827]",
    image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=1200&auto=format&fit=crop"
  },
  {
    title: "Xu hướng Thời trang mới",
    description: "Đón đầu phong cách mới nhất mùa hè năm nay. Mua sắm quần áo, phụ kiện cao cấp.",
    link: "/products",
    gradient: "from-[#6366f1] to-[#d946ef]",
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1200&auto=format&fit=crop"
  }
];

const Home = () => {
  const { isAuthenticated } = useAuthStore();
  const { fetchCartTotal } = useCartStore();
  const [backendReady, setBackendReady] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [currentSlide]);

  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axiosClient.get('/catalog/categories');
        const responseData = res.data || res;
        
        let cats = [];
        if (responseData?.success && responseData?.data?.categories) {
          cats = responseData.data.categories;
        } else if (responseData?.categories) {
          cats = responseData.categories;
        } else if (Array.isArray(responseData)) {
          cats = responseData;
        } else if (responseData?.data && Array.isArray(responseData.data)) {
          cats = responseData.data;
        }

        setCategories(cats.slice(0, 6)); 
      } catch (err) {
        console.error("Lỗi khi tải danh mục:", err);
      } finally {
        setLoadingCategories(false);
      }
    };

    const fetchProducts = async () => {
      try {
        const res = await axiosClient.get('/catalog/products', {
          params: { limit: 12, sortBy: 'latest' } 
        });
        
        const responseData = res.data || res;
        
        if (responseData?.success && responseData?.data?.products) {
          setProducts(responseData.data.products);
        } else if (responseData?.products) {
          setProducts(responseData.products);
        } else if (Array.isArray(responseData)) {
          setProducts(responseData);
        }
      } catch (err) {
        console.error("Lỗi khi tải sản phẩm trang chủ:", err);
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchCategories();
    fetchProducts();
  }, []);

  const handleAddToCart = async (e, product) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng!');
      return;
    }

    try {
      const token = localStorage.getItem('accessToken') || '';
      const res = await axiosClient.post('/commerce/cart/items', {
        productId: product.id, 
        quantity: 1 
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const result = res.data || res;
      
      if (result.success || res.status === 200 || res.status === 201 || result.id) {
        toast.success(`Đã thêm "${product.name}" vào giỏ hàng!`);
        if (fetchCartTotal) fetchCartTotal(); // Kích hoạt nhảy số màu đỏ
      } else {
        toast.error(result.message || "Không thể thêm vào giỏ hàng");
      }
    } catch (err) {
      console.error("Chi tiết lỗi API giỏ hàng:", err);
      toast.error(err.response?.data?.message || err.message || 'Có lỗi xảy ra khi kết nối đến server.');
    }
  };

  return (
    <main className="min-h-screen bg-[#f9f9fc] font-['Inter']">
      {/* 1. SLIDESHOW BANNER */}
      <section className="relative w-full h-[400px] md:h-[480px] overflow-hidden bg-slate-900 shadow-inner">
        {slides.map((slide, index) => {
          const isActive = index === currentSlide;
          return (
            <div
              key={index}
              className={`absolute inset-0 bg-slate-900 text-white flex items-center justify-center transition-all duration-700 ease-in-out ${
                isActive ? 'opacity-100 scale-100 z-10 pointer-events-auto' : 'opacity-0 scale-95 z-0 pointer-events-none'
              }`}
            >
              {/* Background Image with natural colors */}
              <div 
                className="absolute inset-0 bg-cover bg-center select-none pointer-events-none opacity-75" 
                style={{ backgroundImage: `url(${slide.image})` }}
              />
              {/* Dark overlay to protect text readability */}
              <div className="absolute inset-0 bg-black/45 z-0" />
              <div className="relative z-10 max-w-4xl mx-auto px-6 md:px-12 text-center">
                <h1 className="text-3xl md:text-6xl font-black mb-6 font-['Be_Vietnam_Pro'] tracking-tight">
                  {slide.title}
                </h1>
                <p className="text-lg md:text-xl text-indigo-100/90 mb-10 leading-relaxed font-medium max-w-2xl mx-auto">
                  {slide.description}
                </p>
                <Link 
                  to={slide.link} 
                  className="inline-flex items-center gap-2 bg-white text-[#2b3896] px-8 py-4 rounded-full font-bold hover:bg-gray-50 hover:scale-105 active:scale-95 transition-all shadow-lg"
                >
                  Mua sắm ngay
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </Link>
              </div>
            </div>
          );
        })}

        {/* Previous Button */}
        <button
          onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer hidden md:flex"
        >
          <span className="material-symbols-outlined">chevron_left</span>
        </button>

        {/* Next Button */}
        <button
          onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer hidden md:flex"
        >
          <span className="material-symbols-outlined">chevron_right</span>
        </button>

        {/* Indicators */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-3">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full cursor-pointer transition-all duration-300 ${
                index === currentSlide ? 'bg-white w-8' : 'bg-white/40 hover:bg-white/60'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </section>

      {/* 2. DANH MỤC NỔI BẬT */}
      <section className="max-w-screen-2xl mx-auto px-6 md:px-12 pt-16">
        <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-8 font-['Be_Vietnam_Pro']">Danh mục nổi bật</h2>
        {/* ... (Các thẻ hiển thị Category) ... */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
            {categories.map((category) => (
              <Link 
                key={category.id} 
                to={`/products?categoryId=${category.id}`} 
                className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-[#2b3896]/30 transition-all group flex flex-col items-center text-center"
              >
                <div className="w-16 h-16 rounded-full bg-[#f4f5fa] text-[#2b3896] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform group-hover:bg-[#2b3896] group-hover:text-white">
                  {category.imageUrl ? (
                     <img src={category.imageUrl} alt={category.name} className="w-10 h-10 object-contain" />
                  ) : (
                     <span className="material-symbols-outlined text-3xl">category</span>
                  )}
                </div>
                <h3 className="font-bold text-gray-800 text-sm group-hover:text-[#2b3896] line-clamp-2">
                  {category.name}
                </h3>
              </Link>
            ))}
          </div>
      </section>

      {/* 3. SẢN PHẨM MỚI NHẤT */}
      <section className="max-w-screen-2xl mx-auto px-6 md:px-12 py-20">
        <div className="flex items-center justify-between mb-12">
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 font-['Be_Vietnam_Pro']">Sản phẩm mới nhất</h2>
          <Link to="/products" className="hidden md:flex items-center gap-1 text-[#2b3896] font-bold hover:underline">
            Xem tất cả
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </div>

        {loadingProducts ? (
          <div className="flex flex-col items-center justify-center py-20">
            <span className="material-symbols-outlined animate-spin text-5xl text-[#2b3896]">progress_activity</span>
            <p className="mt-4 text-gray-500 font-medium">Đang tải sản phẩm...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">inventory_2</span>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Chưa có sản phẩm nào</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6 gap-6">
            {products.map((product) => (
              <div key={product.id} className="bg-white rounded-2xl p-5 shadow-[0px_8px_24px_rgba(43,56,150,0.04)] border border-gray-100 group transition-all hover:-translate-y-1 hover:shadow-[0px_12px_32px_rgba(43,56,150,0.08)] flex flex-col">
                <Link 
                  to={`/product/${product.slug ? `${product.slug}-id${product.id}` : product.id}`} 
                  className="block relative w-full h-56 bg-gray-50 rounded-xl overflow-hidden mb-5"
                >
                  <img 
                    src={product.thumbnailUrl || 'https://via.placeholder.com/300'} 
                    alt={product.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </Link>
                
                <div className="flex flex-col flex-grow">
                  <Link to={`/product/${product.slug ? `${product.slug}-id${product.id}` : product.id}`}>
                    <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-[#2b3896] transition-colors">
                      {product.name}
                    </h3>
                  </Link>
                  <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-50">
                    <span className="text-xl font-black text-[#2b3896]">
                      {formatPrice(product.price)} <span className="text-sm font-bold align-top">₫</span>
                    </span>
                    
                    <button 
                      onClick={(e) => handleAddToCart(e, product)}
                      className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-600 hover:bg-[#2b3896] hover:text-white transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">shopping_cart</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default Home;