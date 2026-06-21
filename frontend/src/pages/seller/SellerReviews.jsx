import React, { useState, useEffect, useCallback } from 'react';
import axiosClient from '../../utils/axiosClient';
import { useTranslation } from 'react-i18next';

// Hàm hỗ trợ vẽ sao
const renderStars = (rating) => {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <span key={i} className={`material-symbols-outlined text-[14px] ${i <= rating ? 'text-yellow-400' : 'text-slate-200'}`} style={{ fontVariationSettings: "'FILL' 1" }}>
        star
      </span>
    );
  }
  return stars;
};

const SellerReviews = () => {
  const { t } = useTranslation();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // GỌI API 11: Lấy danh sách đánh giá của Seller (Không có filter theo tài liệu)
  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('page', pagination.page);
      queryParams.append('limit', pagination.limit);

      const res = await axiosClient.get(`/commerce/seller/reviews?${queryParams.toString()}`);
      
      const responseData = res?.data?.data || res?.data || {};
      setReviews(responseData.reviews || []);
      
      const metaPag = res?.data?.meta?.pagination || res?.meta?.pagination;
      if (metaPag) {
        setPagination(prev => ({ 
          ...prev, 
          total: metaPag.total || 0, 
          totalPages: metaPag.totalPages || 1 
        }));
      }
    } catch (error) {
      setErrorMsg(error.response?.data?.message || t("Không thể tải danh sách đánh giá."));
      setReviews([]);
    } finally { 
      setLoading(false); 
    }
  }, [pagination.page, pagination.limit, t]);

  useEffect(() => { 
    fetchReviews(); 
  }, [fetchReviews]);

  const getVisiblePages = () => {
    let start = Math.max(1, pagination.page - 1);
    let end = Math.min(pagination.totalPages, pagination.page + 1);
    if (pagination.page === 1) end = Math.min(pagination.totalPages, 3);
    if (pagination.page === pagination.totalPages) start = Math.max(1, pagination.totalPages - 2);
    const pages = [];
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  return (
    <div className="p-6 md:p-10 font-sans bg-[#f8fafc] min-h-full flex flex-col">
      <header className="mb-8 mt-8 md:mt-0">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-[#2e3785] tracking-tight mb-2">{t('Quản lý Đánh giá')}</h1>
        <p className="text-slate-500 font-medium text-xs md:text-sm">{t('Theo dõi và quản lý phản hồi của khách hàng về sản phẩm của bạn.')}</p>
      </header>

      {/* Box chứa bảng - Bo góc 3xl giống OrderList */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden w-full flex-col flex flex-1">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left whitespace-nowrap min-w-[800px]">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">{t('Sản phẩm')}</th>
                <th className="px-6 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">{t('Khách hàng')}</th>
                <th className="px-6 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">{t('Đánh giá')}</th>
                <th className="px-6 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">{t('Nội dung')}</th>
                <th className="px-6 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">{t('Ngày đăng')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {loading ? (
                <tr><td colSpan="5" className="p-10 text-center text-slate-400 font-bold">{t('Đang tải danh sách đánh giá...')}</td></tr>
              ) : errorMsg ? (
                <tr><td colSpan="5" className="p-10 text-center text-rose-500 font-bold">{errorMsg}</td></tr>
              ) : reviews.length === 0 ? (
                <tr><td colSpan="5" className="p-10 text-center text-slate-400">{t('Chưa có bài đánh giá nào.')}</td></tr>
              ) : reviews.map((review) => (
                <tr key={review.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-[#2e3785] text-xs md:text-sm">Mã SP: {review.productId}</p>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900 text-xs md:text-sm">ID: {review.customerId}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded border border-slate-100 w-fit">
                      <span className="font-black text-slate-800 text-xs">{review.rating}</span>
                      <div className="flex">{renderStars(review.rating)}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 max-w-[250px]">
                    <p className="truncate text-slate-600 font-medium whitespace-normal line-clamp-2 text-xs" title={review.commentText}>
                      {review.commentText || <span className="italic text-slate-400">{t('Không có bình luận')}</span>}
                    </p>
                    {review.imageUrls && Array.isArray(review.imageUrls) && review.imageUrls.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {review.imageUrls.map((img, idx) => (
                          <div key={idx} className="w-8 h-8 rounded bg-slate-100 overflow-hidden border border-slate-200">
                            <img src={img} alt="review" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-500 text-xs md:text-sm">
                    {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Phân trang */}
        <div className="p-4 md:px-6 border-t border-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white mt-auto rounded-b-3xl">
          <span className="text-[10px] md:text-xs font-medium text-slate-400">
            {t('Hiển thị')} {pagination.total > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0} {t('đến')} {Math.min(pagination.page * pagination.limit, pagination.total)} {t('trong số')} {pagination.total} {t('đánh giá')}
          </span>
          <div className="flex gap-1">
            <button disabled={pagination.page <= 1} onClick={() => setPagination({...pagination, page: pagination.page - 1})} className="w-7 h-7 md:w-8 md:h-8 rounded border border-slate-200 text-slate-400 flex items-center justify-center disabled:opacity-50 hover:bg-slate-50 transition-colors"><span className="material-symbols-outlined text-xs md:text-sm">chevron_left</span></button>
            {getVisiblePages().map(p => (
              <button key={p} onClick={() => setPagination({...pagination, page: p})} className={`w-7 h-7 md:w-8 md:h-8 rounded text-[10px] md:text-xs font-bold transition-colors ${pagination.page === p ? 'bg-[#2e3785] text-white shadow-sm' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>{p}</button>
            ))}
            <button disabled={pagination.page >= pagination.totalPages} onClick={() => setPagination({...pagination, page: pagination.page + 1})} className="w-7 h-7 md:w-8 md:h-8 rounded border border-slate-200 text-slate-400 flex items-center justify-center disabled:opacity-50 hover:bg-slate-50 transition-colors"><span className="material-symbols-outlined text-xs md:text-sm">chevron_right</span></button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerReviews;