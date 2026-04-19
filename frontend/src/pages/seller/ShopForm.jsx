import React, { useState, useEffect, useRef } from 'react';
import axiosClient from '../../utils/axiosClient';

const ShopForm = () => {
  const [loading, setLoading] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);
  const [initialData, setInitialData] = useState(null);
  const [formData, setFormData] = useState({ 
    name: '', description: '', phone: '', address: '', logoUrl: '', coverUrl: '' 
  });
  const [status, setStatus] = useState({ type: '', msg: '' });
  const [lastUpdated, setLastUpdated] = useState('Today at 09:42 AM');

  const coverInputRef = useRef(null);
  const logoInputRef = useRef(null);

  useEffect(() => {
    const loadShopInfo = async () => {
      try {
        const res = await axiosClient.get('/shops/my-shop');
        if (res && res.shop) {
          const fetchedData = {
            name: res.shop.name || '',
            description: res.shop.description || '',
            address: res.shop.address || '',
            logoUrl: res.shop.logoUrl || '',
            phone: res.shop.phone || '', 
            coverUrl: res.shop.coverUrl || '',
          };
          setFormData(fetchedData);
          setInitialData(fetchedData);
          setIsUpdate(true);
        }
      } catch (err) {
        console.log("Chưa có shop");
      }
    };
    loadShopInfo();
  }, []);

  const handleImageUpload = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setFormData({ ...formData, [type]: previewUrl });
    }
  };

  const handleDiscard = () => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({ name: '', description: '', phone: '', address: '', logoUrl: '', coverUrl: '' });
    }
  };

  const handleSave = async () => {
    setLoading(true);
    const payload = {
      name: formData.name,
      description: formData.description,
      address: formData.address,
      logoUrl: formData.logoUrl || 'https://via.placeholder.com/150'
    };

    try {
      if (isUpdate) {
        await axiosClient.put('/shops/my-shop', payload);
        setStatus({ type: 'success', msg: 'Saved!' });
      } else {
        await axiosClient.post('/shops', payload);
        setStatus({ type: 'success', msg: 'Created!' });
        setIsUpdate(true);
      }
      setInitialData(formData);
      setLastUpdated(`Today at ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`);
    } catch (err) {
      setStatus({ type: 'error', msg: 'Error!' });
    } finally {
      setLoading(false);
      setTimeout(() => setStatus({ type: '', msg: '' }), 3000);
    }
  };

  return (
    <div className="font-sans bg-[#f8fafc] min-h-full flex flex-col relative pb-24"> 
      <input type="file" accept="image/*" hidden ref={coverInputRef} onChange={(e) => handleImageUpload(e, 'coverUrl')} />
      <input type="file" accept="image/*" hidden ref={logoInputRef} onChange={(e) => handleImageUpload(e, 'logoUrl')} />

      <div className="flex-1 max-w-4xl p-8 md:p-12 space-y-10">
        <div>
          <h1 className="text-3xl font-black text-slate-900 mb-2">Store Settings</h1>
          <p className="text-slate-500 text-sm font-medium">Configure your brand assets and merchant identity.</p>
        </div>

        <section>
          <h2 className="text-[15px] font-bold text-[#2e3785] mb-4">Brand Assets</h2>
          <div className="relative mt-2">
            <div className="h-56 bg-[#51707d] rounded-2xl w-full relative overflow-hidden border border-slate-200">
              {formData.coverUrl && <img src={formData.coverUrl} alt="Cover" className="w-full h-full object-cover" />}
              <div className="absolute right-4 bottom-4">
                <button onClick={() => coverInputRef.current.click()} className="bg-white text-slate-700 text-xs font-bold px-4 py-2 rounded-lg shadow-sm border border-slate-100 flex items-center gap-2 hover:bg-slate-50 transition">
                  <span className="material-symbols-outlined text-[16px]">edit</span> Change Cover Photo
                </button>
              </div>
            </div>

            <div className="absolute -bottom-8 left-8 flex items-end gap-4">
              <div className="w-24 h-24 bg-[#1e293b] rounded-2xl border-4 border-[#f8fafc] shadow-sm flex flex-col items-center justify-center text-white overflow-hidden">
                {formData.logoUrl ? (
                  <img src={formData.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <span className="material-symbols-outlined text-3xl text-[#fde047]">store</span>
                    <span className="text-[10px] font-black tracking-widest mt-1">SHOP</span>
                  </>
                )}
              </div>
              <button onClick={() => logoInputRef.current.click()} className="bg-white border border-slate-200 text-slate-700 text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-sm hover:bg-slate-50 mb-2">
                Update Logo
              </button>
            </div>
          </div>
        </section>

        <section className="pt-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-[#2e3785] text-[20px]">branding_watermark</span>
            <h2 className="text-[15px] font-bold text-slate-900">Store Identity</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Shop Name</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Signature Boutique" className="w-full bg-[#f1f5f9] border-none p-3.5 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Shop Bio</label>
                <textarea rows="4" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Curating the finest silks and ceramics..." className="w-full bg-[#f1f5f9] border-none p-3.5 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none resize-none"></textarea>
              </div>
            </div>
            <div className="bg-[#f0f3ff] rounded-2xl p-6 h-fit border border-[#e0e7ff]">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-[#2e3785] text-[18px]">lightbulb</span>
                <h3 className="text-sm font-bold text-[#2e3785]">Editorial Tip</h3>
              </div>
              <p className="text-[13px] text-slate-600 leading-relaxed font-medium">Use high-resolution photography for your cover photo. Minimalist interiors or lifestyle shots work best to create an "expensive" feel for your customers.</p>
            </div>
          </div>
        </section>

        <section className="pt-4 border-t border-slate-200">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-[#2e3785] text-[20px]">contact_support</span>
            <h2 className="text-[15px] font-bold text-slate-900">Contact Information</h2>
          </div>
          <div className="max-w-2xl space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Contact Phone</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">call</span>
                <input type="text" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="+84 90 123 4567" className="w-full bg-[#f1f5f9] border-none py-3.5 pl-12 pr-4 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Business Address</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-4 text-slate-400 text-[18px]">location_on</span>
                <textarea rows="3" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} placeholder="123 Le Loi Street, District 1, Ho Chi Minh City, Vietnam" className="w-full bg-[#f1f5f9] border-none py-3.5 pl-12 pr-4 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none resize-none"></textarea>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="fixed bottom-0 right-0 w-full md:w-[calc(100%-16rem)] bg-[#f8fafc]/95 backdrop-blur-xl border-t border-slate-200 p-4 px-8 flex justify-between items-center z-50">
        <div className="flex items-center gap-4">
          <span className="text-[12px] font-medium text-slate-500 italic">Last updated: {lastUpdated}</span>
          {status.msg && <span className={`text-[11px] font-bold px-2 py-1 rounded ${status.type === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{status.msg}</span>}
        </div>
        <div className="flex items-center gap-4">
          <button onClick={handleDiscard} className="px-6 py-2.5 text-sm font-bold text-slate-900 hover:bg-slate-200 rounded-lg transition">Discard</button>
          <button onClick={handleSave} disabled={loading} className="px-6 py-2.5 text-sm font-bold bg-[#313b8e] hover:bg-[#252d70] text-white rounded-lg transition disabled:opacity-70 flex items-center gap-2">
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShopForm;