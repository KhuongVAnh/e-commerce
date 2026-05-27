import React, { useState, useEffect, useRef } from 'react';
import axiosClient from '../../utils/axiosClient';

const ShopForm = () => {
  const [loading, setLoading] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);
  const [initialData, setInitialData] = useState(null);
  const [formData, setFormData] = useState({ 
    name: '', description: '', phone: '', address: '', logoUrl: '', coverUrl: '' 
  });
  const [logoFile, setLogoFile] = useState(null);
  const [status, setStatus] = useState({ type: '', msg: '' });

  const logoInputRef = useRef(null);

  useEffect(() => {
    const loadShopInfo = async () => {
      try {
        const res = await axiosClient.get('/catalog/shops/my-shop');
        if (res.data?.shop) {
          const fetchedData = {
            name: res.data.shop.name || '', description: res.data.shop.description || '',
            address: res.data.shop.address || '', logoUrl: res.data.shop.logoUrl || '',
            phone: res.data.shop.phone || '', coverUrl: res.data.shop.coverUrl || '',
          };
          setFormData(fetchedData);
          setInitialData(fetchedData);
          setIsUpdate(true);
        }
      } catch {
        console.log("Chưa có shop");
      }
    };
    loadShopInfo();
  }, []);

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setFormData({ ...formData, [type]: previewUrl });
      if (type === 'logoUrl') setLogoFile(file);
    }
  };

  const handleDiscard = () => {
    if (initialData) setFormData(initialData);
    else setFormData({ name: '', description: '', phone: '', address: '', logoUrl: '', coverUrl: '' });
    setLogoFile(null);
  };

  const uploadImage = async (file) => {
    const uploadData = new FormData();
    uploadData.append('image', file);
    const res = await axiosClient.post('/uploads/images', uploadData);
    return res.data.url;
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const uploadedLogoUrl = logoFile ? await uploadImage(logoFile) : formData.logoUrl;
      const payload = {
        name: formData.name, description: formData.description,
        address: formData.address, logoUrl: uploadedLogoUrl || 'https://via.placeholder.com/150'
      };

      if (isUpdate) {
        await axiosClient.put('/catalog/shops/my-shop', payload);
        setStatus({ type: 'success', msg: 'Saved!' });
      } else {
        await axiosClient.post('/catalog/shops', payload);
        setStatus({ type: 'success', msg: 'Created!' });
        setIsUpdate(true);
      }
      const savedData = { ...formData, logoUrl: uploadedLogoUrl };
      setFormData(savedData);
      setInitialData(savedData);
      setLogoFile(null);
      setLastUpdated(`Today at ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`);
    } catch {
      setStatus({ type: 'error', msg: 'Error!' });
    } finally {
      setLoading(false);
      setTimeout(() => setStatus({ type: '', msg: '' }), 3000);
    }
  };

  return (
    <div className="font-sans bg-[#f8fafc] min-h-full flex flex-col relative pb-32 md:pb-24"> 
      <input type="file" accept="image/*" hidden ref={logoInputRef} onChange={handleLogoUpload} />

      <div className="flex-1 max-w-4xl p-4 md:p-8 lg:p-12 space-y-8 md:space-y-10 mt-8 md:mt-0">
        
        {shopStatus === 'PENDING' && (
          <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-lg flex items-center gap-3">
            <span className="material-symbols-outlined text-orange-600">hourglass_empty</span>
            <p className="text-sm text-orange-800 font-bold">Gian hàng của bạn đang ở trạng thái CHỜ DUYỆT. Sản phẩm sẽ chưa được public.</p>
          </div>
        )}
        {shopStatus === 'INACTIVE' && (
          <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-lg flex items-center gap-3">
            <span className="material-symbols-outlined text-rose-600">block</span>
            <p className="text-sm text-rose-800 font-bold">Gian hàng của bạn ĐÃ BỊ KHÓA. Liên hệ Admin để xử lý.</p>
          </div>
        )}

        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 mb-2">Store Settings</h1>
          <p className="text-slate-500 text-xs md:text-sm font-medium">Configure your brand assets and merchant identity.</p>
        </div>

        <section>
          <h2 className="text-[13px] md:text-[15px] font-bold text-[#2e3785] mb-4">Brand Assets</h2>
          <div className="relative mt-2">
            <div className="h-40 md:h-56 bg-slate-200 rounded-2xl w-full relative flex items-center justify-center border border-slate-200 overflow-hidden cursor-not-allowed opacity-60">
              <span className="text-slate-400 font-bold flex flex-col items-center gap-2"><span className="material-symbols-outlined text-3xl">hide_image</span>Cover Photo (API chưa hỗ trợ)</span>
            </div>
            <div className="absolute -bottom-6 left-4 md:-bottom-8 md:left-8 flex items-end gap-3 md:gap-4">
              <div className="w-20 h-20 md:w-24 md:h-24 bg-[#1e293b] rounded-2xl border-4 border-[#f8fafc] shadow-sm flex flex-col items-center justify-center text-white overflow-hidden">
                {formData.logoUrl ? <img src={formData.logoUrl} className="w-full h-full object-cover" /> : <><span className="material-symbols-outlined text-2xl md:text-3xl text-[#fde047]">store</span><span className="text-[8px] md:text-[10px] font-black tracking-widest mt-1">SHOP</span></>}
              </div>
              <button onClick={() => logoInputRef.current.click()} className="bg-white border border-slate-200 text-slate-700 text-[10px] md:text-[11px] font-bold px-2.5 md:px-3 py-1 md:py-1.5 rounded-lg shadow-sm hover:bg-slate-50 mb-1 md:mb-2">Update Logo</button>
            </div>
          </div>
        </section>

        <section className="pt-10 md:pt-8">
          <div className="flex items-center gap-2 mb-4"><span className="material-symbols-outlined text-[#2e3785] text-[18px] md:text-[20px]">branding_watermark</span><h2 className="text-[13px] md:text-[15px] font-bold text-slate-900">Store Identity</h2></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Shop Name</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Tên gian hàng" className="w-full bg-[#f1f5f9] border-none p-3.5 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Shop Bio</label>
                <textarea rows="4" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Mô tả gian hàng" className="w-full bg-[#f1f5f9] border-none p-3.5 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none resize-none"></textarea>
              </div>
            </div>
          </div>
        </section>

        <section className="pt-4 border-t border-slate-200">
          <div className="flex items-center gap-2 mb-4"><span className="material-symbols-outlined text-[#2e3785] text-[18px] md:text-[20px]">location_on</span><h2 className="text-[13px] md:text-[15px] font-bold text-slate-900">Business Address</h2></div>
          <div className="max-w-2xl space-y-6">
            <div>
              <label className="flex justify-between text-xs font-bold text-slate-700 mb-2">Contact Phone <span className="text-orange-500 font-normal">API chưa hỗ trợ</span></label>
              <input type="text" disabled placeholder="Không hỗ trợ lưu SĐT" className="w-full bg-slate-200 border-none p-3.5 rounded-xl text-sm font-medium cursor-not-allowed opacity-60" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Business Address</label>
              <textarea rows="3" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} placeholder="Địa chỉ kho" className="w-full bg-[#f1f5f9] border-none p-3.5 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none resize-none"></textarea>
            </div>
          </div>
        </section>
      </div>

      <div className="fixed bottom-0 left-0 md:left-64 w-full md:w-[calc(100%-16rem)] bg-[#f8fafc]/95 backdrop-blur-xl border-t border-slate-200 p-3 md:p-4 px-4 md:px-8 flex items-center justify-between z-50">
        <div>{status.msg && <span className={`text-xs font-bold px-3 py-1.5 rounded ${status.type === 'success' ? 'bg-emerald-100 text-emerald-700' : status.type === 'loading' ? 'bg-blue-100 text-blue-700' : 'bg-rose-100 text-rose-700'}`}>{status.msg}</span>}</div>
        <button onClick={handleSave} disabled={loading} className="px-6 py-2.5 text-sm font-bold bg-[#313b8e] hover:bg-[#252d70] text-white rounded-lg transition flex items-center gap-2">{loading ? 'Saving...' : 'Save'}</button>
      </div>
    </div>
  );
};
export default ShopForm;
