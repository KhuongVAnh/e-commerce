import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { authService } from '../../services/authService';
import useAuthStore from '../../store/useAuthStore';

const Login = () => {
  const navigate = useNavigate();
  const setAuthData = useAuthStore((state) => state.setAuthData);

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // State lưu dữ liệu người dùng gõ vào form
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  // Hàm cập nhật data khi gõ phím
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrorMsg('');
  };

  // Hàm xử lý khi bấm nút Đăng nhập
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      // 1. Gọi API
      const res = await authService.login(formData.email, formData.password);
      
      // 2. Lấy data trả về
      const userData = res.user;
      const accessToken = res.tokens.accessToken;

      // 3. Lưu vào Zustand & LocalStorage
      setAuthData(userData, accessToken);

      // 4. Điều hướng dựa theo Role
      if (userData.role === 'ADMIN') {
        navigate('/admin');
      } else if (userData.role === 'SELLER') {
        navigate('/seller');
      } else {
        navigate('/');
      }

    } catch (error) {
      if (error && error.message) {
        setErrorMsg(error.message);
      } else {
        setErrorMsg("Đăng nhập thất bại. Vui lòng kiểm tra lại hệ thống.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 font-sans text-gray-900 min-h-screen flex flex-col">
      <main className="flex-grow flex flex-col items-center justify-center relative overflow-hidden px-4 py-12 bg-gradient-to-br from-gray-50 to-gray-200">
        
        <div className="absolute top-[-10%] right-[-5%] w-[40rem] h-[40rem] rounded-full bg-[#2b3896]/5 blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[30rem] h-[30rem] rounded-full bg-orange-600/5 blur-[100px] pointer-events-none"></div>
        
        <div className="mb-10 text-center w-full flex flex-col items-center z-10">
          <h1 className="text-4xl font-extrabold tracking-tighter text-[#2b3896] leading-none mb-2 uppercase">
            E-COMMERCE
          </h1>
          <p className="text-gray-500 tracking-wide uppercase text-xs font-semibold">
            Sàn thương mại điện tử dành cho bạn
          </p>
        </div>

        <div className="w-full max-w-md z-10">
          <div className="bg-white shadow-[0px_12px_32px_rgba(43,56,150,0.06)] rounded-3xl p-8 md:p-10 border border-gray-100">
            <header className="mb-6 text-center">
              <h2 className="font-extrabold text-2xl text-gray-900 leading-tight tracking-tight">Đăng Nhập</h2>
            </header>

            {/* HIỂN THỊ THÔNG BÁO LỖI */}
            {errorMsg && (
              <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl font-medium text-center">
                {errorMsg}
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
              
              {/* Input Email */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">
                  Địa chỉ Email
                </label>
                <div className="relative">
                  <input 
                    name="email"
                    type="email" 
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="name@example.com" 
                    className="w-full px-4 py-4 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-[#2b3896]/40 transition-all outline-none text-sm"
                  />
                </div>
              </div>

              {/* Input Password */}
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500">
                    Mật khẩu
                  </label>
                  
                </div>
                <div className="relative">
                  <input 
                    name="password"
                    type={showPassword ? "text" : "password"} 
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••" 
                    className="w-full px-4 py-4 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-[#2b3896]/40 transition-all outline-none text-sm"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#2b3896] transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                  <Link to="/forgot-password" className="text-[11px] font-bold text-[#2b3896] hover:text-[#4551af] transition-colors uppercase tracking-wider">
                    Quên mật khẩu?
                  </Link>
                </div>
              </div>

              {/* Nút Submit */}
              <button 
                type="submit" 
                disabled={loading}
                className={`w-full py-4 rounded-full text-white font-bold text-sm tracking-widest uppercase shadow-lg transition-all 
                  ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-br from-[#2b3896] to-[#4551af] shadow-[#2b3896]/20 hover:scale-[1.02] active:scale-95'}`}
              >
                {loading ? 'Đang xử lý...' : 'Đăng nhập'}
              </button>

              <p className="text-center mt-6 text-sm text-gray-500 font-medium">
                Bạn chưa có tài khoản?{' '}
                <Link to="/register" className="text-[#2b3896] hover:underline font-bold transition-all">
                  Đăng Ký
                </Link>
              </p>
            </form>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="w-full py-6 text-center border-t border-gray-200 bg-gray-50 mt-auto">
        <p className="text-xs text-gray-400 tracking-widest uppercase font-bold">© 2026 Đồ án E-Commerce. Nhóm 4.</p>
      </footer>
    </div>
  );
};

export default Login;