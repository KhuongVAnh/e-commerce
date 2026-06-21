import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import axiosClient from '../../utils/axiosClient';
import { formatDate } from '../../utils/adminApi';
import {
  AdminDataTable,
  AdminPageHeader,
} from '../../components/admin/AdminComponents';

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

const AdminReviews = () => {
  const { t } = useTranslation();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [filters, setFilters] = useState({ shopId: '', productId: '' });
  const [appliedFilters, setAppliedFilters] = useState({ shopId: '', productId: '' });
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // GỌI API 12: Lấy toàn bộ đánh giá (Có filter shopId, productId theo tài liệu)
  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('page', pagination.page);
      queryParams.append('limit', pagination.limit);
      if (appliedFilters.shopId) queryParams.append('shopId', appliedFilters.shopId);
      if (appliedFilters.productId) queryParams.append('productId', appliedFilters.productId);

      const res = await axiosClient.get(`/commerce/admin/reviews?${queryParams.toString()}`);
      const data = res?.data?.data || res?.data || {};
      setReviews(data.reviews || []);
      
      const metaPag = res?.data?.meta?.pagination || res?.meta?.pagination;
      if (metaPag) {
        setPagination(prev => ({ ...prev, total: metaPag.total || 0, totalPages: metaPag.totalPages || 1 }));
      }
    } catch (error) {
      setErrorMsg(error.response?.data?.message || t("Không thể tải danh sách đánh giá."));
      setReviews([]);
    } finally { setLoading(false); }
  }, [pagination.page, pagination.limit, appliedFilters, t]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const handleApplyFilters = () => {
    setAppliedFilters(filters);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleResetFilters = () => {
    const reset = { shopId: '', productId: '' };
    setFilters(reset);
    setAppliedFilters(reset);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // GỌI API 13: Xóa đánh giá vi phạm
  const handleDelete = async (reviewId) => {
    if (!window.confirm(t('Xóa bài đánh giá này vì vi phạm quy tắc hệ thống?'))) return;
    try {
      await axiosClient.delete(`/commerce/admin/reviews/${reviewId}`);
      alert(t("Xóa đánh giá thành công. Điểm số sẽ được đồng bộ lại."));
      fetchReviews();
    } catch (error) {
      alert(t("Lỗi khi xóa: ") + (error.response?.data?.message || t("Lỗi hệ thống")));
    }
  };

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'shop_product', label: t('Gian hàng / Sản phẩm') },
    { key: 'rating', label: t('Đánh giá') },
    { key: 'content', label: t('Nội dung') },
    { key: 'date', label: t('Ngày đăng') },
    { key: 'actions', label: t('Thao tác') },
  ];

  return (
    <div className="min-h-full bg-[#f8fafc] p-4 font-sans md:p-6 lg:p-8 flex flex-col">
      <AdminPageHeader
        title={t('Kiểm duyệt Đánh giá')}
        description={t('Quản lý và xóa các đánh giá vi phạm tiêu chuẩn cộng đồng trên hệ thống.')}
      />

      {/* Filter box - Bo góc lg */}
      <div className="bg-white p-5 rounded-lg border border-slate-100 shadow-sm mb-6 mt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
             <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{t('Mã Gian hàng')}</label>
             <input type="number" placeholder={t("Nhập Shop ID")} value={filters.shopId} onChange={(e) => setFilters({...filters, shopId: e.target.value})} className="w-full bg-slate-50 border border-slate-200 py-2.5 px-4 rounded-lg text-sm focus:ring-2 focus:ring-[#2e3785]/20 outline-none" />
          </div>
          <div>
             <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{t('Mã Sản phẩm')}</label>
             <input type="number" placeholder={t("Nhập Product ID")} value={filters.productId} onChange={(e) => setFilters({...filters, productId: e.target.value})} className="w-full bg-slate-50 border border-slate-200 py-2.5 px-4 rounded-lg text-sm focus:ring-2 focus:ring-[#2e3785]/20 outline-none" />
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <button onClick={handleResetFilters} className="px-5 py-2 text-sm font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg transition">{t('Xóa bộ lọc')}</button>
          <button onClick={handleApplyFilters} className="px-5 py-2 text-sm font-bold text-white bg-[#2e3785] hover:bg-[#1f2970] rounded-lg transition shadow-sm">{t('Lọc dữ liệu')}</button>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {/* Bảng dữ liệu theo Component Admin */}
        <AdminDataTable
          columns={columns}
          rows={reviews}
          loading={loading}
          error={errorMsg}
          emptyMessage={t('Không có đánh giá nào phù hợp với bộ lọc.')}
          renderRow={(review) => (
            <tr key={review.id} className="hover:bg-slate-50">
              <td className="px-5 py-4 text-sm font-bold text-slate-500">#{review.id}</td>
              <td className="px-5 py-4">
                <p className="text-sm font-black text-[#2e3785]">Shop: {review.shopId}</p>
                <p className="text-xs font-bold text-slate-500 mt-1">SP: {review.productId}</p>
              </td>
              <td className="px-5 py-4">
                <div className="flex items-center gap-1">
                  <span className="font-black text-slate-800 text-xs mr-1">{review.rating}</span>
                  {renderStars(review.rating)}
                </div>
              </td>
              <td className="px-5 py-4 max-w-[250px]">
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
              <td className="px-5 py-4 text-sm font-medium text-slate-500">{formatDate(review.createdAt)}</td>
              <td className="px-5 py-4 text-right">
                <button onClick={() => handleDelete(review.id)} className="w-8 h-8 rounded-md inline-flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition" title={t('Xóa vi phạm')}>
                  <span className="material-symbols-outlined text-[18px]">delete_forever</span>
                </button>
              </td>
            </tr>
          )}
        />
        
        {/* Phân trang */}
        {!loading && pagination.totalPages > 1 && (
          <div className="mt-4 flex justify-between items-center px-2">
            <span className="text-[10px] md:text-xs font-medium text-slate-400">
              {t('Hiển thị')} {pagination.total > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0} {t('đến')} {Math.min(pagination.page * pagination.limit, pagination.total)} {t('trong số')} {pagination.total} {t('đánh giá')}
            </span>
            <div className="flex gap-1">
              <button disabled={pagination.page <= 1} onClick={() => setPagination({...pagination, page: pagination.page - 1})} className="w-8 h-8 rounded border border-slate-200 text-slate-400 flex items-center justify-center disabled:opacity-50 hover:bg-slate-50 transition-colors"><span className="material-symbols-outlined text-sm">chevron_left</span></button>
              <button disabled={pagination.page >= pagination.totalPages} onClick={() => setPagination({...pagination, page: pagination.page + 1})} className="w-8 h-8 rounded border border-slate-200 text-slate-400 flex items-center justify-center disabled:opacity-50 hover:bg-slate-50 transition-colors"><span className="material-symbols-outlined text-sm">chevron_right</span></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminReviews;