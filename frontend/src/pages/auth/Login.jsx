import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, User, Store, ShieldAlert, ArrowLeft } from 'lucide-react';
import { authService } from '../../services/authService';
import useAuthStore from '../../store/useAuthStore';
import AuthBackground from '../../components/AuthBackground';

const Login = () => {
  const navigate = useNavigate();
  const setAuthData = useAuthStore((state) => state.setAuthData);

  const [step, setStep] = useState(1);
  const [role, setRole] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrorMsg('');
  };

  const handleSelectRole = (selectedRole) => {
    setRole(selectedRole);
    setStep(2);
    setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await authService.login(formData.email, formData.password, role);
      
      const userData = res.data.user;
      const accessToken = res.data.tokens?.accessToken;

      setAuthData(userData, accessToken);

      if (userData.role === 'ADMIN') {
        navigate('/admin');
      } else if (userData.role === 'SELLER') {
        navigate('/seller');
      } else {
        navigate('/');
      }

    } catch (error) {
      if (error?.error?.fieldErrors?.length > 0) {
        setErrorMsg(error.error.fieldErrors[0].message);
      } else if (error?.message) {
        setErrorMsg(error.message);
      } else {
        setErrorMsg("Đăng nhập thất bại. Vui lòng kiểm tra lại hệ thống.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-sans text-gray-900 min-h-screen flex flex-col relative">
      <main className="flex-grow flex flex-col items-center justify-center relative overflow-hidden px-4 py-12">
        
        {/* HIỆU ỨNG NỀN TƯƠNG TÁC */}
        <AuthBackground />
        
        {/* LỚP DECORATION MỜ */}
        <div className="absolute top-[-10%] right-[-5%] w-[40rem] h-[40rem] rounded-full bg-[#2b3896]/10 blur-[120px] pointer-events-none z-0"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[30rem] h-[30rem] rounded-full bg-orange-600/10 blur-[100px] pointer-events-none z-0"></div>
        
        {/* NỘI DUNG CHÍNH  */}
        <div className="mb-10 text-center w-full flex flex-col items-center z-10 pointer-events-none">
          <h1 className="text-4xl font-extrabold tracking-tighter text-[#2b3896] leading-none mb-2 uppercase drop-shadow-md bg-white/50 px-6 py-2 rounded-2xl backdrop-blur-sm inline-block">
            E-COMMERCE
          </h1>
          <p className="text-gray-600 tracking-wide uppercase text-xs font-bold drop-shadow-sm bg-white/50 px-4 py-1 rounded-full backdrop-blur-sm mt-2">
            Sàn thương mại điện tử dành cho bạn
          </p>
        </div>

        {/* CONTAINER FORM */}
        <div className="w-full max-w-md z-10">
          <div className="bg-white/90 backdrop-blur-xl shadow-[0px_12px_32px_rgba(43,56,150,0.15)] rounded-3xl p-8 md:p-10 border border-white/40 min-h-[400px] flex flex-col justify-center">
            
            {/* BƯỚC 1: MÀN HÌNH CHỌN ROLE */}
            {step === 1 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <header className="mb-8 text-center">
                  <h2 className="font-extrabold text-2xl text-gray-900 leading-tight tracking-tight mb-2">Bạn là ai?</h2>
                  <p className="text-sm text-gray-500 font-medium">Vui lòng chọn tư cách đăng nhập</p>
                </header>

                <div className="space-y-4">
                  <button 
                    onClick={() => handleSelectRole('CUSTOMER')}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-gray-100 hover:border-[#2b3896] hover:bg-[#2b3896]/5 transition-all group bg-white"
                  >
                    <div className="w-12 h-12 bg-blue-50 text-[#2b3896] rounded-xl flex items-center justify-center group-hover:bg-[#2b3896] group-hover:text-white transition-colors">
                      <User size={24} />
                    </div>
                    <div className="text-left">
                      <h3 className="font-bold text-gray-900 text-lg">Khách hàng</h3>
                      <p className="text-xs text-gray-500 font-medium">Mua sắm & Theo dõi đơn hàng</p>
                    </div>
                  </button>

                  <button 
                    onClick={() => handleSelectRole('SELLER')}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-gray-100 hover:border-orange-500 hover:bg-orange-50 transition-all group bg-white"
                  >
                    <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-colors">
                      <Store size={24} />
                    </div>
                    <div className="text-left">
                      <h3 className="font-bold text-gray-900 text-lg">Người bán hàng</h3>
                      <p className="text-xs text-gray-500 font-medium">Quản lý gian hàng & Sản phẩm</p>
                    </div>
                  </button>

                  <button 
                    onClick={() => handleSelectRole('ADMIN')}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-gray-100 hover:border-emerald-500 hover:bg-emerald-50 transition-all group bg-white"
                  >
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                      <ShieldAlert size={24} />
                    </div>
                    <div className="text-left">
                      <h3 className="font-bold text-gray-900 text-lg">Quản trị viên</h3>
                      <p className="text-xs text-gray-500 font-medium">Truy cập hệ thống quản lý</p>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* BƯỚC 2: MÀN HÌNH ĐIỀN FORM ĐĂNG NHẬP */}
            {step === 2 && (
              <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                <header className="mb-6 relative flex items-center justify-center">
                  <button 
                    onClick={() => setStep(1)}
                    className="absolute left-0 p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
                    title="Quay lại chọn vai trò"
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <div className="text-center">
                    <h2 className="font-extrabold text-2xl text-gray-900 leading-tight tracking-tight">Đăng Nhập</h2>
                    <p className="text-xs font-bold text-[#2b3896] uppercase tracking-widest mt-1">
                      Dành cho {role === 'SELLER' ? 'Người Bán' : role === 'ADMIN' ? 'Quản Trị Viên' : 'Khách Hàng'}
                    </p>
                  </div>
                </header>

                {errorMsg && (
                  <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl font-medium text-center">
                    {errorMsg}
                  </div>
                )}

                <form className="space-y-6" onSubmit={handleSubmit}>
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">
                      Địa chỉ Email
                    </label>
                    <div className="relative">
                      <input 
                        name="email" type="email" required
                        value={formData.email} onChange={handleChange}
                        placeholder="name@example.com" 
                        className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:border-[#2b3896] focus:ring-2 focus:ring-[#2b3896]/20 transition-all outline-none text-sm font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center px-1">
                      <label className="block text-xs font-bold uppercase tracking-widest text-gray-500">
                        Mật khẩu
                      </label>
                    </div>
                    <div className="relative">
                      <input 
                        name="password" type={showPassword ? "text" : "password"} required
                        value={formData.password} onChange={handleChange}
                        placeholder="••••••••" 
                        className="w-full px-4 py-4 pr-12 bg-gray-50 border border-gray-200 rounded-xl focus:border-[#2b3896] focus:ring-2 focus:ring-[#2b3896]/20 transition-all placeholder-gray-400 outline-none text-sm font-medium"
                      />
                      <button 
                        type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#2b3896] transition-colors"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  <button 
                    type="submit" disabled={loading}
                    className={`w-full mt-8 py-4 rounded-full text-white font-bold text-sm tracking-widest uppercase shadow-lg transition-all 
                      ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-br from-[#2b3896] to-[#4551af] shadow-[#2b3896]/20 hover:scale-[1.02] active:scale-95'}`}
                  >
                    {loading ? 'Đang xử lý...' : 'Đăng nhập'}
                  </button>

                  {(role === 'CUSTOMER' || role === 'SELLER') && (
                    <p className="text-center mt-6 text-sm text-gray-500 font-medium">
                      Bạn chưa có tài khoản?{' '}
                      <Link to="/register" className="text-[#2b3896] hover:underline font-bold transition-all">
                        Đăng Ký
                      </Link>
                    </p>
                  )}
                </form>
              </div>
            )}
            
          </div>
        </div>
      </main>
      
      <footer className="w-full py-6 text-center border-t border-gray-200 bg-white/50 backdrop-blur-sm relative z-10">
        <p className="text-xs text-gray-500 tracking-widest uppercase font-bold">© 2026 Đồ án E-Commerce. Nhóm 31.</p>
      </footer>
    </div>
  );
};

export default Login;