import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import axiosClient from '../../utils/axiosClient';
import useAuthStore from '../../store/useAuthStore';
import useCartStore from '../../store/useCartStore';

const formatPrice = (price) => new Intl.NumberFormat('vi-VN').format(price);

const Home = () => {
  const { isAuthenticated } = useAuthStore();
  const { fetchCartTotal } = useCartStore();

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
          params: { limit: 8, sortBy: 'latest' } 
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
      <section className="bg-gradient-to-r from-[#2b3896] to-[#4551af] text-white py-24 px-6 md:px-12 text-center shadow-inner">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-black mb-6 font-['Be_Vietnam_Pro'] tracking-tight">
            Khám phá tinh hoa thủ công
          </h1>
          <p className="text-lg md:text-xl text-indigo-100 mb-10 leading-relaxed font-medium">
            Nơi hội tụ những tác phẩm độc bản từ các nghệ nhân hàng đầu, mang đậm dấu ấn văn hóa và phong cách hiện đại.
          </p>
          <Link 
            to="/products" 
            className="inline-flex items-center gap-2 bg-white text-[#2b3896] px-8 py-4 rounded-full font-bold hover:bg-gray-50 hover:scale-105 transition-all shadow-lg"
          >
            Mua sắm ngay
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </div>
      </section>

      {/* DANH MỤC */}
      <section className="max-w-screen-xl mx-auto px-6 md:px-12 pt-16">
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

      {/* SẢN PHẨM MỚI NHẤT */}
      <section className="max-w-screen-xl mx-auto px-6 md:px-12 py-20">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
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