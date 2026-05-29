import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axiosClient from '../../utils/axiosClient';

const SellerProductForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isUpdate = Boolean(id);
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [shopId, setShopId] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '', categoryId: '', price: '', stockQuantity: '', description: '', thumbnailUrl: '', status: 'ACTIVE'
  });

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [catRes, shopRes] = await Promise.all([
          axiosClient.get('/catalog/categories'),
          axiosClient.get('/catalog/shops/my-shop'),
        ]);
        setCategories(catRes?.data?.data || catRes?.data || []);
        setShopId(shopRes?.data?.shop?.id || shopRes?.shop?.id);

        if (isUpdate) {
          const prodRes = await axiosClient.get(`/catalog/products/${id}`);
          const product = prodRes?.data?.product || prodRes?.product || prodRes?.data;
          if (product) {
            setFormData({
              name: product.name || '', categoryId: product.categoryId || '',
              price: product.price || '', stockQuantity: product.stockQuantity || '',
              description: product.description || '', thumbnailUrl: product.thumbnailUrl || '',
              status: product.status || 'ACTIVE'
            });
          }
        }
      } catch (error) { 
        console.error("Lỗi fetch dữ liệu:", error); 
        alert("Có lỗi khi tải dữ liệu khởi tạo. Bạn đã tạo Shop chưa?");
      }
    };
    fetchInitialData();
  }, [id, isUpdate]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if(file) {
      setImageFile(file);
      setFormData({...formData, thumbnailUrl: URL.createObjectURL(file)});
    }
  };

  const uploadImage = async (file) => {
    const uploadData = new FormData();
    uploadData.append('image', file);
    const res = await axiosClient.post('/uploads/images', uploadData, { headers: { 'Content-Type': 'multipart/form-data' }});
    return res?.data?.url || res?.url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let finalThumbnailUrl = formData.thumbnailUrl;
      if (imageFile) {
        const uploadedUrl = await uploadImage(imageFile);
        if (uploadedUrl) finalThumbnailUrl = uploadedUrl;
      }

      const payload = {
        name: formData.name,
        categoryId: parseInt(formData.categoryId),
        price: parseFloat(formData.price),
        stockQuantity: parseInt(formData.stockQuantity),
        description: formData.description,
        thumbnailUrl: finalThumbnailUrl,
        status: formData.status
      };

      if (!isUpdate) {
        payload.shopId = Number(shopId);
        await axiosClient.post('/catalog/products', payload);
      } else {
        await axiosClient.put(`/catalog/products/${id}`, payload);
      }
      
      alert("Lưu sản phẩm thành công!");
      navigate('/seller/products');
    } catch (error) {
      alert("Lỗi lưu sản phẩm: " + (error.response?.data?.message || 'Vui lòng kiểm tra lại!'));
    } finally { setLoading(false); }
  };

  return (
    <div className="p-4 md:p-8 lg:p-12 font-sans bg-[#f8fafc] min-h-screen pb-24">
      <nav className="flex text-[12px] md:text-[13px] font-medium text-slate-400 mb-6 gap-2 mt-8 md:mt-0">
        <Link to="/seller/products" className="hover:text-[#2e3785] transition">Products</Link>
        <span>›</span><span className="text-slate-900 font-bold">{isUpdate ? 'Edit Product' : 'Add New Product'}</span>
      </nav>

      <header className="mb-8 md:mb-10">
        <h1 className="text-3xl md:text-4xl font-black text-[#2e3785] mb-2">{isUpdate ? 'Edit Product' : 'Add New Product'}</h1>
        <p className="text-slate-500 font-medium text-sm">{isUpdate ? 'Cập nhật thông tin sản phẩm của bạn.' : 'Create a new editorial listing for your store\'s collection.'}</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8 max-w-4xl">
        <div className="bg-white rounded-3xl p-6 md:p-10 border border-slate-100 shadow-sm">
          <div onClick={() => fileInputRef.current.click()} className="border-2 border-dashed border-slate-200 rounded-3xl py-12 md:py-16 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-all group px-4 text-center relative overflow-hidden">
            <input type="file" accept="image/*" hidden ref={fileInputRef} onChange={handleImageChange} />
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition shadow-sm"><span className="material-symbols-outlined text-[24px]">cloud_upload</span></div>
            <h3 className="text-base font-black text-slate-900 mb-1">Product Imagery</h3>
            <p className="text-xs text-slate-500 font-medium max-w-xs">Drag and drop high-resolution photos here, or click to browse files.</p>
            <div className="flex gap-3 mt-6">
              <div className="w-16 h-16 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 flex items-center justify-center shadow-sm">
                {formData.thumbnailUrl ? <img src={formData.thumbnailUrl} className="w-full h-full object-cover" /> : <span className="material-symbols-outlined text-slate-300">image</span>}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 md:p-10 border border-slate-100 shadow-sm space-y-6 md:space-y-8">
          <div>
            <label className="block text-xs font-black text-slate-700 mb-2 uppercase tracking-widest">Product Name</label>
            <input required type="text" placeholder="e.g. Handcrafted Ceramic Vessel" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-white border border-slate-200 p-4 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-[#2e3785]/20 outline-none" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <div>
              <label className="block text-xs font-black text-slate-700 mb-2 uppercase tracking-widest">Category</label>
              <div className="relative">
                <select required value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})} className="w-full appearance-none bg-white border border-slate-200 p-4 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-[#2e3785]/20 outline-none cursor-pointer">
                  <option value="" disabled>Select a category</option>
                  {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-700 mb-2 uppercase tracking-widest">Price (VND)</label>
              <div className="relative">
                <input required type="number" min="0" placeholder="0" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full bg-white border border-slate-200 p-4 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-[#2e3785]/20 outline-none" />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#2e3785] font-black text-sm uppercase">₫</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <div>
              <label className="block text-xs font-black text-slate-700 mb-2 uppercase tracking-widest">Stock Quantity</label>
              <input required type="number" min="0" placeholder="Available units" value={formData.stockQuantity} onChange={e => setFormData({...formData, stockQuantity: e.target.value})} className="w-full bg-white border border-slate-200 p-4 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-[#2e3785]/20 outline-none" />
            </div>
            {isUpdate && (
              <div>
                <label className="block text-xs font-black text-slate-700 mb-2 uppercase tracking-widest">Status</label>
                <div className="relative">
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full appearance-none bg-white border border-slate-200 p-4 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-[#2e3785]/20 outline-none cursor-pointer">
                    <option value="ACTIVE">ACTIVE (Mở bán)</option><option value="INACTIVE">INACTIVE (Tạm ẩn)</option><option value="OUT_OF_STOCK">OUT_OF_STOCK (Hết hàng)</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
                </div>
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs font-black text-slate-700 mb-2 uppercase tracking-widest">Product Description</label>
            <textarea rows="4" placeholder="Describe the materials..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-white border border-slate-200 p-4 rounded-xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-[#2e3785]/20 outline-none resize-none"></textarea>
          </div>
        </div>

        <div className="flex justify-end items-center gap-4 pt-4">
          <button type="button" onClick={() => navigate('/seller/products')} className="text-sm font-bold text-slate-600 hover:text-slate-900 transition bg-slate-100 hover:bg-slate-200 px-6 py-4 rounded-xl">Cancel</button>
          <button type="submit" disabled={loading} className="px-10 py-4 bg-[#313b8e] hover:bg-[#252d70] text-white rounded-xl font-bold shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-2 disabled:opacity-70">
            <span className="material-symbols-outlined text-[18px]">save</span> {loading ? 'Saving...' : 'Save Product'}
          </button>
        </div>
      </form>
    </div>
  );
};
export default SellerProductForm;