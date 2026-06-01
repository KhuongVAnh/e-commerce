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
  
  const [existingImages, setExistingImages] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  
  const [formData, setFormData] = useState({
    name: '', categoryId: '', price: '', stockQuantity: '', description: '', status: 'ACTIVE'
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
          // Đã sửa API ở đây thành API dành cho Seller
          const prodRes = await axiosClient.get(`/catalog/seller/products/${id}`);
          
          // Lấy đúng vị trí của mảng images nằm song song với product theo API Docs
          const responseData = prodRes?.data?.data || prodRes?.data || prodRes;
          const product = responseData?.product || responseData;
          const imagesList = responseData?.images || product?.images || [];
          
          if (product) {
            setFormData({
              name: product.name || '', 
              categoryId: product.categoryId || '',
              price: product.price || '', 
              stockQuantity: product.stockQuantity || '',
              description: product.description || '', 
              status: product.status || 'ACTIVE'
            });

            const oldImages = [];
            // Lấy ảnh bìa
            if (product.thumbnailUrl) {
              oldImages.push(product.thumbnailUrl);
            }
            
            // Lấy các ảnh phụ
            if (Array.isArray(imagesList)) {
              imagesList.forEach(img => {
                const url = img.imageUrl || img;
                if (url && typeof url === 'string' && !oldImages.includes(url)) {
                  oldImages.push(url);
                }
              });
            }
            setExistingImages(oldImages);
          }
        }
      } catch (error) { 
        alert("Có lỗi khi tải dữ liệu khởi tạo. Bạn đã tạo Shop chưa?");
      }
    };
    fetchInitialData();
  }, [id, isUpdate]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setNewFiles(prev => [...prev, ...files]);
    }
    e.target.value = '';
  };

  const handleRemoveOldImage = (index, e) => {
    e.stopPropagation();
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleRemoveNewImage = (index, e) => {
    e.stopPropagation();
    setNewFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImagesSequentially = async (files) => {
    const urls = [];
    for (const file of files) {
      const uploadData = new FormData();
      uploadData.append('image', file);
      try {
        const res = await axiosClient.post('/uploads/images', uploadData);
        const url = res?.data?.data?.url || res?.data?.url || res?.url;
        if (url) {
          urls.push(url);
        } else {
          throw new Error("Không nhận được URL ảnh từ server");
        }
      } catch (err) {
        throw new Error(`Lỗi tải ảnh: ${file.name}`);
      }
    }
    return urls;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let finalUrls = [...existingImages];

      if (newFiles.length > 0) {
        const uploadedUrls = await uploadImagesSequentially(newFiles);
        finalUrls = [...finalUrls, ...uploadedUrls];
      }

      let currentStatus = formData.status;
      const stock = parseInt(formData.stockQuantity) || 0;
      if (stock === 0 && currentStatus === 'ACTIVE') currentStatus = 'OUT_OF_STOCK';
      if (stock > 0 && currentStatus === 'OUT_OF_STOCK') currentStatus = 'ACTIVE';

      const payload = {
        name: formData.name,
        categoryId: parseInt(formData.categoryId),
        price: parseFloat(formData.price),
        stockQuantity: stock,
        description: formData.description,
        thumbnailUrl: finalUrls[0] || '',
        status: currentStatus,
        images: finalUrls.map((url, index) => ({
          imageUrl: url,
          sortOrder: index + 1
        }))
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
      alert(error.message || error.response?.data?.message || 'Có lỗi xảy ra, vui lòng kiểm tra lại!');
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="p-4 md:p-8 lg:p-12 font-sans bg-[#f8fafc] min-h-screen pb-24">
      <nav className="flex text-[12px] md:text-[13px] font-medium text-slate-400 mb-6 gap-2 mt-8 md:mt-0">
        <Link to="/seller/products" className="hover:text-[#2e3785] transition">Products</Link>
        <span>›</span><span className="text-slate-900 font-bold">{isUpdate ? 'Edit Product' : 'Add New Product'}</span>
      </nav>

      <header className="mb-8 md:mb-10">
        <h1 className="text-3xl md:text-4xl font-black text-[#2e3785] mb-2">{isUpdate ? 'Edit Product' : 'Add New Product'}</h1>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8 max-w-4xl">
        <div className="bg-white rounded-3xl p-6 md:p-10 border border-slate-100 shadow-sm">
          <div onClick={() => fileInputRef.current.click()} className="border-2 border-dashed border-slate-200 rounded-3xl py-12 md:py-16 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-all group px-4 text-center relative overflow-hidden">
            <input type="file" accept="image/*" multiple hidden ref={fileInputRef} onChange={handleImageChange} />
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition shadow-sm">
              <span className="material-symbols-outlined text-[24px]">cloud_upload</span>
            </div>
            <h3 className="text-base font-black text-slate-900 mb-1">Product Imagery</h3>
            <p className="text-xs text-slate-500 font-medium max-w-xs">Chọn nhiều ảnh cùng lúc. Ảnh đầu tiên sẽ là Ảnh bìa.</p>
            
            {(existingImages.length > 0 || newFiles.length > 0) && (
              <div className="flex flex-wrap justify-center gap-4 mt-6 w-full px-4">
                {existingImages.map((url, idx) => (
                  <div key={`old-${idx}`} className="relative w-20 h-20 bg-slate-100 rounded-xl border border-slate-200 shadow-sm group/img">
                    <button type="button" onClick={(e) => handleRemoveOldImage(idx, e)} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform z-20">
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                    <img src={url} className="w-full h-full object-cover rounded-xl" />
                    {idx === 0 && <span className="absolute bottom-0 left-0 w-full bg-[#2e3785]/90 backdrop-blur-sm text-white text-[9px] font-black text-center py-1 z-10 rounded-b-xl tracking-widest">COVER</span>}
                  </div>
                ))}
                {newFiles.map((file, idx) => (
                  <div key={`new-${idx}`} className="relative w-20 h-20 bg-slate-100 rounded-xl border border-slate-200 shadow-sm group/img">
                    <button type="button" onClick={(e) => handleRemoveNewImage(idx, e)} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform z-20">
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                    <img src={URL.createObjectURL(file)} className="w-full h-full object-cover rounded-xl" />
                    {existingImages.length === 0 && idx === 0 && <span className="absolute bottom-0 left-0 w-full bg-[#2e3785]/90 backdrop-blur-sm text-white text-[9px] font-black text-center py-1 z-10 rounded-b-xl tracking-widest">COVER</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 md:p-10 border border-slate-100 shadow-sm space-y-6 md:space-y-8">
          <div>
            <label className="block text-xs font-black text-slate-700 mb-2 uppercase tracking-widest">Product Name</label>
            <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-white border border-slate-200 p-4 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-[#2e3785]/20 outline-none" />
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
                <input required type="number" min="0" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full bg-white border border-slate-200 p-4 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-[#2e3785]/20 outline-none" />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#2e3785] font-black text-sm uppercase">₫</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <div>
              <label className="block text-xs font-black text-slate-700 mb-2 uppercase tracking-widest">Stock Quantity</label>
              <input required type="number" min="0" value={formData.stockQuantity} onChange={e => setFormData({...formData, stockQuantity: e.target.value})} className="w-full bg-white border border-slate-200 p-4 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-[#2e3785]/20 outline-none" />
            </div>
            {isUpdate && (
              <div>
                <label className="block text-xs font-black text-slate-700 mb-2 uppercase tracking-widest">Status</label>
                <div className="relative">
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full appearance-none bg-white border border-slate-200 p-4 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-[#2e3785]/20 outline-none cursor-pointer">
                    <option value="ACTIVE">ACTIVE (Mở bán)</option>
                    <option value="INACTIVE">INACTIVE (Tạm ẩn)</option>
                    <option value="OUT_OF_STOCK">OUT OF STOCK (Hết hàng)</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
                </div>
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs font-black text-slate-700 mb-2 uppercase tracking-widest">Product Description</label>
            <textarea rows="4" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-white border border-slate-200 p-4 rounded-xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-[#2e3785]/20 outline-none resize-none"></textarea>
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