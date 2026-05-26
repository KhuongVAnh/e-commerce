import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../../utils/axiosClient';

// Mảng placeholder để giao diện không bị trống nếu Backend chưa trả về logo/description
const fallbackData = [
    { desc: 'Lưu giữ tinh hoa thủ công truyền thống qua từng thớ vải và đường kim mũi chỉ.', img: 'https://images.unsplash.com/photo-1618220179428-22790b46a0eb?q=80&w=300&auto=format&fit=crop' },
    { desc: 'Khơi nguồn cảm hứng từ thiên nhiên, mang vẻ đẹp nguyên bản vào không gian sống.', img: 'https://images.unsplash.com/photo-1490312278390-ab64016e0aa9?q=80&w=300&auto=format&fit=crop' },
    { desc: 'Chế tác gốm sứ nghệ thuật, giao thoa giữa nét đẹp cổ điển và thiết kế đương đại.', img: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?q=80&w=300&auto=format&fit=crop' },
    { desc: 'Nghệ thuật đan lát thủ công từ những chất liệu bền vững và thân thiện với môi trường.', img: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=300&auto=format&fit=crop' },
];

const ShopList = () => {
    const [shops, setShops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchShops = async () => {
            try {
                const res = await axiosClient.get('/catalog/shops', {
                    params: { status: 'ACTIVE', limit: 50 }
                });
                const responseData = res.data || res;

                let shopData = [];
                if (responseData?.success && responseData?.data?.shops) {
                    shopData = responseData.data.shops;
                } else if (responseData?.shops) {
                    shopData = responseData.shops;
                } else if (Array.isArray(responseData)) {
                    shopData = responseData;
                } else if (responseData?.data && Array.isArray(responseData.data)) {
                    shopData = responseData.data;
                }

                setShops(shopData);
            } catch (error) {
                console.error("Lỗi khi tải danh sách shop:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchShops();
    }, []);

    const filteredShops = shops.filter(shop => 
        shop.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <main className="pt-32 pb-24 px-6 max-w-screen-xl mx-auto min-h-screen font-['Inter'] bg-[#f9f9fc]">
            
            {/* Header */}
            <header className="mb-16 md:mb-24 flex flex-col items-center text-center">
                <h1 className="font-['Be_Vietnam_Pro'] text-5xl md:text-7xl font-extrabold tracking-tighter text-[#2b3896] mb-6">
                    Shop Directory
                </h1>
                <p className="text-gray-500 text-lg md:text-xl max-w-2xl font-light leading-relaxed">
                    Khám phá những câu chuyện phía sau các đối tác thủ công của chúng tôi. Nơi tuyển chọn tinh hoa nghệ thuật Việt Nam từ các xưởng mộc vùng cao đến gốm sứ duyên hải.
                </p>
            </header>

            {/* Thanh Tìm kiếm & Bộ lọc */}
            <section className="mb-16 max-w-4xl mx-auto">
                <div className="bg-white p-4 rounded-full shadow-[0_8px_24px_rgba(43,56,150,0.04)] flex flex-col md:flex-row items-center gap-4 border border-gray-100">
                    <div className="relative flex-grow w-full md:w-auto">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                            search
                        </span>
                        <input 
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-gray-50/50 border-none rounded-full focus:ring-2 focus:ring-[#2b3896]/20 text-gray-900 placeholder:text-gray-400 transition-all outline-none font-medium"
                            placeholder="Tìm kiếm cửa hàng theo tên..."
                        />
                    </div>
                    <div className="h-8 w-px bg-gray-200 hidden md:block"></div>
                    <button className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-[#2b3896] font-bold rounded-full hover:bg-[#bcc2ff]/40 transition-colors w-full md:w-auto justify-center">
                        <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                            star
                        </span>
                        Nổi bật
                    </button>
                </div>
            </section>

            {/* Lưới danh sách Shop */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
                
                {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center animate-pulse">
                            <div className="w-32 h-32 rounded-full bg-gray-200 mb-8"></div>
                            <div className="w-3/4 h-6 bg-gray-200 rounded mb-4"></div>
                            <div className="w-full h-4 bg-gray-200 rounded mb-2"></div>
                            <div className="w-2/3 h-4 bg-gray-200 rounded mb-8"></div>
                            <div className="w-full h-12 bg-gray-200 rounded-full mt-auto"></div>
                        </div>
                    ))
                ) : filteredShops.length === 0 ? (
                    // Trạng thái trống
                    <div className="col-span-full text-center py-20 bg-white rounded-2xl border border-gray-100">
                        <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">storefront</span>
                        <h3 className="text-xl font-bold text-gray-900 mb-2 font-['Be_Vietnam_Pro']">Không tìm thấy cửa hàng</h3>
                        <p className="text-gray-500">Chưa có cửa hàng nào khớp với từ khóa tìm kiếm của bạn.</p>
                    </div>
                ) : (
                    // Danh sách Shop thực tế
                    filteredShops.map((shop, index) => {
                        const fallback = fallbackData[index % fallbackData.length];
                        
                        return (
                            <article 
                                key={shop.id} 
                                className="bg-white p-8 rounded-xl shadow-[0_12px_32px_rgba(43,56,150,0.06)] border border-gray-50 flex flex-col items-center text-center group hover:translate-y-[-4px] transition-transform duration-300"
                            >
                                <div className="w-32 h-32 rounded-full overflow-hidden mb-8 border-4 border-gray-50 shadow-inner mx-auto relative group-hover:border-[#2b3896]/20 transition-colors">
                                    <img 
                                        src={shop.logoUrl || fallback.img} 
                                        alt={`Logo ${shop.name}`} 
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                                    />
                                </div>
                                <h3 className="font-['Be_Vietnam_Pro'] text-2xl font-bold text-[#2b3896] mb-3 line-clamp-1">
                                    {shop.name}
                                </h3>
                                <p className="text-gray-500 mb-8 line-clamp-2 leading-relaxed text-sm">
                                    {shop.description || fallback.desc}
                                </p>
                                <Link 
                                    to={`/products?shopId=${shop.id}`}
                                    className="mt-auto inline-flex items-center justify-center px-8 py-4 bg-gradient-to-br from-[#2b3896] to-[#4551af] text-white font-bold rounded-full w-full shadow-lg shadow-[#2b3896]/20 group-hover:scale-[1.02] active:scale-95 transition-all"
                                >
                                    Tham quan gian hàng
                                </Link>
                            </article>
                        );
                    })
                )}

                {/* Thẻ Kêu gọi đăng ký làm Seller */}
                {!loading && (
                    <article className="bg-[#f9f9fc] p-8 rounded-xl flex flex-col items-center text-center group transition-transform duration-300 border-2 border-dashed border-gray-300 hover:border-[#2b3896]/50 hover:bg-white justify-center min-h-[400px]">
                        <div className="flex flex-col items-center text-gray-500 p-6">
                            <span className="material-symbols-outlined text-5xl mb-4 opacity-40 group-hover:text-[#2b3896] transition-colors group-hover:opacity-100">
                                palette
                            </span>
                            <p className="font-bold text-gray-900 mb-1 font-['Be_Vietnam_Pro']">Bạn là nghệ nhân?</p>
                            <p className="text-sm opacity-80 mb-8">Tham gia vào mạng lưới tinh hoa của chúng tôi</p>
                            <Link 
                                to="/register"
                                className="px-8 py-3 border-2 border-[#2b3896] text-[#2b3896] font-bold rounded-full hover:bg-[#2b3896] hover:text-white transition-all active:scale-95 shadow-sm"
                            >
                                Đăng ký ngay
                            </Link>
                        </div>
                    </article>
                )}

            </div>
        </main>
    );
};

export default ShopList;