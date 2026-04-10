import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

// -- CÁC COMPONENT TẠM THỜI ĐỂ TEST ROUTER --
const CustomerLayout = () => (
  <div className="p-4 bg-blue-50 min-h-screen">
    <nav className="mb-4 flex gap-4 border-b pb-2">
      <Link to="/" className="text-blue-600 font-bold hover:underline">Trang chủ</Link>
      <Link to="/cart" className="text-blue-600 font-bold hover:underline">Giỏ hàng</Link>
      <Link to="/admin" className="text-red-600 font-bold hover:underline">Vào trang Admin</Link>
    </nav>
    <h1 className="text-2xl mb-4">Giao diện Khách hàng</h1>
  </div>
);

const Cart = () => <div className="text-lg">Đây là trang Giỏ hàng của Customer</div>;

const AdminLayout = () => (
  <div className="p-4 bg-slate-800 text-white min-h-screen">
    <h1 className="text-2xl mb-4 text-red-400">Giao diện Quản trị Admin/Seller</h1>
    <Link to="/" className="text-blue-300 hover:underline">Quay lại trang khách</Link>
  </div>
);

const NotFound = () => <div className="p-4 text-2xl font-bold text-red-500">404 - Trang không tồn tại</div>;

// -- CẤU HÌNH ROUTER CHÍNH --
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Route Khách hàng */}
        <Route path="/" element={<CustomerLayout />}>
          {/* Outlet: Các trang con sẽ nằm ở đây */}
          <Route path="cart" element={<Cart />} />
        </Route>

        {/* Route Admin & Seller */}
        <Route path="/admin" element={<AdminLayout />}>
          {/* Thêm các route admin vào đây sau */}
        </Route>

        {/* Bắt lỗi đường dẫn không tồn tại */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;