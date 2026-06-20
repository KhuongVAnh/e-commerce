import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../../store/useAuthStore';
import useCartStore from '../../store/useCartStore';
import axiosClient from '../../utils/axiosClient';

// Hàm hỗ trợ vẽ sao đánh giá (Thêm mới)
const renderStars = (rating) => {
  const stars = [];
  const fullStars = Math.floor(rating || 0);
  const hasHalfStar = (rating || 0) - fullStars >= 0.5;

  for (let i = 1; i <= 5; i++) {
    if (i <= fullStars) {
      stars.push(<span key={i} className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1", color: '#fbbf24' }}>star</span>);
    } else if (i === fullStars + 1 && hasHalfStar) {
      stars.push(<span key={i} className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1", color: '#fbbf24' }}>star_half</span>);
    } else {
      stars.push(<span key={i} className="material-symbols-outlined text-[18px] text-gray-300" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>);
    }
  }
  return stars;
};

const ProductDetail = () => {
  const { slug } = useParams();
  const productId = slug?.includes('-id') ? slug.split('-id').pop() : slug;
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [productData, setProductData] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [categories, setCategories] = useState([]);
  const [selectedImageUrl, setSelectedImageUrl] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { isAuthenticated } = useAuthStore();
  const { fetchCartTotal } = useCartStore();

  const fallbackShopLogo = 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=150&auto=format&fit=crop';

  // --- THÊM MỚI: CÁC STATE CHO REVIEW ---
  const [ratingSummary, setRatingSummary] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewTotalPages, setReviewTotalPages] = useState(1);
  const [reviewSort, setReviewSort] = useState('newest');
  const [reviewFilterRating, setReviewFilterRating] = useState('');
  const [isReviewsLoading, setIsReviewsLoading] = useState(false);
  // --------------------------------------

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      alert(t("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng!"));
      return;
    }

    try {
      await axiosClient.post('/commerce/cart/items', {
        productId: productData.product.id,
        quantity,
      });
      fetchCartTotal();
      alert(`${t('Đã thêm')} ${quantity} ${t('sản phẩm vào giỏ hàng!')}`);
    } catch (err) {
      console.error(err);
      alert(err.message || t("Không thể thêm vào giỏ hàng"));
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
      alert(t("Vui lòng đăng nhập để mua hàng!"));
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
        throw new Error(t('Không tìm thấy sản phẩm trong giỏ hàng sau khi thêm.'));
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
      alert(err.message || t("Không thể tạo đơn mua ngay."));
    }
  };

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) {
        setError(t('Không tìm thấy mã sản phẩm trong đường dẫn.'));
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const result = await axiosClient.get(`/catalog/products/${productId}`);
        const nextProductData = result.data?.data || result.data; // Tương thích vỏ bọc data
        const productImages = Array.isArray(nextProductData?.images) ? nextProductData.images : [];
        const firstGalleryImage = [...productImages]
          .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0))
          .find((image) => image.imageUrl)?.imageUrl;

        setProductData(nextProductData);
        setSelectedImageUrl(firstGalleryImage || nextProductData?.product?.thumbnailUrl || '');

        // THÊM MỚI: API Lấy Tổng quan Rating (Song song sau khi có ID)
        try {
          const summaryRes = await axiosClient.get(`/commerce/products/${productId}/reviews/summary`);
          setRatingSummary(summaryRes.data?.data || summaryRes.data);
        } catch (sumErr) {
          console.error("Lỗi lấy rating summary:", sumErr);
        }

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId, t]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const result = await axiosClient.get('/catalog/categories');
        setCategories(result.data?.data || result.data || []);
      } catch (err) {
        console.error("Lỗi khi tải danh mục:", err);
      }
    };
    fetchCategories();
  }, []);

  // --- THÊM MỚI: EFFECT CALL API LIST REVIEWS KHI CÓ SỰ THAY ĐỔI ---
  useEffect(() => {
    if (!productId) return;
    const fetchReviewsList = async () => {
      setIsReviewsLoading(true);
      try {
        let url = `/commerce/products/${productId}/reviews?page=${reviewPage}&limit=5&sort=${reviewSort}`;
        if (reviewFilterRating !== '') {
          url += `&rating=${reviewFilterRating}`;
        }
        const revRes = await axiosClient.get(url);
        const data = revRes.data?.data || revRes.data;
        setReviews(data?.reviews || []);
        
        const meta = revRes.data?.meta || revRes.meta;
        if (meta?.pagination) {
          setReviewTotalPages(meta.pagination.totalPages || 1);
        }
      } catch (error) {
        console.error("Lỗi tải danh sách reviews:", error);
      } finally {
        setIsReviewsLoading(false);
      }
    };
    fetchReviewsList();
  }, [productId, reviewPage, reviewSort, reviewFilterRating]);
  // -----------------------------------------------------------------

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-24 text-center">
        <span className="material-symbols-outlined animate-spin text-4xl text-[#2b3896]">progress_activity</span>
        <p className="mt-4 text-gray-500 font-medium">{t('Đang tải thông tin sản phẩm...')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto py-24 text-center">
        <span className="material-symbols-outlined text-5xl text-red-500 mb-4">error</span>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('Lỗi tải dữ liệu')}</h2>
        <p className="text-gray-500">{error}</p>
        <Link to="/products" className="mt-6 inline-block px-6 py-2 bg-[#2b3896] text-white font-bold rounded-full">{t('Quay lại cửa hàng')}</Link>
      </div>
    );
  }

  if (!productData) return null;

  const { product, images, shop } = productData;
  const galleryImages = [
    ...(Array.isArray(images)
      ? [...images]
        .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0))
        .map((image) => image.imageUrl)
      : []),
    product.thumbnailUrl,
  ].filter((imageUrl, index, list) => imageUrl && list.indexOf(imageUrl) === index);
  const mainImageUrl = selectedImageUrl || galleryImages[0] || '';

  const categoryName = categories.find(c => Number(c.id) === Number(product.categoryId))?.name || t('Danh mục khác');

  const handleDecrease = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };
  const handleIncrease = () => {
    if (quantity < product.stockQuantity) setQuantity(quantity + 1);
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-6">
      <nav className="flex gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-8">
        <Link to="/" className="hover:text-[#2b3896] transition-colors">{t('Trang chủ')}</Link>
        <span>/</span>
        <Link to={`/products?categoryId=${product.categoryId}`} className="hover:text-[#2b3896] transition-colors">{t('Danh mục')}</Link>
        <span>/</span>
        <span className="text-[#2b3896]">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mb-16">
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="aspect-[4/5] bg-gray-50 rounded-xl overflow-hidden shadow-[0px_8px_24px_rgba(43,56,150,0.04)] border border-gray-100">
            <img 
              src={mainImageUrl}
              alt={product.name} 
              className="w-full h-full object-cover"
            />
          </div>

          {galleryImages.length > 1 && (
            <div className="grid grid-cols-5 sm:grid-cols-6 gap-3">
              {galleryImages.map((imageUrl, index) => {
                const isSelected = imageUrl === mainImageUrl;
                return (
                  <button
                    key={imageUrl}
                    type="button"
                    onClick={() => setSelectedImageUrl(imageUrl)}
                    className={`aspect-square overflow-hidden rounded-lg border-2 bg-gray-50 transition-all ${
                      isSelected
                        ? 'border-[#2b3896] ring-2 ring-[#2b3896]/15'
                        : 'border-gray-100 hover:border-[#2b3896]/40'
                    }`}
                  >
                    <img src={imageUrl} alt={`${product.name} ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="lg:col-span-7 flex flex-col">
          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-gray-900 mb-3 leading-tight font-headline">
            {product.name}
          </h1>

          {/* THÊM MỚI: HIỂN THỊ TRUNG BÌNH SAO */}
          {ratingSummary && ratingSummary.totalReviews > 0 && (
            <div className="flex items-center gap-3 mb-4 cursor-pointer" onClick={() => document.getElementById('review-section').scrollIntoView({ behavior: 'smooth' })}>
              <div className="flex text-yellow-400">{renderStars(ratingSummary.averageRating)}</div>
              <span className="text-sm font-bold text-gray-700">{ratingSummary.averageRating?.toFixed(1)}</span>
              <span className="text-sm font-medium text-[#2b3896] hover:underline">({ratingSummary.totalReviews} {t('đánh giá')})</span>
            </div>
          )}
          
          <div className="flex items-baseline gap-4 mb-6 mt-2">
            <span className="text-2xl font-extrabold text-[#2b3896]">
              {Number(product.price).toLocaleString('vi-VN')} <span className="text-xs font-medium align-top opacity-70">₫</span>
            </span>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl mb-6 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-gray-600">{t('Số lượng')}</span>
              <span className="text-xs font-bold text-[#2b3896] uppercase tracking-wider">
                {product.stockQuantity > 0 ? `${product.stockQuantity} ${t('Sản phẩm sẵn có')}` : t('Hết hàng')}
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

          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <button 
              onClick={handleAddToCart}
              disabled={product.stockQuantity === 0}
              className="flex-1 py-3 px-6 border-2 border-[#2b3896] text-[#2b3896] font-bold text-sm tracking-wide rounded-xl hover:bg-[#2b3896]/5 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('Thêm vào giỏ')}
            </button>
            <button 
              onClick={handleBuyNow}
              disabled={product.stockQuantity === 0}
              className="flex-1 py-3 px-6 bg-gradient-to-br from-[#2b3896] to-[#4551af] text-white font-bold text-sm tracking-wide rounded-xl hover:shadow-lg hover:shadow-[#2b3896]/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {product.stockQuantity > 0 ? t('Mua Ngay') : t('Đã hết hàng')}
            </button>
          </div>

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
                  <h3 className="font-extrabold text-sm text-gray-900 hover:text-[#2b3896] transition-colors">{shop?.name || t('Gian hàng')}</h3>
                </Link>
                <div className="flex items-center gap-1 text-xs font-bold text-gray-500 mt-0.5">
                  <span className="material-symbols-outlined text-[14px] text-yellow-500" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span>{t('Được chứng nhận')}</span>
                </div>
              </div>
            </div>
            <Link to={`/shop/${shop?.id}`} className="shrink-0 text-xs font-bold text-[#2b3896] px-4 py-1.5 rounded-full border border-[#2b3896]/20 hover:bg-[#2b3896] hover:text-white transition-all">
              {t('Xem Shop')}
            </Link>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2.5 text-xs font-medium text-gray-600">
              <span className="material-symbols-outlined text-[#2b3896] text-[18px]">local_shipping</span>
              <span>{t('Dịch vụ vận chuyển nhanh và tiết kiệm chi phí')}</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs font-medium text-gray-600">
              <span className="material-symbols-outlined text-[#2b3896] text-[18px]">verified</span>
              <span>{t('Được đảm bảo chất lượng bởi hệ thống')}</span>
            </div>
          </div>

          <div className="mt-6 border-t border-gray-100 pt-5">
            <h3 className="text-[11px] font-bold text-gray-900 mb-3 uppercase tracking-wider">{t('Thông số sản phẩm')}</h3>
            <div className="grid grid-cols-2 gap-y-2 gap-x-6 text-[11px]">
              <div className="flex justify-between border-b border-gray-50 pb-1.5">
                <span className="text-gray-400 font-medium">{t('Mã sản phẩm')}</span>
                <span className="text-gray-700 font-bold">SP-{product.id}</span>
              </div>
              <div className="flex justify-between border-b border-gray-50 pb-1.5">
                <span className="text-gray-400 font-medium">{t('Danh mục')}</span>
                <span className="text-[#2b3896] font-bold">{categoryName}</span>
              </div>
              <div className="flex justify-between border-b border-gray-50 pb-1.5">
                <span className="text-gray-400 font-medium">{t('Thương hiệu / Shop')}</span>
                <span className="text-gray-700 font-bold">{shop?.name || t('Chính hãng')}</span>
              </div>
              <div className="flex justify-between border-b border-gray-50 pb-1.5">
                <span className="text-gray-400 font-medium">{t('Xuất xứ')}</span>
                <span className="text-gray-700 font-bold">{t('Việt Nam')}</span>
              </div>
              <div className="flex justify-between border-b border-gray-50 pb-1.5">
                <span className="text-gray-400 font-medium">{t('Trạng thái')}</span>
                <span className={`font-bold ${product.stockQuantity > 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {product.stockQuantity > 0 ? t('Còn hàng') : t('Hết hàng')}
                </span>
              </div>
              <div className="flex justify-between border-b border-gray-50 pb-1.5">
                <span className="text-gray-400 font-medium">{t('Bảo hành')}</span>
                <span className="text-gray-700 font-bold">{t('12 tháng chính hãng')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12 border-t border-gray-100 pt-8">
        <h2 className="text-lg font-extrabold tracking-tight text-gray-900 mb-4 font-headline flex items-center gap-2">
          <span className="material-symbols-outlined text-[#2b3896] text-[20px]">description</span>
          {t('Mô tả sản phẩm')}
        </h2>
        <div className="prose max-w-none text-xs md:text-sm text-gray-600 leading-relaxed whitespace-pre-wrap font-medium">
          {product.description || t('Sản phẩm này chưa có mô tả chi tiết.')}
        </div>
      </div>

      {/* --- THÊM MỚI: GIAO DIỆN HIỂN THỊ DANH SÁCH REVIEW (TỪ API) --- */}
      <div id="review-section" className="mt-16 border-t border-gray-100 pt-8 mb-20">
        <h2 className="text-lg font-extrabold text-gray-900 mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-[#2b3896] text-[20px]">reviews</span> 
          {t('Đánh giá từ khách hàng')}
        </h2>

        {ratingSummary && ratingSummary.totalReviews > 0 ? (
          <div className="bg-orange-50/50 rounded-2xl p-6 border border-orange-100 mb-8 flex flex-col md:flex-row gap-8 items-center">
            <div className="text-center md:border-r border-orange-200 md:pr-8 flex flex-col items-center">
              <span className="text-5xl font-black text-[#2b3896]">{ratingSummary.averageRating?.toFixed(1) || 0}</span>
              <div className="flex text-yellow-500 mt-2 mb-1">{renderStars(ratingSummary.averageRating || 0)}</div>
              <span className="text-sm font-medium text-gray-600">{ratingSummary.totalReviews || 0} {t('đánh giá')}</span>
            </div>
            <div className="flex-1 w-full space-y-2">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = ratingSummary.ratingBreakdown?.[star] || 0;
                const percent = ratingSummary.totalReviews > 0 ? (count / ratingSummary.totalReviews) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-600 w-8 flex items-center gap-1">{star} <span className="material-symbols-outlined text-[14px] text-yellow-500" style={{ fontVariationSettings: "'FILL' 1" }}>star</span></span>
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden"><div className="h-full bg-yellow-400 rounded-full" style={{ width: `${percent}%` }}></div></div>
                    <span className="text-xs font-medium text-gray-500 w-6">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500 text-sm">{t('Chưa có đánh giá nào cho sản phẩm này.')}</div>
        )}

        {/* Bộ Lọc Reviews */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div className="flex flex-wrap gap-2">
                <button onClick={() => { setReviewFilterRating(''); setReviewPage(1); }} className={`px-5 py-2 rounded-full text-sm font-bold border ${reviewFilterRating === '' ? 'bg-[#2b3896] text-white border-[#2b3896]' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>{t('Tất cả')}</button>
                {[5, 4, 3, 2, 1].map(star => (
                    <button key={star} onClick={() => { setReviewFilterRating(star); setReviewPage(1); }} className={`px-5 py-2 rounded-full text-sm font-bold border flex items-center gap-1 ${Number(reviewFilterRating) === star ? 'bg-[#2b3896] text-white border-[#2b3896]' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                      {star} {t('Sao')}
                    </button>
                ))}
            </div>
            <div>
                <select value={reviewSort} onChange={(e) => setReviewSort(e.target.value)} className="bg-white border border-gray-200 text-gray-700 text-sm font-bold rounded-lg px-3 py-2 outline-none cursor-pointer">
                    <option value="newest">{t('Mới nhất')}</option>
                    <option value="oldest">{t('Cũ nhất')}</option>
                    <option value="rating_desc">{t('Điểm cao nhất')}</option>
                    <option value="rating_asc">{t('Điểm thấp nhất')}</option>
                </select>
            </div>
        </div>

        {/* Danh sách Reviews */}
        {isReviewsLoading ? (
          <div className="text-center py-12"><span className="material-symbols-outlined animate-spin text-3xl text-gray-400">progress_activity</span></div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-100 text-gray-500 text-sm font-medium">{t('Không có đánh giá nào phù hợp.')}</div>
        ) : (
          <div className="space-y-6">
            {reviews.map((rev) => (
              <div key={rev.id} className="border-b border-gray-100 pb-6 last:border-0">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold uppercase shrink-0">
                    {rev.customerName ? rev.customerName.charAt(0) : 'K'}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-900">{rev.customerName || `${t('Khách hàng')} #${rev.customerId}`}</p>
                    <div className="flex items-center gap-2 mt-0.5 mb-2">
                      <div className="flex">{renderStars(rev.rating)}</div>
                      <span className="text-[11px] text-gray-400 font-medium">{new Date(rev.createdAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                    {rev.commentText && <p className="text-sm text-gray-700 leading-relaxed font-medium mb-3">{rev.commentText}</p>}
                    
                    {rev.imageUrls && Array.isArray(rev.imageUrls) && rev.imageUrls.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {rev.imageUrls.map((img, idx) => (
                          <img key={idx} src={img} alt={`Review ${idx}`} className="w-20 h-20 object-cover rounded-lg border border-gray-200" />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Phân trang Reviews */}
        {reviewTotalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            <button disabled={reviewPage === 1} onClick={() => setReviewPage(p => p - 1)} className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 disabled:opacity-30 hover:bg-gray-50"><span className="material-symbols-outlined text-sm">chevron_left</span></button>
            {Array.from({ length: reviewTotalPages }, (_, i) => i + 1).map(page => (
              <button key={page} onClick={() => setReviewPage(page)} className={`w-8 h-8 rounded-full text-xs font-bold ${reviewPage === page ? 'bg-[#2b3896] text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{page}</button>
            ))}
            <button disabled={reviewPage === reviewTotalPages} onClick={() => setReviewPage(p => p + 1)} className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 disabled:opacity-30 hover:bg-gray-50"><span className="material-symbols-outlined text-sm">chevron_right</span></button>
          </div>
        )}
      </div>
      {/* ------------------------------------------------------------- */}

    </div>
  );
};

export default ProductDetail;