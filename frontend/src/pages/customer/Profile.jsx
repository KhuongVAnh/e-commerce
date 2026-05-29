import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user } = useAuthStore();

  const savedProfile = JSON.parse(localStorage.getItem('demoProfile')) || {};

  const [savedData, setSavedData] = useState({
    name: savedProfile.name || user?.fullName || 'Nguyễn Văn Thắng',
    email: savedProfile.email || user?.email || 'customer1@cnweb.local',
    phone: savedProfile.phone || '0912345678'
  });

  const [formData, setFormData] = useState({
    name: savedData.name,
    email: savedData.email,
    phone: savedData.phone,
    gender: savedProfile.gender || 'male',
    day: savedProfile.day || '15',
    month: savedProfile.month || '8',
    year: savedProfile.year || '2004'
  });

  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [activeSection, setActiveSection] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleSaveProfile = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      localStorage.setItem('demoProfile', JSON.stringify(formData));
      
      setSavedData({
        name: formData.name,
        email: formData.email,
        phone: formData.phone
      });

      toast.success('Cập nhật hồ sơ thành công!');
    } catch (err) {
      toast.error('Có lỗi xảy ra!');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Mật khẩu mới nhập lại không trùng khớp!');
      return;
    }

    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Đổi mật khẩu thành công!');
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error('Có lỗi xảy ra!');
    } finally {
      setIsLoading(false);
    }
  };

  const avatarLetter = savedData.name ? savedData.name.charAt(0).toUpperCase() : 'N';

  return (
    <div className="max-w-screen-xl mx-auto py-8 lg:flex gap-8 font-['Inter']">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-full lg:w-64 shrink-0 mb-8 lg:mb-0">
        <div className="flex items-center gap-4 mb-8 px-2">
          <div className="w-12 h-12 rounded-full bg-indigo-100 text-[#2b3896] flex items-center justify-center font-bold text-xl border-2 border-[#2b3896]/20">
            {avatarLetter}
          </div>
          <div>
            <p className="font-bold text-gray-900 truncate w-44">{savedData.name}</p>
            <button 
              onClick={() => setActiveSection('profile')} 
              className="text-xs text-gray-500 flex items-center gap-1 hover:text-[#2b3896] transition-colors mt-0.5 font-medium"
            >
              <span className="material-symbols-outlined text-[14px]">edit</span> Sửa Hồ Sơ
            </button>
          </div>
        </div>

        <nav className="space-y-2">
          <div>
            <div className="flex items-center gap-3 px-4 py-2.5 text-[#2b3896] font-bold bg-indigo-50/50 rounded-xl">
              <span className="material-symbols-outlined text-[20px]">person</span>
              <span>Tài khoản của tôi</span>
            </div>
            <div className="ml-11 mt-2 space-y-3">
              <button 
                onClick={() => setActiveSection('profile')} 
                className={`block text-sm text-left w-full transition-colors ${activeSection === 'profile' ? 'text-[#2b3896] font-bold relative before:content-[""] before:absolute before:-left-4 before:top-1/2 before:-translate-y-1/2 before:w-1 before:h-4 before:bg-[#2b3896] before:rounded-full' : 'text-gray-500 font-medium hover:text-[#2b3896]'}`}
              >
                Hồ sơ
              </button>
              <button 
                onClick={() => setActiveSection('password')} 
                className={`block text-sm text-left w-full transition-colors ${activeSection === 'password' ? 'text-[#2b3896] font-bold relative before:content-[""] before:absolute before:-left-4 before:top-1/2 before:-translate-y-1/2 before:w-1 before:h-4 before:bg-[#2b3896] before:rounded-full' : 'text-gray-500 font-medium hover:text-[#2b3896]'}`}
              >
                Đổi mật khẩu
              </button>
            </div>
          </div>

          <Link to="/orders" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:text-[#2b3896] hover:bg-gray-50 rounded-xl transition-colors group">
            <span className="material-symbols-outlined text-[20px] text-gray-400 group-hover:text-[#2b3896]">receipt_long</span>
            <span className="text-sm font-bold">Đơn mua</span>
          </Link>
          <Link to="/notifications" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:text-[#2b3896] hover:bg-gray-50 rounded-xl transition-colors group">
            <span className="material-symbols-outlined text-[20px] text-gray-400 group-hover:text-[#2b3896]">notifications</span>
            <span className="text-sm font-bold">Thông báo</span>
          </Link>
        </nav>
      </aside>

      {/* MAIN CONTENT AREA */}
      <section className="flex-1 bg-white rounded-3xl shadow-[0px_12px_32px_rgba(43,56,150,0.04)] border border-gray-100 overflow-hidden">
        
        {/* VIEW 1: GIAO DIỆN HỒ SƠ */}
        {activeSection === 'profile' && (
          <>
            <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/30">
              <h1 className="text-xl font-black text-[#2b3896] tracking-tight font-['Be_Vietnam_Pro']">Hồ Sơ Của Tôi</h1>
              <p className="text-sm text-gray-500 mt-1 font-medium">Quản lý và bảo mật thông tin tài khoản của bạn</p>
            </div>

            <div className="p-8 lg:flex gap-12">
              <div className="flex-1 space-y-8">
                
                {/* Tên đăng nhập */}
                <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] items-center gap-4">
                  <label className="text-sm text-gray-500 font-bold md:text-right">Tên đăng nhập</label>
                  <div className="text-sm font-bold text-gray-900 px-1">
                    {savedData.email.split('@')[0]}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] items-center gap-4">
                  <label htmlFor="name" className="text-sm text-gray-500 font-bold md:text-right">Họ và Tên</label>
                  <input 
                    id="name" name="name" type="text" 
                    value={formData.name} onChange={handleInputChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:border-[#2b3896] focus:ring-2 focus:ring-[#2b3896]/20 transition-all outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] items-center gap-4">
                  <label className="text-sm text-gray-500 font-bold md:text-right">Email</label>
                  <input 
                    name="email" type="email" 
                    value={formData.email} onChange={handleInputChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:border-[#2b3896] focus:ring-2 focus:ring-[#2b3896]/20 transition-all outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] items-center gap-4">
                  <label className="text-sm text-gray-500 font-bold md:text-right">Số điện thoại</label>
                  <input 
                    name="phone" type="tel" 
                    value={formData.phone} onChange={handleInputChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:border-[#2b3896] focus:ring-2 focus:ring-[#2b3896]/20 transition-all outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] items-center gap-4">
                  <label className="text-sm text-gray-500 font-bold md:text-right">Giới tính</label>
                  <div className="flex items-center gap-6 px-1">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input type="radio" name="gender" value="male" checked={formData.gender === 'male'} onChange={handleInputChange} className="w-4 h-4 text-[#2b3896] focus:ring-[#2b3896] border-gray-300" />
                      <span className="text-sm font-medium text-gray-700 group-hover:text-[#2b3896] transition-colors">Nam</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input type="radio" name="gender" value="female" checked={formData.gender === 'female'} onChange={handleInputChange} className="w-4 h-4 text-[#2b3896] focus:ring-[#2b3896] border-gray-300" />
                      <span className="text-sm font-medium text-gray-700 group-hover:text-[#2b3896] transition-colors">Nữ</span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] items-center gap-4">
                  <label className="text-sm text-gray-500 font-bold md:text-right">Ngày sinh</label>
                  <div className="flex gap-3">
                    <select name="day" value={formData.day} onChange={handleInputChange} className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium w-full focus:border-[#2b3896] focus:ring-2 focus:ring-[#2b3896]/20 outline-none cursor-pointer">
                      {[...Array(31)].map((_, i) => <option key={i+1} value={i+1}>{i + 1}</option>)}
                    </select>
                    <select name="month" value={formData.month} onChange={handleInputChange} className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium w-full focus:border-[#2b3896] focus:ring-2 focus:ring-[#2b3896]/20 outline-none cursor-pointer">
                      {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>Tháng {i + 1}</option>)}
                    </select>
                    <select name="year" value={formData.year} onChange={handleInputChange} className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium w-full focus:border-[#2b3896] focus:ring-2 focus:ring-[#2b3896]/20 outline-none cursor-pointer">
                      {[...Array(60)].map((_, i) => {
                        const year = new Date().getFullYear() - i - 16;
                        return <option key={year} value={year}>{year}</option>;
                      })}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] items-center gap-4 pt-6">
                  <div></div>
                  <button 
                    onClick={handleSaveProfile} disabled={isLoading}
                    className="w-full sm:w-fit px-12 py-3.5 bg-gradient-to-br from-[#2b3896] to-[#4551af] text-white font-bold rounded-xl shadow-lg shadow-[#2b3896]/20 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    {isLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                </div>
              </div>

              <div className="block lg:hidden my-10 h-px bg-gray-100"></div>

              {/* Avatar to bên phải */}
              <div className="lg:w-72 flex flex-col items-center lg:border-l border-gray-100 lg:pl-12">
                <div className="relative group mb-6">
                  <div className="w-32 h-32 rounded-full bg-indigo-100 text-[#2b3896] flex items-center justify-center font-bold text-5xl border-4 border-white shadow-lg overflow-hidden">
                     {avatarLetter}
                  </div>
                  <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer backdrop-blur-[2px]">
                    <span className="material-symbols-outlined text-white text-3xl">photo_camera</span>
                  </div>
                </div>
                <button className="px-6 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-95">
                  Chọn Ảnh
                </button>
              </div>
            </div>
          </>
        )}

        {/* VIEW 2: GIAO DIỆN ĐỔI MẬT KHẨU */}
        {activeSection === 'password' && (
          <>
            <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/30">
              <h1 className="text-xl font-black text-[#2b3896] tracking-tight font-['Be_Vietnam_Pro']">Đổi Mật Khẩu</h1>
              <p className="text-sm text-gray-500 mt-1 font-medium">Để bảo mật tài khoản, vui lòng không chia sẻ mật khẩu cho người khác</p>
            </div>

            <form onSubmit={handleSavePassword} className="p-8 max-w-2xl space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-[160px_1fr] items-center gap-4">
                <label className="text-sm text-gray-500 font-bold md:text-right">Mật khẩu hiện tại</label>
                <input 
                  type="password" name="oldPassword" required
                  value={passwordData.oldPassword} onChange={handlePasswordChange}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:border-[#2b3896] focus:ring-2 focus:ring-[#2b3896]/20 transition-all outline-none"
                  placeholder="Nhập mật khẩu hiện tại"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[160px_1fr] items-center gap-4">
                <label className="text-sm text-gray-500 font-bold md:text-right">Mật khẩu mới</label>
                <input 
                  type="password" name="newPassword" required
                  value={passwordData.newPassword} onChange={handlePasswordChange}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:border-[#2b3896] focus:ring-2 focus:ring-[#2b3896]/20 transition-all outline-none"
                  placeholder="Mật khẩu mới từ 6 ký tự trở lên"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[160px_1fr] items-center gap-4">
                <label className="text-sm text-gray-500 font-bold md:text-right">Xác nhận mật khẩu</label>
                <input 
                  type="password" name="confirmPassword" required
                  value={passwordData.confirmPassword} onChange={handlePasswordChange}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:border-[#2b3896] focus:ring-2 focus:ring-[#2b3896]/20 transition-all outline-none"
                  placeholder="Nhập lại mật khẩu mới"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[160px_1fr] items-center gap-4 pt-4">
                <div></div>
                <button 
                  type="submit" disabled={isLoading}
                  className="w-full sm:w-fit px-12 py-3.5 bg-gradient-to-br from-[#2b3896] to-[#4551af] text-white font-bold rounded-xl shadow-lg shadow-[#2b3896]/20 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {isLoading ? 'Đang cập nhật...' : 'Xác nhận'}
                </button>
              </div>
            </form>
          </>
        )}

      </section>
    </div>
  );
};

export default Profile;