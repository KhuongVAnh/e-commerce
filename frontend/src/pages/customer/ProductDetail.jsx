import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';

const ProductDetail = () => {
  const { id } = useParams();
  // 1. Dữ liệu mẫu của sản phẩm
  const product = {
    id: 1,
    name: "The Sculpted Minimalist Vase",
    brand: "Hue Ceramics",
    price: 2450000,
    originalPrice: 3100000,
    stock: 42,
    rating: 4.9,
    reviews: 1200,
    shopName: "Atelier Orient",
    images: [
      "https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=800&q=80",
      "https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=800&q=80",
      "https://images.unsplash.com/photo-1612152605347-f93296cb657d?w=800&q=80",
      "https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=800&q=80"
    ]
  };

  // 2. Các State quản lý tương tác trên trang
  const [activeImage, setActiveImage] = useState(product.images[0]);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');

  // 3. Hàm xử lý tăng giảm số lượng
  const handleDecrease = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };
  const handleIncrease = () => {
    if (quantity < product.stock) setQuantity(quantity + 1);
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-6">
      <nav className="flex gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-8">
        <Link to="/" className="hover:text-[#2b3896] transition-colors">Trang chủ</Link>
        <span>/</span>
        <Link to="/products?category=Gốm sứ" className="hover:text-[#2b3896] transition-colors">Gốm sứ</Link>
        <span>/</span>
        <span className="text-[#2b3896]">{product.name}</span>
      </nav>
      
      {/* 1: THÔNG TIN CHÍNH CỦA SẢN PHẨM */}
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
          <div className="grid grid-cols-4 gap-4">
            {product.images.map((img, index) => (
              <button 
                key={index}
                onClick={() => setActiveImage(img)}
                className={`aspect-square rounded-xl overflow-hidden transition-all active:scale-95 ${activeImage === img ? 'border-2 border-[#2b3896] shadow-md' : 'bg-gray-100 border border-transparent hover:border-[#2b3896]/30'}`}
              >
                <img src={img} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Chi tiết & Nút Mua */}
        <div className="lg:col-span-5 flex flex-col">

          {/* Tên & Giá */}
          <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tighter text-gray-900 mb-4 leading-tight font-headline">
            {product.name}
          </h1>
          <div className="flex items-baseline gap-4 mb-8">
            <span className="text-3xl font-extrabold text-[#2b3896]">
              {product.price.toLocaleString('vi-VN')} <span className="text-sm font-medium align-top opacity-70">₫</span>
            </span>
            <span className="text-lg text-gray-400 line-through font-medium">
              {product.originalPrice.toLocaleString('vi-VN')} ₫
            </span>
          </div>

          {/* Chọn số lượng */}
          <div className="bg-gray-50 p-6 rounded-2xl mb-8 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-gray-600">Số lượng</span>
              <span className="text-xs font-bold text-[#2b3896] uppercase tracking-wider">{product.stock} Sản phẩm sẵn có</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center bg-white rounded-full shadow-sm border border-gray-200 p-1">
                <button 
                  onClick={handleDecrease}
                  className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-[#2b3896] hover:bg-gray-50 transition-colors rounded-full"
                >
                  <span className="material-symbols-outlined">remove</span>
                </button>
                <span className="w-12 text-center font-extrabold text-lg text-gray-900">{quantity}</span>
                <button 
                  onClick={handleIncrease}
                  className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-[#2b3896] hover:bg-gray-50 transition-colors rounded-full"
                >
                  <span className="material-symbols-outlined">add</span>
                </button>
              </div>
            </div>
          </div>

          {/* Nút hành động */}
          <div className="flex flex-col sm:flex-row gap-4 mb-10">
            <button className="flex-1 py-4 px-8 border-2 border-[#2b3896] text-[#2b3896] font-bold tracking-wide rounded-full hover:bg-[#2b3896]/5 transition-all active:scale-95">
              Thêm vào giỏ
            </button>
            <button className="flex-1 py-4 px-8 bg-gradient-to-br from-[#2b3896] to-[#4551af] text-white font-bold tracking-wide rounded-full hover:shadow-lg hover:shadow-[#2b3896]/30 transition-all active:scale-95">
              Mua Ngay
            </button>
          </div>

          {/* Thông tin Cửa hàng */}
          <div className="bg-white p-6 rounded-2xl shadow-[0px_8px_24px_rgba(43,56,150,0.05)] border border-gray-100 mb-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-[#2b3896]/10 bg-gray-100">
                <span className="material-symbols-outlined text-4xl text-gray-400 mt-2 ml-2">storefront</span>
              </div>
              <div>
                <h3 className="font-extrabold text-gray-900">{product.shopName}</h3>
                <div className="flex items-center gap-1 text-xs font-bold text-gray-500 mt-0.5">
                  <span className="material-symbols-outlined text-[14px] text-yellow-500" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span>{product.rating} ({product.reviews} Đánh giá)</span>
                </div>
              </div>
            </div>
            <button className="text-sm font-bold text-[#2b3896] px-5 py-2 rounded-full border border-[#2b3896]/20 hover:bg-[#2b3896] hover:text-white transition-all">
              Xem Shop
            </button>
          </div>

          {/* Cam kết / Dịch vụ */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm font-medium text-gray-600">
              <span className="material-symbols-outlined text-[#2b3896]">local_shipping</span>
              <span>Miễn phí vận chuyển toàn quốc cho đơn từ 1.000.000đ</span>
            </div>
            <div className="flex items-center gap-3 text-sm font-medium text-gray-600">
              <span className="material-symbols-outlined text-[#2b3896]">verified</span>
              <span>Chứng nhận sản phẩm thủ công chính hãng 100%</span>
            </div>
          </div>

        </div>
      </div>

      {/* 2: TABS THÔNG TIN CHI TIẾT */}
      <div className="mt-12">
        {/* Tiêu đề */}
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
            Đánh giá ({product.reviews})
          </button>
          <button 
            onClick={() => setActiveTab('shipping')}
            className={`pb-4 font-bold tracking-tight text-lg whitespace-nowrap transition-colors ${activeTab === 'shipping' ? 'text-[#2b3896] border-b-2 border-[#2b3896]' : 'text-gray-400 hover:text-gray-700'}`}
          >
            Vận chuyển & Bảo quản
          </button>
        </div>

        {/* Nội dung */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          
          {/* Mô tả */}
          {activeTab === 'description' && (
            <>
              <div className="prose max-w-none text-gray-600">
                <h2 className="text-3xl font-extrabold tracking-tighter text-gray-900 mb-6 font-headline">Thiết Kế Chủ Đích Cho Ngôi Nhà Hiện Đại</h2>
                <p className="leading-relaxed mb-6 font-medium">
                  Bình gốm điêu khắc tối giản là minh chứng cho vẻ đẹp của sự tiết chế. Được chế tác thủ công tại xưởng nghệ thuật ở Hà Nội, mỗi tác phẩm trải qua quá trình giám tuyển kéo dài 12 ngày — từ khâu nặn đất sét ban đầu đến lớp hoàn thiện nhám kiến trúc cuối cùng. Hình bóng bất đối xứng được thiết kế để đón ánh sáng ở nhiều góc độ khác nhau.
                </p>
                <ul className="space-y-4 list-none p-0">
                  <li className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 bg-[#2b3896] rounded-full"></span>
                    <span className="font-medium">Đất sét Kaolin cao cấp nguồn gốc từ đồng bằng sông Hồng</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 bg-[#2b3896] rounded-full"></span>
                    <span className="font-medium">Bề mặt nhám mờ (satin-matte), chống xước và bám bẩn</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 bg-[#2b3896] rounded-full"></span>
                    <span className="font-medium">Bên trong chống thấm nước tuyệt đối, lý tưởng để cắm hoa tươi</span>
                  </li>
                </ul>
              </div>
              <div className="bg-gray-100 rounded-2xl overflow-hidden aspect-video shadow-sm">
                <img 
                  src="https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=800&q=80" 
                  alt="Production Process" 
                  className="w-full h-full object-cover"
                />
              </div>
            </>
          )}

          {/* Đánh giá (Demo) */}
          {activeTab === 'reviews' && (
            <div className="col-span-full text-center py-12">
              <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">forum</span>
              <h3 className="text-xl font-bold text-gray-900">Chưa có đánh giá chi tiết</h3>
              <p className="text-gray-500 mt-2">Hãy là người đầu tiên để lại cảm nhận về sản phẩm này.</p>
            </div>
          )}

          {/* Vận chuyển (Demo) */}
          {activeTab === 'shipping' && (
            <div className="col-span-full">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Chính sách vận chuyển</h3>
              <p className="text-gray-600 leading-relaxed mb-6">Sản phẩm được bọc chống sốc 3 lớp và đóng gói trong hộp carton cứng cáp. Thời gian giao hàng dự kiến từ 2-4 ngày làm việc đối với các tỉnh thành phố lớn.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default ProductDetail;