import React, { useState, useEffect } from 'react';
import axiosClient from '../../utils/axiosClient';
import { Link } from 'react-router-dom';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setLoading(true);
        const res = await axiosClient.get('/catalog/products', {
          params: { limit: 8, sortBy: 'latest' } 
        });

        if (res.data && res.data.success) {
          setProducts(res.data.data); 
        }
      } catch (err) {
        console.error("Lỗi tải trang chủ:", err);
        setError("Không thể tải danh sách sản phẩm.");
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  if (loading) return <div className="text-center py-20">Đang tải sản phẩm...</div>;
  if (error) return <div className="text-center py-20 text-red-500">{error}</div>;

  return (
    <div className="max-w-screen-xl mx-auto px-6 py-12">
      <h2 className="text-3xl font-black text-[#2b3896] mb-8">Sản phẩm mới nhất</h2>
      
      {products.length === 0 ? (
        <p className="text-center text-gray-500">Chưa có sản phẩm nào.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          {products.map((product) => (
            <div key={product.id} className="border rounded-xl p-4 hover:shadow-lg transition-all">
              <img 
                src={product.thumbnailUrl || 'https://via.placeholder.com/150'} 
                alt={product.name} 
                className="w-full h-48 object-cover rounded-lg mb-4"
              />
              <Link to={`/product/${product.id}`} className="block text-lg font-bold hover:text-[#2b3896]">
                {product.name}
              </Link>
              <p className="text-[#2b3896] font-bold mt-2">
                {Number(product.price).toLocaleString('vi-VN')} ₫
              </p>
            </div>
          ))}
        </div>
      )}
      
      <div className="text-center mt-12">
        <Link to="/products" className="px-8 py-3 bg-[#2b3896] text-white rounded-full font-bold">
          Xem tất cả sản phẩm
        </Link>
      </div>
    </div>
  );
};

export default Home;