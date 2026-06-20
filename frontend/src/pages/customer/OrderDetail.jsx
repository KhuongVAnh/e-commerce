import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { orderService } from '../../services/orderService';
import axiosClient from '../../utils/axiosClient'; // THÊM IMPORT ĐỂ GỌI API REVIEW

const formatPrice = (price) => new Intl.NumberFormat('vi-VN').format(price);

export default function OrderDetail() {
    const { id } = useParams(); 
    const { t } = useTranslation();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isCancelling, setIsCancelling] = useState(false);
    const [isPaying, setIsPaying] = useState(false);
    
    const [popup, setPopup] = useState({ isOpen: false, message: '', type: 'error' });

    // ==== THÊM MỚI: CÁC STATE CHO CHỨC NĂNG REVIEW ====
    const [eligibility, setEligibility] = useState({}); 
    const [reviewModal, setReviewModal] = useState({ isOpen: false, item: null });
    const [reviewForm, setReviewForm] = useState({ rating: 5, commentText: '', images: [] });
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);
    const fileInputRef = useRef(null);
    // ===================================================

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const res = await orderService.getOrderDetail(id); 
                if (res.data?.order) {
                    setOrder(res.data.order);
                } else {
                    setPopup({ isOpen: true, message: t('Không thể tải dữ liệu đơn hàng. Cấu trúc dữ liệu không khớp.'), type: 'error' });
                }
            } catch (error) {
                console.error("Lỗi lấy chi tiết đơn hàng:", error);
                setPopup({ isOpen: true, message: error.message || t('Có lỗi xảy ra khi lấy thông tin đơn hàng.'), type: 'error' });
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [id, t]);

    // ==== THÊM MỚI: KIỂM TRA QUYỀN ĐÁNH GIÁ (API 7) ====
    useEffect(() => {
        if (order && order.orderStatus === 'DELIVERED' && Array.isArray(order.items)) {
            const checkEligibility = async () => {
                const newEligibility = {};
                for (const item of order.items) {
                    try {
                        const res = await axiosClient.get(`/commerce/reviews/eligibility?orderItemId=${item.id}`);
                        const data = res.data?.data || res.data;
                        newEligibility[item.id] = data?.canReview || false;
                    } catch (err) {
                        newEligibility[item.id] = false;
                    }
                }
                setEligibility(newEligibility);
            };
            checkEligibility();
        }
    }, [order]);
    // ===================================================

    const closePopup = () => setPopup({ isOpen: false, message: '', type: 'error' });

    const handleContinuePayment = async () => {
        if (!order?.orderCode) return;

        setIsPaying(true);
        try {
            const res = await orderService.getPaymentUrl(order.orderCode);
            const paymentUrl = res.data?.paymentUrl;

            if (!paymentUrl) {
                setPopup({ isOpen: true, message: t('Không lấy được link thanh toán cho đơn hàng này.'), type: 'error' });
                return;
            }

            sessionStorage.setItem('currentOrderCode', order.orderCode);
            window.location.href = paymentUrl;
        } catch (error) {
            console.error("Lỗi lấy link thanh toán:", error);
            setPopup({ isOpen: true, message: error.message || t('Không thể tiếp tục thanh toán. Vui lòng thử lại.'), type: 'error' });
        } finally {
            setIsPaying(false);
        }
    };

    const handleCancelOrder = async () => {
        if (!window.confirm(t("Bạn có chắc chắn muốn hủy đơn hàng này không? Hành động này không thể hoàn tác."))) return;
        
        setIsCancelling(true);
        try {
            const res = await orderService.cancelOrder(order.orderCode);

            if (res.success) {
                setOrder(prev => ({ ...prev, orderStatus: 'CANCELLED' }));
                setPopup({ isOpen: true, message: t('Đã hủy đơn hàng thành công!'), type: 'success' });
            } else {
                setPopup({ isOpen: true, message: res.message || t('Không thể hủy đơn hàng.'), type: 'error' });
            }
        } catch (error) {
            console.error("Lỗi khi hủy đơn:", error);
            setPopup({ isOpen: true, message: error.message || t('Có lỗi xảy ra khi hủy đơn hàng.'), type: 'error' });
        } finally {
            setIsCancelling(false);
        }
    };

    // ==== THÊM MỚI: XỬ LÝ GỬI ĐÁNH GIÁ (API 3) VÀ UPLOAD ẢNH ====
    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length + reviewForm.images.length > 5) {
            alert(t("Bạn chỉ được tải lên tối đa 5 ảnh."));
            return;
        }
        setReviewForm(prev => ({ ...prev, images: [...prev.images, ...files] }));
        e.target.value = '';
    };

    const removeImage = (index) => {
        setReviewForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if (reviewForm.rating < 1 || reviewForm.rating > 5) {
            alert(t("Số sao không hợp lệ."));
            return;
        }
        setIsSubmittingReview(true);
        try {
            // 1. Upload ảnh tuần tự (nếu có)
            const uploadedUrls = [];
            for (const file of reviewForm.images) {
                const formData = new FormData();
                formData.append('image', file);
                const uploadRes = await axiosClient.post('/uploads/images', formData);
                const url = uploadRes.data?.data?.url || uploadRes.data?.url || uploadRes.url;
                if (url) uploadedUrls.push(url);
            }

            // 2. Gọi API tạo Review
            await axiosClient.post('/commerce/reviews', {
                orderItemId: String(reviewModal.item.id),
                rating: reviewForm.rating,
                commentText: reviewForm.commentText,
                imageUrls: uploadedUrls
            });

            setPopup({ isOpen: true, message: t('Đánh giá sản phẩm thành công! Cảm ơn bạn.'), type: 'success' });
            
            // Cập nhật lại UI: Ẩn nút đánh giá của item vừa đánh giá
            setEligibility(prev => ({ ...prev, [reviewModal.item.id]: false }));
            setReviewModal({ isOpen: false, item: null });
            setReviewForm({ rating: 5, commentText: '', images: [] });
        } catch (error) {
            console.error("Lỗi gửi đánh giá:", error);
            setPopup({ isOpen: true, message: error.response?.data?.message || t('Có lỗi xảy ra khi gửi đánh giá.'), type: 'error' });
        } finally {
            setIsSubmittingReview(false);
        }
    };
    // ============================================================

    if (loading) {
        return (
            <div className="pt-32 pb-24 text-center min-h-screen bg-[#f9f9fc]">
                <span className="material-symbols-outlined animate-spin text-5xl text-[#2b3896]">progress_activity</span>
                <p className="mt-4 text-gray-500 font-medium">{t('Đang tải chi tiết đơn hàng...')}</p>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="pt-32 text-center min-h-screen bg-[#f9f9fc]">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('Không tìm thấy đơn hàng!')}</h2>
                <Link to="/orders" className="text-[#2b3896] hover:underline font-medium">{t('Quay lại danh sách đơn hàng')}</Link>
            </div>
        );
    }

    const canCancel = ['PENDING', 'AWAITING_PAYMENT', 'CONFIRMED'].includes(order.orderStatus);
    const canContinuePayment = order.paymentMethod === 'VNPAY'
        && ['PENDING', 'FAILED'].includes(order.paymentStatus)
        && !['CANCELLED', 'PROCESSING', 'SHIPPING', 'DELIVERED'].includes(order.orderStatus);

    const getStepStatus = (status) => {
        if (status === 'CANCELLED') return -1;
        if (['PENDING', 'AWAITING_PAYMENT'].includes(status)) return 1;
        if (['CONFIRMED', 'PROCESSING'].includes(status)) return 2;
        if (status === 'SHIPPING') return 3;
        if (status === 'DELIVERED') return 4;
        return 1;
    };
    const currentStep = getStepStatus(order.orderStatus);

    return (
        <main className="pt-32 pb-24 px-6 md:px-12 max-w-screen-xl mx-auto font-['Inter'] bg-[#f9f9fc] min-h-screen">
            
            <Link to="/orders" className="inline-flex items-center gap-2 text-gray-500 hover:text-[#2b3896] transition-colors mb-8 font-medium">
                <span className="material-symbols-outlined text-sm">arrow_back</span>
                {t('Quay lại danh sách')}
            </Link>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                <div>
                    <span className="text-sm font-bold tracking-widest text-[#2b3896] uppercase mb-2 block">{t('Order Receipt')}</span>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tighter font-['Be_Vietnam_Pro']">#{order.orderCode}</h1>
                    <p className="text-gray-500 mt-2 font-medium">
                        {t('Đặt ngày')} {new Date(order.createdAt).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>
                <div className="flex flex-wrap gap-4">
                    {canContinuePayment && (
                        <button
                            onClick={handleContinuePayment}
                            disabled={isPaying}
                            className="bg-[#2b3896] text-white px-6 py-3 rounded-full font-semibold transition-all duration-300 hover:bg-[#1f2970] flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        >
                            {isPaying ? (
                                <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                            ) : (
                                <span className="material-symbols-outlined text-sm">payments</span>
                            )}
                            {isPaying ? t('Đang lấy link...') : t('Tiếp tục thanh toán')}
                        </button>
                    )}

                    {canCancel && (
                        <button 
                            onClick={handleCancelOrder}
                            disabled={isCancelling}
                            className="bg-red-50 text-red-600 border border-red-200 px-6 py-3 rounded-full font-semibold transition-all duration-300 hover:bg-red-100 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        >
                            {isCancelling ? (
                                <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                            ) : (
                                <span className="material-symbols-outlined text-sm">cancel</span>
                            )}
                            {isCancelling ? t('Đang xử lý...') : t('Hủy đơn hàng')}
                        </button>
                    )}
                </div>
            </div>

            {currentStep !== -1 ? (
                <div className="bg-white p-8 md:p-12 rounded-xl shadow-[0px_12px_32px_rgba(43,56,150,0.06)] mb-8">
                    <div className="relative flex items-center justify-between w-full">
                        <div className="absolute h-1 w-full bg-gray-100 rounded-full top-1/2 -translate-y-1/2"></div>
                        <div 
                            className="absolute h-1 bg-[#2b3896] rounded-full top-1/2 -translate-y-1/2 transition-all duration-1000"
                            style={{ width: currentStep === 1 ? '0%' : currentStep === 2 ? '33.33%' : currentStep === 3 ? '66.66%' : '100%' }}
                        ></div>

                        <div className="relative z-10 flex flex-col items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${currentStep >= 1 ? 'bg-[#2b3896]' : 'bg-gray-200 text-gray-400'}`}>
                                <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                            </div>
                            <span className={`text-sm font-bold ${currentStep >= 1 ? 'text-[#2b3896]' : 'text-gray-400'}`}>{t('Đã đặt')}</span>
                        </div>

                        <div className="relative z-10 flex flex-col items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${currentStep >= 2 ? 'bg-[#2b3896]' : 'bg-gray-200 text-gray-400'}`}>
                                <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                            </div>
                            <span className={`text-sm font-bold ${currentStep >= 2 ? 'text-[#2b3896]' : 'text-gray-400'}`}>{t('Xác nhận')}</span>
                        </div>

                        <div className="relative z-10 flex flex-col items-center gap-3">
                            {currentStep === 3 ? (
                                <div className="w-12 h-12 rounded-full bg-white border-4 border-[#2b3896] flex items-center justify-center text-[#2b3896] ring-8 ring-[#2b3896]/5">
                                    <span className="material-symbols-outlined text-2xl animate-pulse">local_shipping</span>
                                </div>
                            ) : (
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${currentStep > 3 ? 'bg-[#2b3896]' : 'bg-gray-200 text-gray-400'}`}>
                                    <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                </div>
                            )}
                            <span className={`text-sm font-bold ${currentStep >= 3 ? 'text-[#2b3896]' : 'text-gray-400'}`}>{t('Đang giao')}</span>
                        </div>

                        <div className="relative z-10 flex flex-col items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${currentStep === 4 ? 'bg-[#2b3896] text-white' : 'bg-gray-100 text-gray-400'}`}>
                                <span className="material-symbols-outlined text-xl">inventory_2</span>
                            </div>
                            <span className={`text-sm font-medium ${currentStep === 4 ? 'text-[#2b3896] font-bold' : 'text-gray-500'}`}>{t('Thành công')}</span>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-red-50 p-6 rounded-xl border border-red-100 mb-8 flex items-center gap-4 text-red-700 shadow-sm">
                    <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>cancel</span>
                    <div>
                        <h3 className="font-bold text-lg">{t('Đơn hàng đã bị hủy')}</h3>
                        <p className="text-sm mt-1">{t('Đơn hàng này không còn hiệu lực. Vui lòng liên hệ bộ phận hỗ trợ nếu bạn cần thêm thông tin.')}</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gray-50/50 border border-gray-100 p-8 rounded-xl relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-[#2b3896]"></div>
                            <h3 className="text-lg font-bold mb-4 text-gray-900 flex items-center gap-2 font-['Be_Vietnam_Pro']">
                                <span className="material-symbols-outlined text-[#2b3896]">location_on</span>
                                {t('Thông tin nhận hàng')}
                            </h3>
                            <div className="text-gray-600 space-y-1 leading-relaxed text-sm">
                                <p className="font-bold text-gray-900 text-base mb-2">{order.receiverName}</p>
                                <p>{order.receiverPhone}</p>
                                <p className="mt-2">{order.receiverAddress}</p>
                                {order.note && <p className="mt-3 italic text-gray-500">{t('Ghi chú:')} {order.note}</p>}
                            </div>
                        </div>

                        <div className="bg-gray-50/50 border border-gray-100 p-8 rounded-xl relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                            <h3 className="text-lg font-bold mb-4 text-gray-900 flex items-center gap-2 font-['Be_Vietnam_Pro']">
                                <span className="material-symbols-outlined text-emerald-600">payments</span>
                                {t('Thanh toán')}
                            </h3>
                            <div className="space-y-5">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">{t('Phương thức')}</p>
                                    <div className="flex items-center gap-3">
                                        <div className="px-3 py-1 bg-white rounded-lg shadow-sm border border-gray-200 font-bold text-[#2b3896] italic text-sm">
                                            {order.paymentMethod === 'VNPAY' ? 'VNPay' : 'COD'}
                                        </div>
                                        <p className="font-medium text-gray-700 text-sm">
                                            {order.paymentMethod === 'VNPAY' ? t('Thanh toán trực tuyến') : t('Thanh toán khi nhận hàng')}
                                        </p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">{t('Trạng thái')}</p>
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                                        order.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-800' :
                                        order.paymentStatus === 'FAILED' ? 'bg-red-100 text-red-800' :
                                        'bg-orange-100 text-orange-800'
                                    }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${
                                            order.paymentStatus === 'PAID' ? 'bg-emerald-600' :
                                            order.paymentStatus === 'FAILED' ? 'bg-red-600' :
                                            'bg-orange-600'
                                        }`}></span>
                                        {order.paymentStatus}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl overflow-hidden shadow-[0px_12px_32px_rgba(43,56,150,0.04)] border border-gray-100">
                        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-gray-900 font-['Be_Vietnam_Pro']">{t('Sản phẩm đã đặt')}</h3>
                            <span className="text-sm font-medium text-gray-500">{order.items?.length || 0} {t('sản phẩm')}</span>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {order.items?.map((item, index) => (
                                <div key={index} className="p-8 flex flex-col sm:flex-row items-center gap-8 group">
                                    <div className="w-24 h-32 flex-shrink-0 bg-gray-50 overflow-hidden rounded-lg border border-gray-100">
                                        {item.thumbnailUrl ? (
                                            <img
                                                src={item.thumbnailUrl}
                                                alt={item.productNameSnapshot}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <span className="material-symbols-outlined text-4xl text-gray-300">inventory_2</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-grow text-center sm:text-left">
                                        <h4 className="text-lg font-bold text-indigo-900 mb-1 group-hover:text-[#2b3896] transition-colors line-clamp-2">
                                            {item.productNameSnapshot}
                                        </h4>
                                        <p className="text-sm text-gray-500 mb-2">{t('Đơn giá:')} {formatPrice(item.priceSnapshot)}₫</p>
                                        <span className="text-xs font-bold px-2 py-1 bg-gray-100 rounded uppercase tracking-tighter text-gray-500">
                                            SKU: EM-PRD-{(item.productId || '000').toString().padStart(3, '0')}
                                        </span>
                                        
                                        {/* ==== NÚT VIẾT ĐÁNH GIÁ (HIỂN THỊ NẾU ĐƯỢC PHÉP THEO API) ==== */}
                                        {eligibility[item.id] && (
                                            <div className="mt-4 flex justify-center sm:justify-start">
                                                <button 
                                                    onClick={() => {
                                                        setReviewModal({ isOpen: true, item });
                                                        setReviewForm({ rating: 5, commentText: '', images: [] });
                                                    }}
                                                    className="px-4 py-2 border border-orange-500 text-orange-600 text-xs font-bold rounded-lg hover:bg-orange-50 transition-colors flex items-center gap-1.5"
                                                >
                                                    <span className="material-symbols-outlined text-[14px]">rate_review</span>
                                                    {t('Viết đánh giá')}
                                                </button>
                                            </div>
                                        )}
                                        {/* ========================================================== */}
                                    </div>
                                    <div className="text-center sm:text-right flex flex-col gap-1 min-w-[100px]">
                                        <p className="text-gray-500 font-medium">{t('SL:')} {item.quantity}</p>
                                        <p className="text-lg font-bold text-gray-900">
                                            {formatPrice(item.subtotal)} <span className="text-xs opacity-60 font-normal">₫</span>
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white p-8 rounded-xl shadow-[0px_12px_32px_rgba(43,56,150,0.06)] border border-gray-100 sticky top-28">
                        <h3 className="text-xl font-bold mb-8 text-gray-900 border-b border-gray-100 pb-4 font-['Be_Vietnam_Pro']">{t('Tổng kết')}</h3>
                        
                        <div className="space-y-4 mb-8 text-sm">
                            <div className="flex justify-between items-center text-gray-600">
                                <span className="font-medium">{t('Tạm tính')}</span>
                                <span className="font-semibold text-gray-900">{formatPrice(order.totalAmount - (order.shippingFee || 0))} <span className="text-[10px] opacity-70">₫</span></span>
                            </div>
                            <div className="flex justify-between items-center text-gray-600">
                                <span className="font-medium">{t('Phí vận chuyển')}</span>
                                <span className="font-semibold text-gray-900">{formatPrice(order.shippingFee || 0)} <span className="text-[10px] opacity-70">₫</span></span>
                            </div>
                        </div>

                        <div className="pt-6 border-t-2 border-gray-100 mb-8">
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">{t('Tổng cộng')}</p>
                                    <p className="text-3xl font-black text-[#2b3896] leading-none">
                                        {formatPrice(order.totalAmount)} <span className="text-sm font-bold align-top">₫</span>
                                    </p>
                                </div>
                                <span className="material-symbols-outlined text-[#bcc2ff] text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl flex gap-3">
                                <span className="material-symbols-outlined text-[#2b3896] text-xl">info</span>
                                <p className="text-xs text-gray-600 leading-relaxed">
                                    {t('Mọi thắc mắc về quá trình vận chuyển, vui lòng liên hệ với nhà bán hàng hoặc trung tâm hỗ trợ.')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ==== THÊM MỚI: MODAL GIAO DIỆN VIẾT ĐÁNH GIÁ ==== */}
            {reviewModal.isOpen && reviewModal.item && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between p-5 border-b border-gray-100 shrink-0">
                            <h3 className="text-lg font-bold text-gray-900 font-['Be_Vietnam_Pro']">{t('Đánh giá sản phẩm')}</h3>
                            <button onClick={() => setReviewModal({ isOpen: false, item: null })} className="text-gray-400 hover:text-gray-800 transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmitReview} className="p-6 overflow-y-auto custom-scrollbar">
                            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-50">
                                <img src={reviewModal.item.thumbnailUrl || 'https://via.placeholder.com/150'} alt="Product" className="w-16 h-16 rounded-md object-cover border border-gray-100" />
                                <div>
                                    <p className="text-sm font-bold text-gray-900 line-clamp-2">{reviewModal.item.productNameSnapshot}</p>
                                    <p className="text-xs text-gray-500 mt-1">SKU: EM-PRD-{reviewModal.item.productId}</p>
                                </div>
                            </div>

                            <div className="mb-6 text-center">
                                <p className="text-sm font-bold text-gray-700 mb-3">{t('Chất lượng sản phẩm')}</p>
                                <div className="flex justify-center gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button 
                                            type="button" 
                                            key={star} 
                                            onClick={() => setReviewForm(prev => ({...prev, rating: star}))}
                                            className={`transition-transform hover:scale-110 ${star <= reviewForm.rating ? 'text-yellow-400' : 'text-gray-200'}`}
                                        >
                                            <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="mb-5">
                                <textarea 
                                    placeholder={t("Hãy chia sẻ nhận xét của bạn về sản phẩm này nhé (không bắt buộc)...")}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm outline-none focus:border-[#2b3896] resize-none h-28"
                                    value={reviewForm.commentText}
                                    onChange={(e) => setReviewForm(prev => ({...prev, commentText: e.target.value}))}
                                />
                            </div>

                            <div>
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    multiple 
                                    hidden 
                                    ref={fileInputRef} 
                                    onChange={handleImageChange} 
                                />
                                <div className="flex flex-wrap gap-3">
                                    {reviewForm.images.map((img, idx) => (
                                        <div key={idx} className="w-16 h-16 relative rounded-lg overflow-hidden border border-gray-200 group">
                                            <img src={URL.createObjectURL(img)} alt="Preview" className="w-full h-full object-cover" />
                                            <button 
                                                type="button" 
                                                onClick={() => removeImage(idx)} 
                                                className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <span className="material-symbols-outlined text-sm">delete</span>
                                            </button>
                                        </div>
                                    ))}
                                    {reviewForm.images.length < 5 && (
                                        <button 
                                            type="button" 
                                            onClick={() => fileInputRef.current.click()} 
                                            className="w-16 h-16 rounded-lg border-2 border-dashed border-[#2b3896]/30 text-[#2b3896] hover:bg-[#2b3896]/5 transition-colors flex flex-col items-center justify-center"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">add_photo_alternate</span>
                                        </button>
                                    )}
                                </div>
                                <p className="text-[10px] text-gray-400 mt-2 font-medium">{t('Tối đa 5 hình ảnh.')}</p>
                            </div>
                        </form>

                        <div className="p-5 border-t border-gray-100 flex gap-3 shrink-0">
                            <button 
                                type="button" 
                                onClick={() => setReviewModal({ isOpen: false, item: null })}
                                className="flex-1 py-3 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                            >
                                {t('Hủy')}
                            </button>
                            <button 
                                onClick={handleSubmitReview}
                                disabled={isSubmittingReview}
                                className="flex-1 py-3 text-sm font-bold text-white bg-[#2b3896] hover:bg-[#1f2970] rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                            >
                                {isSubmittingReview ? <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span> : null}
                                {t('Gửi đánh giá')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* ======================================================== */}

            {popup.isOpen && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
                    <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl transform transition-all text-center border border-gray-100">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${popup.type === 'success' ? 'bg-emerald-100' : 'bg-red-100'}`}>
                            <span 
                                className={`material-symbols-outlined text-3xl ${popup.type === 'success' ? 'text-emerald-600' : 'text-red-600'}`} 
                                style={{ fontVariationSettings: "'FILL' 1" }}
                            >
                                {popup.type === 'success' ? 'check_circle' : 'error'}
                            </span>
                        </div>
                        
                        <h3 className="text-xl font-bold text-gray-900 mb-2 font-['Be_Vietnam_Pro']">{t('Thông báo')}</h3>
                        <p className="text-gray-600 mb-8 text-sm leading-relaxed">{popup.message}</p>
                        
                        <button 
                            onClick={closePopup} 
                            className={`w-full font-bold py-3.5 rounded-xl active:scale-95 transition-all text-white ${
                                popup.type === 'success' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-gray-800 hover:bg-gray-900'
                            }`}
                        >
                            {t('Đóng')}
                        </button>
                    </div>
                </div>
            )}
        </main>
    );
}