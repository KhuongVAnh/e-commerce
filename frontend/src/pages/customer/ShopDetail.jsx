import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import axiosClient from '../../utils/axiosClient';

const formatPrice = (price) => new Intl.NumberFormat('vi-VN').format(price);

const getJoinYear = (dateString) => {
    if (!dateString) return '2024';
    return new Date(dateString).getFullYear();
};

const ShopDetail = () => {
    const { slug } = useParams();
    const id = slug?.includes('-id') ? slug.split('-id').pop() : slug;
    
    const [shop, setShop] = useState(null);
    const [stats, setStats] = useState({ productCount: 0, followerCount: 0 });
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    
    const [loadingShop, setLoadingShop] = useState(true);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    const [activeTab, setActiveTab] = useState('ALL');

    const [currentPage, setCurrentPage] = useState(1);
    const productsPerPage = 12;

    useEffect(() => {
        const fetchShopDetail = async () => {
            try {
                const res = await axiosClient.get(`/catalog/shops/${id}`);
                setShop(res.data.shop);
                setStats(res.data.stats || { productCount: 0, followerCount: Math.floor(Math.random() * 500) + 100 });
            } catch (err) {
                console.error("Lỗi khi tải thông tin shop:", err);
            } finally {
                setLoadingShop(false);
            }
        };

        const fetchShopProducts = async () => {
            try {
                const res = await axiosClient.get('/catalog/products', {
                    params: { shopId: id, limit: 100 }
                });
                setProducts(Array.isArray(res.data) ? res.data : []);
            } catch (err) {
                console.error("Lỗi khi tải sản phẩm của shop:", err);
            } finally {
                setLoadingProducts(false);
            }
        };

        const fetchCategories = async () => {
            try {
                const res = await axiosClient.get('/catalog/categories');
                setCategories(Array.isArray(res.data) ? res.data : []);
            } catch (err) {
                console.error("Lỗi khi tải danh mục:", err);
            }
        };

        fetchShopDetail();
        fetchShopProducts();
        fetchCategories();
    }, [id]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, activeTab]);

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href)
            .then(() => toast.success('Đã sao chép liên kết gian hàng!'))
            .catch(() => toast.error('Không thể sao chép liên kết.'));
    };

    // === LOGIC LỌC & PHÂN TRANG ===
    const filteredProducts = products.filter(product => 
        product.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const indexOfLastProduct = currentPage * productsPerPage;
    const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
    const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
    const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

    const shopCategoryIds = [...new Set(products.map(p => p.categoryId))];
    const shopCategories = categories.filter(c => shopCategoryIds.includes(c.id));

    const paginate = (pageNumber) => {
        setCurrentPage(pageNumber);
        window.scrollTo({ top: 400, behavior: 'smooth' });
    };

    if (loadingShop) {
        return (
            <div className="min-h-screen flex items-center justify-center text-[#2b3896] flex-col gap-4">
                <span className="material-symbols-outlined animate-spin text-4xl">progress_activity</span>
                <span className="font-bold">Đang tải thông tin gian hàng...</span>
            </div>
        );
    }

    if (!shop) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#f9f9fc]">
                <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">store_off</span>
                <h2 className="text-2xl font-bold text-gray-800 mb-2 font-['Be_Vietnam_Pro']">Không tìm thấy cửa hàng</h2>
                <p className="text-gray-500 mb-6">Cửa hàng này có thể đã bị xóa hoặc không tồn tại.</p>
                <Link to="/shop" className="px-6 py-3 bg-[#2b3896] text-white rounded-full font-bold hover:bg-[#1f2970] transition-colors">Quay lại danh sách</Link>
            </div>
        );
    }

    return (
        <main className="pt-16 pb-24 bg-[#f9f9fc] min-h-screen font-['Inter'] text-gray-900">
            <section className="relative w-full h-[300px] md:h-[460px] overflow-hidden">
                <img 
                    src="https://images.unsplash.com/photo-1618220179428-22790b46a0eb?q=80&w=2000&auto=format&fit=crop" 
                    alt="Shop Cover" 
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
            </section>

            <section className="max-w-7xl mx-auto px-6 -mt-16 md:-mt-20 relative z-10">
                <div className="bg-white rounded-3xl p-6 md:p-8 shadow-[0px_12px_48px_rgba(43,56,150,0.08)] flex flex-col md:flex-row md:items-end md:justify-between gap-6 border border-gray-100">
                    <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
                        <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-8 border-white overflow-hidden shadow-lg -mt-20 md:-mt-28 bg-gray-50 flex items-center justify-center">
                            <img 
                                src={shop.logoUrl || "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=300&auto=format&fit=crop"} 
                                alt={shop.name} 
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=300&auto=format&fit=crop";
                                }}
                            />
                        </div>
                        <div className="text-center md:text-left">
                            <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-[#2b3896] font-['Be_Vietnam_Pro'] mb-3">
                                {shop.name}
                            </h1>
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-gray-600 font-medium text-sm md:text-base">
                                <span className="flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[18px]">inventory_2</span> 
                                    {products.length} Sản phẩm
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
                        <button 
                            onClick={handleShare}
                            className="flex items-center gap-2 px-8 py-3 bg-gray-100 text-[#2b3896] font-bold rounded-full hover:bg-gray-200 transition-all active:scale-95"
                        >
                            <span className="material-symbols-outlined">share</span>
                            Chia sẻ gian hàng
                        </button>
                    </div>
                </div>
            </section>

            <section className="max-w-7xl mx-auto px-6 mt-12">
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
                        <button 
                            onClick={() => setActiveTab('ALL')}
                            className={`whitespace-nowrap px-6 py-2.5 rounded-full font-bold transition-all shadow-sm ${activeTab === 'ALL' ? 'bg-[#2b3896] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                        >
                            Tất cả sản phẩm
                        </button>
                        <button 
                            onClick={() => setActiveTab('CATEGORY')}
                            className={`whitespace-nowrap px-6 py-2.5 rounded-full font-bold transition-all shadow-sm ${activeTab === 'CATEGORY' ? 'bg-[#2b3896] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                        >
                            Danh mục Shop
                        </button>
                    </div>
                </div>

                {/* 1. Tab Tất cả sản phẩm */}
                {activeTab === 'ALL' && (
                    loadingProducts ? (
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
                        <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-[0px_12px_48px_rgba(43,56,150,0.03)]">
                            <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">inventory_2</span>
                            <h3 className="text-xl font-bold text-gray-800 mb-2 font-['Be_Vietnam_Pro']">Gian hàng trống</h3>
                            <p className="text-gray-500">Chưa có sản phẩm nào khớp với tìm kiếm của bạn.</p>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                                {/* DUYỆT QUA MẢNG currentProducts ĐÃ ĐƯỢC CẮT TRANG */}
                                {currentProducts.map(product => (
                                    <div key={product.id} className="group bg-white border border-gray-100 rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[0px_24px_48px_rgba(43,56,150,0.08)] relative flex flex-col">
                                        <Link to={`/product/${product.slug ? `${product.slug}-id${product.id}` : product.id}`} className="aspect-[4/5] overflow-hidden bg-gray-50 block">
                                            <img 
                                                src={product.thumbnailUrl || "https://via.placeholder.com/400x500"} 
                                                alt={product.name} 
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                                            />
                                        </Link>
                                        <div className="p-6 flex flex-col flex-grow">
                                            <div className="flex justify-between items-start mb-2 gap-2">
                                                <Link to={`/product/${product.slug ? `${product.slug}-id${product.id}` : product.id}`}>
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

                            {/* CỤM GIAO DIỆN PHÂN TRANG (PAGINATION) */}
                            {totalPages > 1 && (
                                <div className="mt-16 flex items-center justify-center gap-2">
                                    <button
                                        onClick={() => paginate(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-600 disabled:opacity-40 hover:bg-gray-50 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                                    </button>

                                    {[...Array(totalPages)].map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => paginate(i + 1)}
                                            className={`w-10 h-10 flex items-center justify-center rounded-full font-bold transition-colors ${
                                                currentPage === i + 1
                                                    ? 'bg-[#2b3896] text-white shadow-md'
                                                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                                            }`}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}

                                    <button
                                        onClick={() => paginate(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-600 disabled:opacity-40 hover:bg-gray-50 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                                    </button>
                                </div>
                            )}
                        </>
                    )
                )}

                {/* 2. Tab Danh mục Shop */}
                {activeTab === 'CATEGORY' && (
                    shopCategories.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-[0px_12px_48px_rgba(43,56,150,0.03)]">
                            <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">category</span>
                            <h3 className="text-xl font-bold text-gray-800 mb-2 font-['Be_Vietnam_Pro']">Chưa có danh mục</h3>
                            <p className="text-gray-500">Cửa hàng này hiện chưa phân loại danh mục sản phẩm.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                            {shopCategories.map((category) => (
                                <Link 
                                    key={category.id} 
                                    to={`/products?categoryId=${category.id}&shopId=${id}`} 
                                    className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-[0px_12px_32px_rgba(43,56,150,0.06)] hover:border-[#2b3896]/30 transition-all group flex flex-col items-center text-center hover:-translate-y-1"
                                >
                                    <div className="w-16 h-16 rounded-full bg-[#f4f5fa] text-[#2b3896] flex items-center justify-center mb-4 group-hover:bg-[#2b3896] group-hover:text-white transition-all duration-300">
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
                    )
                )}

            </section>
        </main>
    );
};

export default ShopDetail;