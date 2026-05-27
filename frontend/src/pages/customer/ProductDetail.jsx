import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import useCartStore from '../../store/useCartStore';

const ProductDetail = () => {
  const { id } = useParams(); 
  const navigate = useNavigate();
  
  const [productData, setProductData] = useState(null);
  const [activeImage, setActiveImage] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { isAuthenticated } = useAuthStore();
  const token = localStorage.getItem('accessToken') || '';
  const { fetchCartTotal } = useCartStore();

  const fallbackShopLogo = 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=150&auto=format&fit=crop';

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      alert("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng!");
      return;
    }

    try {
      const res = await fetch('http://localhost:3000/api/commerce/cart/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ productId: productData.product.id, quantity: quantity }) 
      });
      
      const result = await res.json();
      if (res.ok && result.success) {
        alert(`Đã thêm ${quantity} sản phẩm vào giỏ hàng!`);
      } else {
        alert(result.message || "Không thể thêm vào giỏ hàng");
      }
    } catch (err) {
      console.error(err);
      alert("Có lỗi xảy ra khi kết nối đến server.");
    }
  };

  const handleBuyNow = () => {
    if (!isAuthenticated) {
      alert("Vui lòng đăng nhập để mua hàng!");
      return;
    }
    
    if (!productData) return;

    navigate('/checkout', {
      state: {
        isBuyNow: true,
        items: [
          {
            productId: productData.product.id,
            name: productData.product.name,
            price: productData.product.price,
            thumbnailUrl: productData.product.thumbnailUrl,
            quantity: quantity,
            shopId: productData.shop?.id || productData.product.shopId
          }
        ]
      }
    });
  };

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:3000/api/catalog/products/${id}`);
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error?.details?.[0] || result.message || "Không thể tải thông tin sản phẩm");
        }

        setProductData(result.data);
        
        const defaultImage = result.data.product.thumbnailUrl || (result.data.images?.length > 0 ? result.data.images[0].imageUrl : '');
        setActiveImage(defaultImage);

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

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
        <Link to={`/products?category=${product.categoryId}`} className="hover:text-[#2b3896] transition-colors">Danh mục</Link>
        <span>/</span>
        <span className="text-[#2b3896]">{product.name}</span>
      </nav>

      {/*1: THÔNG TIN CHÍNH */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 mb-24">
        
        {/* Gallery Ảnh */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="aspect-[4/5] bg-gray-50 rounded-2xl overflow-hidden shadow-[0px_12px_32px_rgba(43,56,150,0.06)] border border-gray-100">
            <img 
              src={activeImage} 
              alt={product.name} 
              className="w-full h-full object-cover transition-all duration-500"
            />
          </div>
          
          {images && images.length > 0 && (
            <div className="grid grid-cols-4 gap-4">
              {product.thumbnailUrl && (
                <button 
                  onClick={() => setActiveImage(product.thumbnailUrl)}
                  className={`aspect-square rounded-xl overflow-hidden transition-all active:scale-95 ${activeImage === product.thumbnailUrl ? 'border-2 border-[#2b3896] shadow-md' : 'bg-gray-100 border border-transparent hover:border-[#2b3896]/30'}`}
                >
                  <img src={product.thumbnailUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                </button>
              )}
              {images.map((img) => (
                <button 
                  key={img.id}
                  onClick={() => setActiveImage(img.imageUrl)}
                  className={`aspect-square rounded-xl overflow-hidden transition-all active:scale-95 ${activeImage === img.imageUrl ? 'border-2 border-[#2b3896] shadow-md' : 'bg-gray-100 border border-transparent hover:border-[#2b3896]/30'}`}
                >
                  <img src={img.imageUrl} alt={`Gallery ${img.id}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Chi tiết & Nút Mua */}
        <div className="lg:col-span-5 flex flex-col">
          
          <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tighter text-gray-900 mb-4 leading-tight font-headline">
            {product.name}
          </h1>
          
          <div className="flex items-baseline gap-4 mb-8">
            <span className="text-3xl font-extrabold text-[#2b3896]">
              {Number(product.price).toLocaleString('vi-VN')} <span className="text-sm font-medium align-top opacity-70">₫</span>
            </span>
          </div>

          {/* Chọn số lượng */}
          <div className="bg-gray-50 p-6 rounded-2xl mb-8 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-gray-600">Số lượng</span>
              <span className="text-xs font-bold text-[#2b3896] uppercase tracking-wider">
                {product.stockQuantity > 0 ? `${product.stockQuantity} Sản phẩm sẵn có` : 'Hết hàng'}
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center bg-white rounded-full shadow-sm border border-gray-200 p-1">
                <button 
                  onClick={handleDecrease}
                  disabled={product.stockQuantity === 0}
                  className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-[#2b3896] hover:bg-gray-50 transition-colors rounded-full disabled:opacity-50"
                >
                  <span className="material-symbols-outlined">remove</span>
                </button>
                <span className="w-12 text-center font-extrabold text-lg text-gray-900">{product.stockQuantity === 0 ? 0 : quantity}</span>
                <button 
                  onClick={handleIncrease}
                  disabled={product.stockQuantity === 0}
                  className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-[#2b3896] hover:bg-gray-50 transition-colors rounded-full disabled:opacity-50"
                >
                  <span className="material-symbols-outlined">add</span>
                </button>
              </div>
            </div>
          </div>

          {/* Nút hành động */}
          <div className="flex flex-col sm:flex-row gap-4 mb-10">
            <button 
              onClick={handleAddToCart}
              disabled={product.stockQuantity === 0}
              className="flex-1 py-4 px-8 border-2 border-[#2b3896] text-[#2b3896] font-bold tracking-wide rounded-full hover:bg-[#2b3896]/5 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Thêm vào giỏ
            </button>
            <button 
              onClick={handleBuyNow}
              disabled={product.stockQuantity === 0}
              className="flex-1 py-4 px-8 bg-gradient-to-br from-[#2b3896] to-[#4551af] text-white font-bold tracking-wide rounded-full hover:shadow-lg hover:shadow-[#2b3896]/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {product.stockQuantity > 0 ? 'Mua Ngay' : 'Đã hết hàng'}
            </button>
          </div>

          {/* Cập nhật UI Thông tin Cửa hàng */}
          <div className="bg-white p-6 rounded-2xl shadow-[0px_8px_24px_rgba(43,56,150,0.05)] border border-gray-100 mb-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to={`/shop/${shop?.id}`} className="w-14 h-14 rounded-full overflow-hidden border-2 border-[#2b3896]/10 bg-gray-100 flex items-center justify-center shrink-0">
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
                  <h3 className="font-extrabold text-gray-900 hover:text-[#2b3896] transition-colors">{shop?.name || 'Gian hàng'}</h3>
                </Link>
                <div className="flex items-center gap-1 text-xs font-bold text-gray-500 mt-0.5">
                  <span className="material-symbols-outlined text-[14px] text-yellow-500" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span>4.9 (Chưa có số liệu thực tế)</span>
                </div>
              </div>
            </div>
            <Link to={`/shop/${shop?.id}`} className="shrink-0 text-sm font-bold text-[#2b3896] px-5 py-2 rounded-full border border-[#2b3896]/20 hover:bg-[#2b3896] hover:text-white transition-all">
              Xem Shop
            </Link>
          </div>

          {/* Cam kết / Dịch vụ */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm font-medium text-gray-600">
              <span className="material-symbols-outlined text-[#2b3896]">local_shipping</span>
              <span>Miễn phí vận chuyển toàn quốc cho đơn từ 1.000.000đ</span>
            </div>
            <div className="flex items-center gap-3 text-sm font-medium text-gray-600">
              <span className="material-symbols-outlined text-[#2b3896]">verified</span>
              <span>Được đảm bảo chất lượng bởi hệ thống</span>
            </div>
          </div>

        </div>
      </div>

      {/* 2: TABS THÔNG TIN CHI TIẾT */}
      <div className="mt-12">
        <div className="flex gap-8 md:gap-12 border-b border-gray-200 mb-10 overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setActiveTab('description')}
            className={`pb-4 font-bold tracking-tight text-lg whitespace-nowrap transition-colors ${activeTab === 'description' ? 'text-[#2b3896] border-b-2 border-[#2b3896]' : 'text-gray-400 hover:text-gray-700'}`}
          >
            Mô tả sản phẩm
          </button>
          <button 
            onClick={() => setActiveTab('reviews')}
            className={`pb-4 font-bold tracking-tight text-lg whitespace-nowrap transition-colors ${activeTab === 'reviews' ? 'text-[#2b3896] border-b-2 border-[#2b3896]' : 'text-gray-400 hover:text-gray-700'}`}
          >
            Đánh giá
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {activeTab === 'description' && (
            <div className="prose max-w-none text-gray-600">
              <h2 className="text-3xl font-extrabold tracking-tighter text-gray-900 mb-6 font-headline">Thông tin chi tiết</h2>
              <div className="leading-relaxed mb-6 font-medium whitespace-pre-wrap">
                {product.description || 'Sản phẩm này chưa có mô tả chi tiết.'}
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="col-span-full text-center py-12">
              <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">forum</span>
              <h3 className="text-xl font-bold text-gray-900">Tính năng đang cập nhật</h3>
              <p className="text-gray-500 mt-2">Hệ thống đang hoàn thiện luồng đánh giá sản phẩm.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;