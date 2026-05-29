import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import useCartStore from '../../store/useCartStore';
import axiosClient from '../../utils/axiosClient';

const ProductDetail = () => {
  const { id } = useParams(); 
  const navigate = useNavigate();
  
  const [productData, setProductData] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [categories, setCategories] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { isAuthenticated } = useAuthStore();
  const { fetchCartTotal } = useCartStore();

  const fallbackShopLogo = 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=150&auto=format&fit=crop';

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      alert("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng!");
      return;
    }

    try {
      await axiosClient.post('/commerce/cart/items', {
        productId: productData.product.id,
        quantity,
      });
      fetchCartTotal();
      alert(`Đã thêm ${quantity} sản phẩm vào giỏ hàng!`);
    } catch (err) {
      console.error(err);
      alert(err.message || "Không thể thêm vào giỏ hàng");
    }
  };

  const findCartItemId = async (productId, shopId) => {
    const cartRes = await axiosClient.get('/commerce/cart');
    const shop = cartRes.data.shops?.find((entry) => Number(entry.shopId) === Number(shopId));
    const item = shop?.items?.find((entry) => Number(entry.productId) === Number(productId));
    return item?.id;
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated) {
      alert("Vui lòng đăng nhập để mua hàng!");
      return;
    }
    
    if (!productData) return;

    try {
      const shopId = productData.shop?.id || productData.product.shopId;
      const addRes = await axiosClient.post('/commerce/cart/items', {
        productId: productData.product.id,
        quantity,
      });
      const cartItemId = addRes.data?.id || await findCartItemId(productData.product.id, shopId);

      if (!cartItemId) {
        throw new Error('Không tìm thấy sản phẩm trong giỏ hàng sau khi thêm.');
      }

      await axiosClient.patch(`/commerce/cart/items/${cartItemId}`, { quantity });
      fetchCartTotal();
      navigate(`/checkout?shopId=${shopId}`, {
        state: {
          shopId: Number(shopId),
          cartItemIds: [cartItemId],
        },
      });
    } catch (err) {
      console.error(err);
      alert(err.message || "Không thể tạo đơn mua ngay.");
    }
  };

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const result = await axiosClient.get(`/catalog/products/${id}`);
        setProductData(result.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

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

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-24 text-center">
        <span className="material-symbols-outlined animate-spin text-4xl text-[#2b3896]">progress_activity</span>
        <p className="mt-4 text-gray-500 font-medium">Đang tải thông tin sản phẩm...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto py-24 text-center">
        <span className="material-symbols-outlined text-5xl text-red-500 mb-4">error</span>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Lỗi tải dữ liệu</h2>
        <p className="text-gray-500">{error}</p>
        <Link to="/products" className="mt-6 inline-block px-6 py-2 bg-[#2b3896] text-white font-bold rounded-full">Quay lại cửa hàng</Link>
      </div>
    );
  }

  if (!productData) return null;

  const { product, images, shop } = productData;

  const categoryName = categories.find(c => Number(c.id) === Number(product.categoryId))?.name || 'Danh mục khác';

  const handleDecrease = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };
  const handleIncrease = () => {
    if (quantity < product.stockQuantity) setQuantity(quantity + 1);
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-6">
      
      {/* BREADCRUMBS */}
      <nav className="flex gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-8">
        <Link to="/" className="hover:text-[#2b3896] transition-colors">Trang chủ</Link>
        <span>/</span>
        <Link to={`/products?categoryId=${product.categoryId}`} className="hover:text-[#2b3896] transition-colors">Danh mục</Link>
        <span>/</span>
        <span className="text-[#2b3896]">{product.name}</span>
      </nav>

      {/*1: THÔNG TIN CHÍNH */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mb-16">
        
        {/* Gallery Ảnh */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="aspect-[4/5] bg-gray-50 rounded-xl overflow-hidden shadow-[0px_8px_24px_rgba(43,56,150,0.04)] border border-gray-100">
            <img 
              src={product.thumbnailUrl || (images && images.length > 0 ? images[0].imageUrl : '')} 
              alt={product.name} 
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Chi tiết & Nút Mua */}
        <div className="lg:col-span-7 flex flex-col">
          
          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-gray-900 mb-3 leading-tight font-headline">
            {product.name}
          </h1>
          
          <div className="flex items-baseline gap-4 mb-6">
            <span className="text-2xl font-extrabold text-[#2b3896]">
              {Number(product.price).toLocaleString('vi-VN')} <span className="text-xs font-medium align-top opacity-70">₫</span>
            </span>
          </div>

          {/* Chọn số lượng */}
          <div className="bg-gray-50 p-4 rounded-xl mb-6 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-gray-600">Số lượng</span>
              <span className="text-xs font-bold text-[#2b3896] uppercase tracking-wider">
                {product.stockQuantity > 0 ? `${product.stockQuantity} Sản phẩm sẵn có` : 'Hết hàng'}
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center bg-white rounded-full shadow-sm border border-gray-200 p-0.5">
                <button 
                  onClick={handleDecrease}
                  disabled={product.stockQuantity === 0}
                  className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-[#2b3896] hover:bg-gray-50 transition-colors rounded-full disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[18px]">remove</span>
                </button>
                <span className="w-10 text-center font-extrabold text-base text-gray-900">{product.stockQuantity === 0 ? 0 : quantity}</span>
                <button 
                  onClick={handleIncrease}
                  disabled={product.stockQuantity === 0}
                  className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-[#2b3896] hover:bg-gray-50 transition-colors rounded-full disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                </button>
              </div>
            </div>
          </div>

          {/* Nút hành động */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <button 
              onClick={handleAddToCart}
              disabled={product.stockQuantity === 0}
              className="flex-1 py-3 px-6 border-2 border-[#2b3896] text-[#2b3896] font-bold text-sm tracking-wide rounded-xl hover:bg-[#2b3896]/5 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Thêm vào giỏ
            </button>
            <button 
              onClick={handleBuyNow}
              disabled={product.stockQuantity === 0}
              className="flex-1 py-3 px-6 bg-gradient-to-br from-[#2b3896] to-[#4551af] text-white font-bold text-sm tracking-wide rounded-xl hover:shadow-lg hover:shadow-[#2b3896]/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {product.stockQuantity > 0 ? 'Mua Ngay' : 'Đã hết hàng'}
            </button>
          </div>

          {/* Cập nhật UI Thông tin Cửa hàng */}
          <div className="bg-white p-4 rounded-xl shadow-[0px_4px_16px_rgba(43,56,150,0.03)] border border-gray-100 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to={`/shop/${shop?.id}`} className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#2b3896]/10 bg-gray-100 flex items-center justify-center shrink-0">
                <img 
                  src={shop?.logoUrl || fallbackShopLogo} 
                  alt={shop?.name || 'Shop Logo'}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = fallbackShopLogo;
                  }}
                />
              </Link>
              <div>
                <Link to={`/shop/${shop?.id}`}>
                  <h3 className="font-extrabold text-sm text-gray-900 hover:text-[#2b3896] transition-colors">{shop?.name || 'Gian hàng'}</h3>
                </Link>
                <div className="flex items-center gap-1 text-xs font-bold text-gray-500 mt-0.5">
                  <span className="material-symbols-outlined text-[14px] text-yellow-500" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span>4.9 (Chưa có số liệu thực tế)</span>
                </div>
              </div>
            </div>
            <Link to={`/shop/${shop?.id}`} className="shrink-0 text-xs font-bold text-[#2b3896] px-4 py-1.5 rounded-full border border-[#2b3896]/20 hover:bg-[#2b3896] hover:text-white transition-all">
              Xem Shop
            </Link>
          </div>

          {/* Cam kết / Dịch vụ */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 text-xs font-medium text-gray-600">
              <span className="material-symbols-outlined text-[#2b3896] text-[18px]">local_shipping</span>
              <span>Miễn phí vận chuyển toàn quốc cho đơn từ 1.000.000đ</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs font-medium text-gray-600">
              <span className="material-symbols-outlined text-[#2b3896] text-[18px]">verified</span>
              <span>Được đảm bảo chất lượng bởi hệ thống</span>
            </div>
          </div>

          {/* Thông số kỹ thuật chi tiết */}
          <div className="mt-6 border-t border-gray-100 pt-5">
            <h3 className="text-[11px] font-bold text-gray-900 mb-3 uppercase tracking-wider">Thông số sản phẩm</h3>
            <div className="grid grid-cols-2 gap-y-2 gap-x-6 text-[11px]">
              <div className="flex justify-between border-b border-gray-50 pb-1.5">
                <span className="text-gray-400 font-medium">Mã sản phẩm</span>
                <span className="text-gray-700 font-bold">SP-{product.id}</span>
              </div>
              <div className="flex justify-between border-b border-gray-50 pb-1.5">
                <span className="text-gray-400 font-medium">Danh mục</span>
                <span className="text-[#2b3896] font-bold">{categoryName}</span>
              </div>
              <div className="flex justify-between border-b border-gray-50 pb-1.5">
                <span className="text-gray-400 font-medium">Thương hiệu / Shop</span>
                <span className="text-gray-700 font-bold">{shop?.name || 'Chính hãng'}</span>
              </div>
              <div className="flex justify-between border-b border-gray-50 pb-1.5">
                <span className="text-gray-400 font-medium">Xuất xứ</span>
                <span className="text-gray-700 font-bold">Việt Nam</span>
              </div>
              <div className="flex justify-between border-b border-gray-50 pb-1.5">
                <span className="text-gray-400 font-medium">Trạng thái</span>
                <span className={`font-bold ${product.stockQuantity > 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {product.stockQuantity > 0 ? 'Còn hàng' : 'Hết hàng'}
                </span>
              </div>
              <div className="flex justify-between border-b border-gray-50 pb-1.5">
                <span className="text-gray-400 font-medium">Bảo hành</span>
                <span className="text-gray-700 font-bold">12 tháng chính hãng</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 2: MÔ TẢ SẢN PHẨM */}
      <div className="mt-12 border-t border-gray-100 pt-8">
        <h2 className="text-lg font-extrabold tracking-tight text-gray-900 mb-4 font-headline flex items-center gap-2">
          <span className="material-symbols-outlined text-[#2b3896] text-[20px]">description</span>
          Mô tả sản phẩm
        </h2>
        <div className="prose max-w-none text-xs md:text-sm text-gray-600 leading-relaxed whitespace-pre-wrap font-medium">
          {product.description || 'Sản phẩm này chưa có mô tả chi tiết.'}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
