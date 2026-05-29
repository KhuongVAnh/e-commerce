import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { authService } from '../../services/authService';
import AuthBackground from '../../components/AuthBackground';

const Register = () => {
  const navigate = useNavigate();

  // State quản lý việc chọn Role
  const [role, setRole] = useState('customer');
  
  // State quản lý ẩn/hiện mật khẩu
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // State quản lý API và Form
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  // Cập nhật dữ liệu khi gõ
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrorMsg(''); // Xóa lỗi khi gõ lại
  };

  // Xử lý khi bấm nút Đăng Ký
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setErrorMsg("Mật khẩu xác nhận không khớp!");
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const payload = {
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        role: role.toUpperCase()
      };

      await authService.register(payload);
      
      alert("Đăng ký thành công! Vui lòng đăng nhập.");
      navigate('/login');

    } catch (error) {
      if (error && error.fieldErrors && error.fieldErrors.length > 0) {
        setErrorMsg(error.fieldErrors[0].message);
      } else if (error && error.message) {
        setErrorMsg(error.message);
      } else {
        setErrorMsg("Đăng ký thất bại. Vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-sans text-gray-900 min-h-screen flex flex-col relative">
      <main className="flex-grow flex flex-col items-center justify-center relative overflow-hidden px-4 py-12">
        
        <AuthBackground theme="teal" />

        <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none z-0"></div>
        <div className="absolute bottom-[-5%] left-[-10%] w-[32rem] h-[32rem] bg-orange-600/10 rounded-full blur-3xl pointer-events-none z-0"></div>

        <div className="mb-10 text-center z-10 w-full flex flex-col items-center pointer-events-none">
          <h1 className="text-4xl font-extrabold tracking-tighter text-[#2b3896] leading-none mb-2 uppercase drop-shadow-md bg-white/50 px-6 py-2 rounded-2xl backdrop-blur-sm inline-block">
            E-COMMERCE
          </h1>
          <p className="text-gray-600 tracking-wide uppercase text-xs font-bold drop-shadow-sm bg-white/50 px-4 py-1 rounded-full backdrop-blur-sm mt-2">
            Sàn thương mại điện tử dành cho bạn
          </p>
        </div>

        <section className="w-full max-w-md z-10">
          <div className="bg-white/90 backdrop-blur-xl shadow-[0px_12px_32px_rgba(43,56,150,0.15)] rounded-3xl p-8 md:p-10 border border-white/40">
            <header className="mb-8 text-center">
              <h2 className="font-extrabold text-2xl text-gray-900 leading-tight tracking-tight">Tạo Tài Khoản</h2>
              <p className="text-gray-500 text-sm mt-2 font-medium">Bắt đầu hành trình mua sắm & kinh doanh của bạn.</p>
            </header>

            {/* HIỂN THỊ LỖI */}
            {errorMsg && (
              <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl font-medium text-center">
                {errorMsg}
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
              
              {/* Chọn Role */}
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">Bạn muốn đăng ký làm:</span>
                <div className="flex p-1.5 bg-gray-100 rounded-full">
                  <button 
                    type="button"
                    onClick={() => setRole('customer')}
                    className={`flex-1 py-2.5 px-4 rounded-full text-sm font-bold transition-all duration-300 ${role === 'customer' ? 'bg-white text-[#2b3896] shadow-sm' : 'text-gray-500 hover:text-[#2b3896]'}`}
                  >
                    Khách hàng
                  </button>
                  <button 
                    type="button"
                    onClick={() => setRole('seller')}
                    className={`flex-1 py-2.5 px-4 rounded-full text-sm font-bold transition-all duration-300 ${role === 'seller' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-orange-600'}`}
                  >
                    Người bán
                  </button>
                </div>
              </div>

              {/* Các Input Fields */}
              <div className="space-y-4">
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 ml-1 uppercase tracking-widest">Họ và Tên</label>
                  <input 
                    name="fullName"
                    type="text" 
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Nguyễn Văn A" 
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-5 py-4 text-gray-900 placeholder-gray-400 focus:ring-2 focus:border-[#2b3896] focus:ring-[#2b3896]/40 transition-all outline-none text-sm font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 ml-1 uppercase tracking-widest">Địa chỉ Email</label>
                  <input 
                    name="email"
                    type="email" 
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="nguyenvana@example.com" 
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-5 py-4 text-gray-900 placeholder-gray-400 focus:ring-2 focus:border-[#2b3896] focus:ring-[#2b3896]/40 transition-all outline-none text-sm font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 ml-1 uppercase tracking-widest">Mật khẩu</label>
                    <div className="relative">
                      <input 
                        name="password"
                        type={showPassword ? "text" : "password"} 
                        required
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="••••••••" 
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-5 py-4 text-gray-900 placeholder-gray-400 focus:ring-2 focus:border-[#2b3896] focus:ring-[#2b3896]/40 transition-all outline-none text-sm font-medium pr-12"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#2b3896] transition-colors"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 ml-1 uppercase tracking-widest">Xác nhận mật khẩu</label>
                    <div className="relative">
                      <input 
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"} 
                        required
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="••••••••" 
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-5 py-4 text-gray-900 placeholder-gray-400 focus:ring-2 focus:border-[#2b3896] focus:ring-[#2b3896]/40 transition-all outline-none text-sm font-medium pr-12"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#2b3896] transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Nút Submit */}
              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={loading}
                  className={`w-full text-white font-bold tracking-widest uppercase py-4 rounded-full shadow-lg transition-all duration-150 text-sm ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-br from-[#2b3896] to-[#4551af] shadow-[#2b3896]/20 hover:scale-[1.02] active:scale-[0.98]'}`}
                >
                  {loading ? 'Đang xử lý...' : 'Đăng Ký Tài Khoản'}
                </button>
              </div>
            </form>

            <div className="mt-8 text-center">
              <p className="text-gray-500 text-sm font-medium">
                Bạn đã có tài khoản? 
                <Link to="/login" className="text-[#2b3896] font-bold hover:underline transition-all ml-1">Đăng Nhập</Link>
              </p>
            </div>
          </div>

          <div className="mt-8 px-6 text-center">
            <p className="text-gray-400 text-[11px] leading-relaxed uppercase tracking-widest font-semibold drop-shadow-sm bg-white/50 backdrop-blur-sm rounded-lg p-2 inline-block">
              Bằng việc đăng ký, bạn đồng ý với <Link to="/terms" className="hover:text-[#2b3896] transition-colors underline">Điều khoản</Link> & <Link to="/privacy" className="hover:text-[#2b3896] transition-colors underline">Bảo mật</Link>
            </p>
          </div>
        </section>
      </main>

      <footer className="w-full py-6 text-center border-t border-gray-200 bg-white/50 backdrop-blur-sm relative z-10">
        <p className="text-xs text-gray-500 tracking-widest uppercase font-bold">© 2026 Đồ án E-Commerce. Nhóm 31.</p>
      </footer>
    </div>
  );
};

export default Register;