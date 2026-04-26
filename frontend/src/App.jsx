import { BrowserRouter, Routes, Route } from 'react-router-dom';
import CustomerLayout from './layouts/CustomerLayout';
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';

import AdminDashboard from './pages/admin/AdminDashboard';
import SellerDashboard from './pages/seller/SellerDashboard';
import ShopForm from './pages/seller/ShopForm';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Home from './pages/customer/Home';
import ProductList from './pages/customer/ProductList';
import ProductDetail from './pages/customer/ProductDetail';

const Cart = () => <div className="p-8 bg-white rounded-lg shadow min-h-[400px]">Đây là Trang Giỏ Hàng</div>;
const Unauthorized = () => <div className="p-10 text-center text-red-500 font-bold text-2xl">403 - Bạn không có quyền truy cập!</div>;
const NotFound = () => <div className="p-10 text-center text-gray-700 font-bold text-2xl">404 - Trang không tồn tại</div>;

function App() {
  return (
    <BrowserRouter>
      <Routes>
        
        {/* --- TRANG ĐĂNG NHẬP / ĐĂNG KÝ --- */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* --- DÀNH CHO KHÁCH (AI CŨNG VÀO ĐƯỢC) --- */}
        <Route path="/" element={<CustomerLayout />}>
          <Route index element={<Home />} />
          <Route path="cart" element={<Cart />} />
          <Route path="unauthorized" element={<Unauthorized />} />
          <Route path="products" element={<ProductList />} />
          <Route path="product/:id" element={<ProductDetail />} />
        </Route>

        {/* --- DÀNH CHO ADMIN --- */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/admin" element={<DashboardLayout roleTitle="Admin" />}>
            <Route index element={<AdminDashboard />} />
          </Route>
        </Route>

        {/* --- DÀNH CHO SELLER --- */}
        <Route element={<ProtectedRoute allowedRoles={['seller', 'admin']} />}>
          <Route path="/seller" element={<DashboardLayout roleTitle="Seller" />}>
            <Route index element={<SellerDashboard />} />
            
            {/* /shop/settings sẽ mở Form  */}
            <Route path="shop/settings" element={<ShopForm />} />
          </Route>
        </Route>

        {/* --- CATCH-ALL: 404 --- */}
        <Route path="*" element={<NotFound />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;