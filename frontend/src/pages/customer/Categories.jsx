import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../../utils/axiosClient';

const categoryStyles = [
    { icon: 'texture', colorClass: 'text-[#2b3896]', bgClass: 'bg-[#2b3896]/5 group-hover:bg-[#2b3896]/10' },
    { icon: 'potted_plant', colorClass: 'text-amber-700', bgClass: 'bg-amber-50 group-hover:bg-amber-100' },
    { icon: 'checkroom', colorClass: 'text-indigo-500', bgClass: 'bg-indigo-50 group-hover:bg-indigo-100' },
    { icon: 'chair', colorClass: 'text-emerald-700', bgClass: 'bg-emerald-50 group-hover:bg-emerald-100' },
    { icon: 'diamond', colorClass: 'text-orange-600', bgClass: 'bg-orange-50 group-hover:bg-orange-100' },
    { icon: 'vaping_rooms', colorClass: 'text-teal-600', bgClass: 'bg-teal-50 group-hover:bg-teal-100' },
    { icon: 'history_edu', colorClass: 'text-slate-600', bgClass: 'bg-slate-50 group-hover:bg-slate-100' },
    { icon: 'palette', colorClass: 'text-rose-600', bgClass: 'bg-rose-50 group-hover:bg-rose-100' },
];

const Categories = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await axiosClient.get('/catalog/categories');
                setCategories((res.data || []).filter(c => c.status !== 'INACTIVE'));
            } catch (err) {
                console.error("Lỗi tải danh mục:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchCategories();
    }, []);

    const filteredCategories = categories.filter(cat => 
        cat.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <main className="pt-32 pb-24 px-6 md:px-12 max-w-screen-2xl mx-auto font-['Inter'] bg-[#f9f9fc] min-h-screen">
            
            {/* Header & Thanh tìm kiếm */}
            <header className="mb-16">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <h1 className="text-5xl md:text-6xl font-black font-['Be_Vietnam_Pro'] tracking-tighter text-gray-900 max-w-2xl">
                        Danh mục sản phẩm
                    </h1>
                    
                    {/* Thanh Search mượt mà */}
                    <div className="relative w-full max-w-sm group">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 transition-colors group-focus-within:text-[#2b3896]">
                            filter_list
                        </span>
                        <input 
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white border-none py-4 pl-12 pr-6 rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.03)] focus:ring-2 focus:ring-[#2b3896]/20 text-gray-900 transition-all outline-none font-medium"
                            placeholder="Lọc danh mục..."
                        />
                    </div>
                </div>
            </header>

            {/* Lưới danh mục */}
            <section>
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                            <div key={i} className="bg-white p-8 rounded-xl h-64 animate-pulse flex flex-col items-start border border-gray-100">
                                <div className="w-16 h-16 rounded-full bg-gray-200 mb-6"></div>
                                <div className="w-3/4 h-6 bg-gray-200 rounded mb-4"></div>
                                <div className="w-full h-4 bg-gray-200 rounded mb-2"></div>
                                <div className="w-2/3 h-4 bg-gray-200 rounded"></div>
                            </div>
                        ))}
                    </div>
                ) : filteredCategories.length === 0 ? (
                    <div className="text-center py-20">
                        <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">search_off</span>
                        <h3 className="text-xl font-bold text-gray-900 mb-2 font-['Be_Vietnam_Pro']">Không tìm thấy danh mục</h3>
                        <p className="text-gray-500">Thử tìm kiếm với từ khóa khác xem sao nhé.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {filteredCategories.map((category, index) => {
                            const style = categoryStyles[index % categoryStyles.length];
                            
                            return (
                                <Link 
                                    to={`/products?category=${category.slug}`} 
                                    key={category.id}
                                    className="group relative bg-white p-8 rounded-xl border border-gray-100 transition-all duration-500 hover:scale-[1.02] hover:shadow-[0px_20px_40px_rgba(43,56,150,0.08)] flex flex-col items-start overflow-hidden"
                                >
                                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 transition-colors ${style.bgClass}`}>
                                        <span className={`material-symbols-outlined text-3xl ${style.colorClass}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                                            {category.icon || style.icon}
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-bold font-['Be_Vietnam_Pro'] mb-2 text-gray-900 line-clamp-1">
                                        {category.name}
                                    </h3>
                                    <p className="text-gray-500 text-sm mb-8 leading-relaxed line-clamp-2">
                                        {category.description || style.defaultDesc}
                                    </p>
                                    <div className="mt-auto flex items-center text-[#2b3896] font-semibold text-sm group-hover:gap-2 transition-all">
                                        <span>Xem sản phẩm</span>
                                        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* Banner phía dưới */}
            <section className="mt-32 relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2b3896] to-[#4551af] min-h-[400px] flex items-center shadow-2xl">
                <div 
                    className="absolute inset-0 opacity-20 bg-cover bg-center mix-blend-overlay"
                    style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1618220179428-22790b46a0eb?q=80&w=2000&auto=format&fit=crop")' }}
                ></div>
                
                <div className="relative z-10 px-8 md:px-16 py-20 max-w-3xl">
                    <h2 className="text-white text-4xl md:text-5xl font-black font-['Be_Vietnam_Pro'] leading-tight mb-6">
                        Khám phá phong cách mua sắm mới.
                    </h2>
                    <p className="text-indigo-100 text-lg mb-10 leading-relaxed font-medium">
                        Mỗi danh mục trong cửa hàng của chúng tôi đều được tuyển chọn kỹ lưỡng để mang đến cho bạn trải nghiệm tuyệt vời nhất.
                    </p>
                    <Link 
                        to="/products"
                        className="inline-block bg-white text-[#2b3896] px-8 py-4 rounded-full font-bold tracking-tight shadow-xl hover:bg-gray-50 transition-all active:scale-95"
                    >
                        Mua sắm ngay
                    </Link>
                </div>
            </section>
        </main>
    );
};

export default Categories;
