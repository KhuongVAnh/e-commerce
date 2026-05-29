import React, { useState, useEffect, useRef } from 'react';
import axiosClient from '../../utils/axiosClient';

const ShopForm = () => {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isUpdate, setIsUpdate] = useState(false);
  const [shopStatus, setShopStatus] = useState('');
  
  const [formData, setFormData] = useState({ name: '', description: '', address: '', logoUrl: '' });
  const [logoFile, setLogoFile] = useState(null);
  const [status, setStatus] = useState({ type: '', msg: '' });

  const logoInputRef = useRef(null);

  useEffect(() => {
    const loadShopInfo = async () => {
      setInitialLoading(true);
      try {
        const res = await axiosClient.get('/catalog/shops/my-shop');
        const shop = res?.data?.shop || res?.shop || res?.data;
        if (shop && shop.id) {
          setFormData({
            name: shop.name || '', description: shop.description || '',
            address: shop.address || '', logoUrl: shop.logoUrl || ''
          });
          setShopStatus(shop.status || '');
          setIsUpdate(true);
        }
      } catch (error) {
        console.log("Seller chưa có gian hàng. Sẵn sàng tạo mới.");
      } finally {
        setInitialLoading(false);
      }
    };
    loadShopInfo();
  }, []);

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, logoUrl: URL.createObjectURL(file) });
      setLogoFile(file);
    }
  };

  const uploadImage = async (file) => {
    const uploadData = new FormData();
    uploadData.append('image', file);
    const res = await axiosClient.post('/uploads/images', uploadData);
    return res.data?.url || res.url;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', msg: '' });

    try {
      const uploadedLogoUrl = logoFile ? await uploadImage(logoFile) : formData.logoUrl;
      const payload = {
        name: formData.name, description: formData.description,
        address: formData.address, logoUrl: uploadedLogoUrl || ''
      };

      if (isUpdate) {
        const res = await axiosClient.put('/catalog/shops/my-shop', payload);
        setStatus({ type: 'success', msg: 'Đã cập nhật gian hàng!' });
        setShopStatus(res.data?.shop?.status || res.data?.status || shopStatus);
      } else {
        await axiosClient.post('/catalog/shops', payload);
        setStatus({ type: 'success', msg: 'Tạo gian hàng thành công!' });
        setIsUpdate(true);
        setShopStatus('PENDING'); 
      }
      
      setFormData(prev => ({ ...prev, logoUrl: uploadedLogoUrl }));
      setLogoFile(null);
    } catch (error) {
      setStatus({ type: 'error', msg: error.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại!' });
    } finally {
      setLoading(false);
      setTimeout(() => setStatus({ type: '', msg: '' }), 4000);
    }
  };

  if (initialLoading) return <div className="p-10 text-center font-bold text-slate-500">Đang kiểm tra thông tin gian hàng...</div>;

  return (
    <div className="font-sans bg-[#f8fafc] min-h-full flex flex-col relative pb-32 md:pb-24"> 
      <input type="file" accept="image/*" hidden ref={logoInputRef} onChange={handleLogoUpload} />
      <div className="flex-1 max-w-4xl mx-auto w-full p-4 md:p-8 lg:p-12 space-y-8 md:space-y-10 mt-8 md:mt-0">
        
        {isUpdate && shopStatus === 'PENDING' && (
          <div className="bg-orange-50 border border-orange-200 p-4 rounded-2xl flex items-start gap-4 shadow-sm">
            <span className="material-symbols-outlined text-orange-600 text-[24px]">hourglass_empty</span>
            <div>
              <p className="text-sm text-orange-900 font-bold mb-1">Gian hàng đang chờ duyệt</p>
              <p className="text-xs text-orange-800 font-medium">Hồ sơ của bạn đang được quản trị viên xem xét. Sản phẩm của bạn sẽ chưa được hiển thị công khai cho đến khi được duyệt.</p>
            </div>
          </div>
        )}
        {isUpdate && shopStatus === 'INACTIVE' && (
          <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-start gap-4 shadow-sm">
            <span className="material-symbols-outlined text-rose-600 text-[24px]">block</span>
            <div>
              <p className="text-sm text-rose-900 font-bold mb-1">Gian hàng đã bị khóa tạm thời</p>
              <p className="text-xs text-rose-800 font-medium">Bạn không thể bán sản phẩm hiện tại. Vui lòng liên hệ bộ phận hỗ trợ để biết thêm chi tiết.</p>
            </div>
          </div>
        )}

        <div className="text-center md:text-left mb-10">
          <h1 className="text-2xl md:text-4xl font-black text-[#2e3785] mb-2 tracking-tight">
            {isUpdate ? 'Store Settings' : 'Start your business journey with us.'}
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            {isUpdate ? 'Cập nhật thông tin nhận diện thương hiệu của bạn.' : 'Join a community of successful sellers and grow your business today.'}
          </p>
        </div>

        <form onSubmit={handleSave} className="bg-white p-6 md:p-10 rounded-[2rem] border border-slate-100 shadow-sm space-y-10">
          <section>
            <div className="flex items-center gap-2 mb-6 border-b border-slate-50 pb-4">
              <span className="material-symbols-outlined text-[#2e3785] text-[20px]">cloud_upload</span>
              <h2 className="text-[15px] font-black text-slate-900">Visual Brand</h2>
            </div>
            <div>
              <label className="block text-[11px] font-black uppercase tracking-widest text-slate-500 mb-3">Shop Logo</label>
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="w-24 h-24 md:w-32 md:h-32 bg-slate-50 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-slate-400 overflow-hidden shrink-0">
                  {formData.logoUrl ? <img src={formData.logoUrl} className="w-full h-full object-cover" alt="Shop Logo" /> : <span className="material-symbols-outlined text-4xl">store</span>}
                </div>
                <div className="flex-1 text-center sm:text-left w-full border-2 border-dashed border-slate-200 rounded-2xl p-6 hover:bg-slate-50 transition cursor-pointer" onClick={() => logoInputRef.current.click()}>
                  <span className="material-symbols-outlined text-slate-400 mb-2">add_photo_alternate</span>
                  <p className="text-sm font-bold text-slate-700 mb-1">Click or drag to upload new logo</p>
                  <p className="text-xs text-slate-400 font-medium">SVG, PNG or JPG (Min. 400x400px)</p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-6 border-b border-slate-50 pb-4">
              <span className="material-symbols-outlined text-[#2e3785] text-[20px]">storefront</span>
              <h2 className="text-[15px] font-black text-slate-900">Shop Identity</h2>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-[11px] font-black uppercase tracking-widest text-slate-500 mb-2">Shop Name</label>
                <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="e.g. The Indigo Atelier" className="w-full bg-slate-50 border border-slate-100 px-4 py-3.5 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-[#2e3785]/20 outline-none transition" />
              </div>
              <div>
                <label className="block text-[11px] font-black uppercase tracking-widest text-slate-500 mb-2">Shop Description</label>
                <textarea required rows="4" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Tell the story of your brand and what makes your products unique..." className="w-full bg-slate-50 border border-slate-100 px-4 py-3.5 rounded-xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-[#2e3785]/20 outline-none resize-none transition"></textarea>
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-6 border-b border-slate-50 pb-4">
              <span className="material-symbols-outlined text-[#2e3785] text-[20px]">location_on</span>
              <h2 className="text-[15px] font-black text-slate-900">Business Details</h2>
            </div>
            <div>
              <label className="block text-[11px] font-black uppercase tracking-widest text-slate-500 mb-2">Full Legal Business Address</label>
              <textarea required rows="2" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} placeholder="Địa chỉ đăng ký kinh doanh/kho hàng..." className="w-full bg-slate-50 border border-slate-100 px-4 py-3.5 rounded-xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-[#2e3785]/20 outline-none resize-none transition"></textarea>
            </div>
          </section>

          <div className="pt-6">
            {!isUpdate && (
              <div className="flex items-start gap-3 mb-6">
                <input type="checkbox" required className="mt-1 border-slate-300 text-[#2e3785] focus:ring-[#2e3785] rounded" />
                <p className="text-xs text-slate-500 font-medium">I agree to the <a href="#" className="text-[#2e3785] font-bold hover:underline">Seller Handbook</a> and the privacy guidelines of the marketplace.</p>
              </div>
            )}
            <button type="submit" disabled={loading} className="w-full py-4 bg-[#2e3785] hover:bg-[#252d70] text-white text-sm font-black rounded-xl shadow-lg shadow-indigo-200 transition-all disabled:opacity-70 flex justify-center items-center gap-2">
              {loading ? 'Processing...' : (isUpdate ? 'Save Changes' : 'Create My Shop')}
            </button>
          </div>
        </form>
      </div>

      {status.msg && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5">
          <div className={`px-6 py-3 rounded-xl shadow-xl flex items-center gap-3 font-bold text-sm ${status.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
            <span className="material-symbols-outlined">{status.type === 'success' ? 'check_circle' : 'error'}</span>
            {status.msg}
          </div>
        </div>
      )}
    </div>
  );
};
export default ShopForm;