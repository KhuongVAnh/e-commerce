import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../../utils/axiosClient';

// Hàm render sao thuần túy hiển thị UI
const renderStars = (rating) => {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <span 
        key={i} 
        className={`material-symbols-outlined text-[16px] ${i <= rating ? 'text-yellow-400' : 'text-gray-300'}`} 
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        star
      </span>
    );
  }
  return stars;
};

export default function MyReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1 });
  
  // States Modal sửa review (Tích hợp API 4)
  const [editModal, setEditModal] = useState({ isOpen: false, reviewId: null });
  const [editForm, setEditForm] = useState({ rating: 5, commentText: '', newImages: [], existingImageUrls: [] });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  // ==== API 6: XEM REVIEW CỦA CHÍNH MÌNH ====
  const fetchMyReviews = async (page = 1) => {
    setLoading(true);
    try {
      const res = await axiosClient.get(`/commerce/reviews/my?page=${page}&limit=${pagination.limit}`);
      // Lấy data chuẩn theo format chuẩn của hệ thống: { success, data, meta }
      const responseData = res.data?.data || res.data;
      setReviews(responseData?.reviews || []);
      
      const responseMeta = res.data?.meta || res.meta;
      if (responseMeta?.pagination) {
        setPagination({
          page: responseMeta.pagination.page,
          limit: responseMeta.pagination.limit,
          totalPages: responseMeta.pagination.totalPages,
        });
      }
    } catch (error) {
      console.error("Lỗi lấy lịch sử đánh giá:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyReviews(pagination.page);
  }, [pagination.page]);

  // ==== API 5: XÓA REVIEW ====
  const handleDelete = async (reviewId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bài đánh giá này? Hành động này không thể hoàn tác.")) return;
    try {
      await axiosClient.delete(`/commerce/reviews/${reviewId}`);
      alert("Đã xóa đánh giá thành công.");
      fetchMyReviews(pagination.page); // Tải lại danh sách sau khi xóa
    } catch (error) {
      alert("Không thể xóa: " + (error.response?.data?.message || "Lỗi hệ thống"));
    }
  };

  // ==== API 4: CẬP NHẬT REVIEW (Xử lý mở form và nạp data cũ) ====
  const openEditModal = (review) => {
    setEditForm({
      rating: review.rating || 5,
      commentText: review.commentText || '',
      existingImageUrls: Array.isArray(review.imageUrls) ? review.imageUrls : [],
      newImages: []
    });
    setEditModal({ isOpen: true, reviewId: review.id });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + editForm.existingImageUrls.length + editForm.newImages.length > 5) {
      alert("Chỉ được lưu tối đa 5 ảnh."); 
      return;
    }
    setEditForm(prev => ({ ...prev, newImages: [...prev.newImages, ...files] }));
    e.target.value = '';
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    if (editForm.rating < 1 || editForm.rating > 5) {
      alert("Số sao không hợp lệ.");
      return;
    }

    setIsSubmitting(true);
    try {
      // BƯỚC 1: Upload ảnh mới tuần tự (nếu có)
      const uploadedUrls = [];
      for (const file of editForm.newImages) {
        const formData = new FormData();
        formData.append('image', file);
        const uploadRes = await axiosClient.post('/uploads/images', formData);
        const url = uploadRes.data?.data?.url || uploadRes.data?.url || uploadRes.url;
        if (url) uploadedUrls.push(url);
      }

      // BƯỚC 2: Gộp mảng ảnh cũ giữ lại + ảnh vừa upload thành công
      const finalImageUrls = [...editForm.existingImageUrls, ...uploadedUrls];

      // BƯỚC 3: Gọi PATCH gửi body chuẩn tài liệu
      await axiosClient.patch(`/commerce/reviews/${editModal.reviewId}`, {
        rating: editForm.rating,
        commentText: editForm.commentText,
        imageUrls: finalImageUrls
      });

      alert("Cập nhật đánh giá thành công!");
      setEditModal({ isOpen: false, reviewId: null });
      fetchMyReviews(pagination.page); // Gọi lại API để load data mới
    } catch (error) {
      alert("Lỗi cập nhật: " + (error.response?.data?.message || "Lỗi hệ thống"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-6 min-h-screen bg-[#f9f9fc] font-['Inter']">
      <div className="flex items-center gap-4 mb-8">
        <Link to="/profile" className="text-gray-400 hover:text-[#2b3896] transition-colors">
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <h1 className="text-2xl font-extrabold text-gray-900 font-['Be_Vietnam_Pro']">Đánh giá của tôi</h1>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <span className="material-symbols-outlined animate-spin text-4xl text-[#2b3896]">progress_activity</span>
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-gray-100 shadow-[0px_4px_16px_rgba(43,56,150,0.03)]">
          <span className="material-symbols-outlined text-5xl text-gray-300 mb-3">rate_review</span>
          <p className="text-gray-500 font-medium">Bạn chưa có bài đánh giá nào.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white p-6 rounded-xl border border-gray-100 shadow-[0px_4px_16px_rgba(43,56,150,0.03)]">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-sm font-bold text-[#2b3896] mb-1">
                    Sản phẩm ID: {review.productId} 
                    <span className="text-gray-400 font-medium ml-1">(Đơn hàng: {review.orderItemId})</span>
                  </h3>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex">{renderStars(review.rating)}</div>
                    <span className="text-xs text-gray-400 font-medium">
                      {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => openEditModal(review)} 
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Sửa đánh giá"
                  >
                    <span className="material-symbols-outlined text-[18px]">edit</span>
                  </button>
                  <button 
                    onClick={() => handleDelete(review.id)} 
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Xóa đánh giá"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              </div>

              <div className="bg-gray-50/50 p-4 rounded-lg border border-gray-50">
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed font-medium">
                  {review.commentText || <span className="italic text-gray-400">Không có nội dung nhận xét.</span>}
                </p>
                {review.imageUrls && Array.isArray(review.imageUrls) && review.imageUrls.length > 0 && (
                  <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-100">
                    {review.imageUrls.map((img, idx) => (
                      <img key={idx} src={img} alt="review" className="w-16 h-16 object-cover rounded-lg border border-gray-200" />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Phân trang chuẩn */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <button 
                disabled={pagination.page <= 1} 
                onClick={() => setPagination(p => ({...p, page: p.page - 1}))} 
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-sm">chevron_left</span>
              </button>
              <span className="text-sm font-bold text-gray-600 flex items-center px-4">
                Trang {pagination.page} / {pagination.totalPages}
              </span>
              <button 
                disabled={pagination.page >= pagination.totalPages} 
                onClick={() => setPagination(p => ({...p, page: p.page + 1}))} 
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* MODAL SỬA ĐÁNH GIÁ */}
      {editModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold font-['Be_Vietnam_Pro'] text-gray-900">Sửa Đánh Giá</h3>
              <button onClick={() => setEditModal({ isOpen: false, reviewId: null })} className="text-gray-400 hover:text-gray-800">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={submitEdit}>
              <div className="flex justify-center gap-2 mb-6">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button 
                    type="button" 
                    key={star} 
                    onClick={() => setEditForm(prev => ({...prev, rating: star}))} 
                    className={`transition-transform hover:scale-110 ${star <= editForm.rating ? 'text-yellow-400' : 'text-gray-200'}`}
                  >
                    <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  </button>
                ))}
              </div>
              
              <textarea 
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm mb-4 outline-none focus:border-[#2b3896] resize-none" 
                rows="4" 
                placeholder="Viết nhận xét của bạn..."
                value={editForm.commentText} 
                onChange={(e) => setEditForm(prev => ({...prev, commentText: e.target.value}))} 
              />
              
              <input type="file" accept="image/*" multiple hidden ref={fileInputRef} onChange={handleImageChange} />
              <div className="flex flex-wrap gap-3 mb-8">
                {/* Hiển thị ảnh cũ (nếu có) */}
                {editForm.existingImageUrls.map((img, idx) => (
                  <div key={`old-${idx}`} className="w-16 h-16 relative group rounded-lg overflow-hidden border border-gray-200">
                    <img src={img} className="w-full h-full object-cover" alt="" />
                    <button 
                      type="button" 
                      onClick={() => setEditForm(p => ({...p, existingImageUrls: p.existingImageUrls.filter((_,i)=>i!==idx)}))} 
                      className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                ))}
                {/* Hiển thị ảnh mới chọn chuẩn bị upload */}
                {editForm.newImages.map((img, idx) => (
                  <div key={`new-${idx}`} className="w-16 h-16 relative group rounded-lg overflow-hidden border border-gray-200">
                    <img src={URL.createObjectURL(img)} className="w-full h-full object-cover opacity-80" alt="" />
                    <button 
                      type="button" 
                      onClick={() => setEditForm(p => ({...p, newImages: p.newImages.filter((_,i)=>i!==idx)}))} 
                      className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                ))}
                {/* Nút thêm ảnh */}
                {editForm.existingImageUrls.length + editForm.newImages.length < 5 && (
                  <button 
                    type="button" 
                    onClick={() => fileInputRef.current.click()} 
                    className="w-16 h-16 rounded-lg border-2 border-dashed border-[#2b3896]/30 flex items-center justify-center text-[#2b3896] hover:bg-[#2b3896]/5 transition-colors"
                  >
                    <span className="material-symbols-outlined text-2xl">add_photo_alternate</span>
                  </button>
                )}
              </div>

              <div className="flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setEditModal({ isOpen: false, reviewId: null })} 
                  className="flex-1 py-3 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl font-bold transition-colors"
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="flex-1 py-3 bg-[#2b3896] text-white hover:bg-[#1f2970] rounded-xl font-bold transition-colors disabled:opacity-60 flex justify-center items-center gap-2"
                >
                  {isSubmitting && <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>}
                  {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}