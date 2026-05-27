import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axiosClient from '../../utils/axiosClient';

const ProductForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isUpdate = Boolean(id);
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [shopId, setShopId] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [formData, setFormData] = useState({
    name: '', categoryId: '', price: '', stockQuantity: '', description: '', thumbnailUrl: ''
  });

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [catRes, shopRes] = await Promise.all([
          axiosClient.get('/catalog/categories'),
          axiosClient.get('/catalog/shops/my-shop'),
        ]);
        setCategories(catRes.data || []);
        setShopId(shopRes.data.shop.id);

        if (isUpdate) {
          const prodRes = await axiosClient.get(`/catalog/products/${id}`);
          const product = prodRes.data.product;
          if (product) {
            setFormData({
              name: product.name,
              categoryId: product.categoryId,
              price: product.price,
              stockQuantity: product.stockQuantity,
              description: product.description || '',
              thumbnailUrl: product.thumbnailUrl || ''
            });
          }
        }
      } catch (error) {
        console.error("Lỗi fetch dữ liệu:", error);
      }
    };
    fetchInitialData();
  }, [id, isUpdate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let thumbnailUrl = formData.thumbnailUrl || 'https://via.placeholder.com/300';
      if (imageFile) {
        const uploadData = new FormData();
        uploadData.append('image', imageFile);
        const uploadRes = await axiosClient.post('/uploads/images', uploadData);
        thumbnailUrl = uploadRes.data.url;
      }

      const payload = {
        name: formData.name,
        categoryId: parseInt(formData.categoryId),
        price: parseFloat(formData.price),
        stockQuantity: parseInt(formData.stockQuantity),
        description: formData.description,
        thumbnailUrl,
        status: "ACTIVE"
      };

      if (!isUpdate) {
        payload.shopId = Number(shopId);
      }

      if (isUpdate) {
        await axiosClient.put(`/catalog/products/${id}`, payload);
      } else {
        await axiosClient.post('/catalog/products', payload);
      }
      navigate('/seller/products');
    } catch {
      alert("Có lỗi xảy ra, vui lòng kiểm tra lại!");
    } finally {
      setLoading(false);
    }
  };

  const handleImageClick = () => fileInputRef.current.click();

  return (
    <div className="p-4 md:p-8 lg:p-12 font-sans bg-[#f8fafc] min-h-screen pb-24">
      <nav className="flex text-[12px] md:text-[13px] font-medium text-slate-400 mb-6 gap-2 mt-8 md:mt-0">
        <Link to="/seller/products" className="hover:text-indigo-600 transition">Products</Link>
        <span>›</span>
        <span className="text-slate-600">{isUpdate ? 'Edit Product' : 'Add New Product'}</span>
      </nav>

      <header className="mb-8 md:mb-10">
        <h1 className="text-3xl md:text-4xl font-black text-[#2e3785] mb-2">
          {isUpdate ? 'Edit Product' : 'Add New Product'}
        </h1>
        <p className="text-slate-500 font-medium text-xs md:text-sm">
          Create a new editorial listing for your store's collection.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8 max-w-5xl">
        <div className="bg-white rounded-3xl p-6 md:p-10 border border-slate-100 shadow-sm">
          <div 
            onClick={handleImageClick}
            className="border-2 border-dashed border-slate-200 rounded-3xl py-10 md:py-14 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-all group px-4 text-center"
          >
            <input 
              type="file" hidden ref={fileInputRef} 
              onChange={(e) => {
                const file = e.target.files[0];
                if(file) {
                  setImageFile(file);
                  setFormData({...formData, thumbnailUrl: URL.createObjectURL(file)});
                }
              }} 
            />
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition">
              <span className="material-symbols-outlined text-[28px]">upload</span>
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-1">Product Imagery</h3>
            <p className="text-slate-400 text-[12px] md:text-[13px] font-medium mb-6">
              Drag and drop high-resolution photos here, or click to browse files.
            </p>
            
            <div className="flex gap-3">
              <div className="w-16 h-16 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 flex items-center justify-center">
                {formData.thumbnailUrl ? (
                  <img src={formData.thumbnailUrl} className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-slate-300">image</span>
                )}
              </div>
              <div className="w-16 h-16 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-300 hover:text-indigo-400 hover:border-indigo-200 transition">
                <span className="material-symbols-outlined">add</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 md:p-10 border border-slate-100 shadow-sm space-y-6 md:space-y-8">
          <div>
            <label className="block text-[13px] font-bold text-slate-700 mb-3">Product Name</label>
            <input 
              required type="text" value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              placeholder="e.g. Handcrafted Ceramic Vessel" 
              className="w-full bg-[#f8fafc] border border-slate-100 p-4 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none" 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <div>
              <label className="block text-[13px] font-bold text-slate-700 mb-3">Category</label>
              <div className="relative">
                <select 
                  required value={formData.categoryId}
                  onChange={e => setFormData({...formData, categoryId: e.target.value})}
                  className="w-full appearance-none bg-[#f8fafc] border border-slate-100 p-4 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-slate-600 cursor-pointer"
                >
                  <option value="" disabled>Select a category</option>
                  {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
              </div>
            </div>
            
            <div>
              <label className="block text-[13px] font-bold text-slate-700 mb-3">Price (VND)</label>
              <div className="relative">
                <input 
                  required type="number" value={formData.price}
                  onChange={e => setFormData({...formData, price: e.target.value})}
                  placeholder="0" 
                  className="w-full bg-[#f8fafc] border border-slate-100 p-4 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none" 
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-600 font-bold text-xs uppercase">₫</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-bold text-slate-700 mb-3">Stock Quantity</label>
            <input 
              required type="number" value={formData.stockQuantity}
              onChange={e => setFormData({...formData, stockQuantity: e.target.value})}
              placeholder="Available units" 
              className="w-full bg-[#f8fafc] border border-slate-100 p-4 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none" 
            />
          </div>

          <div>
            <label className="block text-[13px] font-bold text-slate-700 mb-3">Product Description</label>
            <textarea 
              rows="5" value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              placeholder="Describe the materials, craftsmanship, and story behind this piece..." 
              className="w-full bg-[#f8fafc] border border-slate-100 p-4 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none resize-none leading-relaxed"
            ></textarea>
          </div>
        </div>

        {/* Nút hành động dàn ngang trên điện thoại */}
        <div className="flex flex-col-reverse sm:flex-row justify-end items-center gap-4 sm:gap-8 pt-4">
          <button 
            type="button" 
            onClick={() => navigate('/seller/products')} 
            className="w-full sm:w-auto py-4 sm:py-0 text-sm font-bold text-slate-600 hover:text-slate-900 transition"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full sm:w-auto px-10 py-4 bg-[#313b8e] hover:bg-[#252d70] text-white rounded-xl font-bold shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-3 disabled:opacity-70"
          >
            <span className="material-symbols-outlined text-[20px]">save</span>
            {loading ? 'Saving...' : 'Save Product'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;
