import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axiosClient from '../../utils/axiosClient';

const formatPrice = (price) => new Intl.NumberFormat('vi-VN').format(price);

const getJoinYear = (dateString) => {
    if (!dateString) return '2024';
    return new Date(dateString).getFullYear();
};

const ShopDetail = () => {
    const { id } = useParams();
    
    const [shop, setShop] = useState(null);
    const [stats, setStats] = useState({ productCount: 0, followerCount: 0 });
    const [products, setProducts] = useState([]);
    
    const [loadingShop, setLoadingShop] = useState(true);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        // 1. Gọi API lấy thông tin chi tiết Shop
        const fetchShopDetail = async () => {
            try {
                const res = await axiosClient.get(`/catalog/shops/${id}`);
                const responseData = res.data || res;
                
                if (responseData?.success && responseData?.data) {
                    setShop(responseData.data.shop);
                    setStats(responseData.data.stats || { productCount: 0, followerCount: Math.floor(Math.random() * 500) + 100 });
                } else if (responseData?.shop) {
                    setShop(responseData.shop);
                    setStats(responseData.stats || { productCount: 0, followerCount: Math.floor(Math.random() * 500) + 100 });
                }
            } catch (err) {
                console.error("Lỗi khi tải thông tin shop:", err);
            } finally {
                setLoadingShop(false);
            }
        };

        // 2. Gọi API lấy danh sách sản phẩm của Shop này
        const fetchShopProducts = async () => {
            try {
                const res = await axiosClient.get('/catalog/products', {
                    params: { shopId: id, limit: 20 }
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
                console.error("Lỗi khi tải sản phẩm của shop:", err);
            } finally {
                setLoadingProducts(false);
            }
        };

        fetchShopDetail();
        fetchShopProducts();
    }, [id]);

    const filteredProducts = products.filter(product => 
        product.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loadingShop) {
        return <div className="min-h-screen flex items-center justify-center text-[#2b3896]">Đang tải thông tin gian hàng...</div>;
    }

    if (!shop) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#f9f9fc]">
                <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">store_off</span>
                <h2 className="text-2xl font-bold text-gray-800 mb-2 font-['Be_Vietnam_Pro']">Không tìm thấy cửa hàng</h2>
                <p className="text-gray-500 mb-6">Cửa hàng này có thể đã bị xóa hoặc không tồn tại.</p>
                <Link to="/shops" className="px-6 py-3 bg-[#2b3896] text-white rounded-full font-bold">Quay lại danh sách</Link>
            </div>
        );
    }

    return (
        <main className="pt-16 pb-24 bg-[#f9f9fc] min-h-screen font-['Inter'] text-gray-900">
            {/* Ảnh bìa (Cover) */}
            <section className="relative w-full h-[300px] md:h-[460px] overflow-hidden">
                <img 
                    src="https://images.unsplash.com/photo-1618220179428-22790b46a0eb?q=80&w=2000&auto=format&fit=crop" 
                    alt="Shop Cover" 
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
            </section>

            {/* Header thông tin Shop */}
            <section className="max-w-7xl mx-auto px-6 -mt-16 md:-mt-20 relative z-10">
                <div className="bg-white rounded-3xl p-6 md:p-8 shadow-[0px_12px_48px_rgba(43,56,150,0.08)] flex flex-col md:flex-row md:items-end md:justify-between gap-6 border border-gray-100">
                    <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
                        {/* Avatar Shop */}
                        <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-8 border-white overflow-hidden shadow-lg -mt-20 md:-mt-28 bg-gray-50">
                            <img 
                                src={shop.logoUrl || "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=300&auto=format&fit=crop"} 
                                alt={shop.name} 
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="text-center md:text-left">
                            <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-[#2b3896] font-['Be_Vietnam_Pro'] mb-3">
                                {shop.name}
                            </h1>
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-gray-600 font-medium text-sm md:text-base">
                                <span className="flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[18px]">group</span> 
                                    {stats.followerCount} Người theo dõi
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="material-symbols-outlined text-yellow-500 text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span> 
                                    4.9 Đánh giá
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[18px]">calendar_today</span> 
                                    Tham gia: {getJoinYear(shop.createdAt)}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-3 justify-center w-full md:w-auto">
                        <button className="flex-1 md:flex-none px-8 py-3 bg-gradient-to-br from-[#2b3896] to-[#4551af] text-white font-bold rounded-full shadow-lg hover:shadow-[#2b3896]/30 transition-all active:scale-95">
                            Theo dõi
                        </button>
                        <button className="p-3 bg-gray-100 text-[#2b3896] rounded-full hover:bg-gray-200 transition-all">
                            <span className="material-symbols-outlined">share</span>
                        </button>
                    </div>
                </div>
            </section>

            {/* Khu vực Nội dung Shop */}
            <section className="max-w-7xl mx-auto px-6 mt-12">
                {/* Thanh Tìm kiếm & Lọc trong Shop */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div className="flex items-center bg-white border border-gray-200 rounded-full px-6 py-3 w-full md:max-w-md focus-within:ring-2 ring-[#2b3896]/20 transition-all shadow-sm">
                        <span className="material-symbols-outlined text-gray-400">search</span>
                        <input 
                            type="text" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Tìm kiếm trong gian hàng..." 
                            className="bg-transparent border-none outline-none w-full ml-3 text-gray-800 placeholder:text-gray-400 font-medium"
                        />
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0">
                        <button className="whitespace-nowrap px-6 py-2.5 rounded-full bg-[#2b3896] text-white font-bold shadow-md">
                            Tất cả sản phẩm
                        </button>
                        <button className="whitespace-nowrap px-6 py-2.5 rounded-full bg-white border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-colors">
                            Danh mục Shop
                        </button>
                        <button className="whitespace-nowrap px-6 py-2.5 rounded-full bg-white border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-colors">
                            Đánh giá
                        </button>
                    </div>
                </div>

                {/* Lưới Sản phẩm */}
                {loadingProducts ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[1,2,3,4].map(i => (
                            <div key={i} className="bg-white rounded-3xl p-4 animate-pulse">
                                <div className="w-full aspect-[4/5] bg-gray-200 rounded-2xl mb-4"></div>
                                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                            </div>
                        ))}
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-gray-100">
                        <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">inventory_2</span>
                        <h3 className="text-xl font-bold text-gray-800 mb-2 font-['Be_Vietnam_Pro']">Gian hàng trống</h3>
                        <p className="text-gray-500">Chưa có sản phẩm nào khớp với tìm kiếm của bạn.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {filteredProducts.map(product => (
                            <div key={product.id} className="group bg-white border border-gray-100 rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[0px_24px_48px_rgba(43,56,150,0.08)] relative flex flex-col">
                                <Link to={`/product/${product.id}`} className="aspect-[4/5] overflow-hidden bg-gray-50 block">
                                    <img 
                                        src={product.thumbnailUrl || "https://via.placeholder.com/400x500"} 
                                        alt={product.name} 
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                                    />
                                </Link>
                                <div className="p-6 flex flex-col flex-grow">
                                    <div className="flex justify-between items-start mb-2 gap-2">
                                        <Link to={`/product/${product.id}`}>
                                            <h3 className="text-lg font-bold text-gray-900 leading-tight font-['Be_Vietnam_Pro'] group-hover:text-[#2b3896] transition-colors line-clamp-2">
                                                {product.name}
                                            </h3>
                                        </Link>
                                    </div>
                                    <div className="flex items-center gap-1 mb-4 mt-auto">
                                        <span className="material-symbols-outlined text-yellow-500 text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                        <span className="text-sm font-medium text-gray-500">4.9 (124)</span>
                                    </div>
                                    <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-xl font-black text-[#2b3896]">{formatPrice(product.price)}</span>
                                            <span className="text-xs font-bold text-[#2b3896] opacity-70 uppercase tracking-wider">₫</span>
                                        </div>
                                        <button className="w-10 h-10 flex items-center justify-center bg-[#f4f5fa] text-[#2b3896] rounded-full hover:bg-[#2b3896] hover:text-white transition-colors">
                                            <span className="material-symbols-outlined text-[20px]">add_shopping_cart</span>
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

export default ShopDetail;