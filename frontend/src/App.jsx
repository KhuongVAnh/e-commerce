import { BrowserRouter, Routes, Route } from 'react-router-dom';
import CustomerLayout from './layouts/CustomerLayout';
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';

import AdminDashboard from './pages/admin/AdminDashboard';
import SellerDashboard from './pages/seller/SellerDashboard';
import ShopForm from './pages/seller/ShopForm';

// Import giao diện Seller Products
import SellerProductList from './pages/seller/ProductList';
import SellerProductForm from './pages/seller/ProductForm';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Home from './pages/customer/Home';
import ProductList from './pages/customer/ProductList';
import ProductDetail from './pages/customer/ProductDetail';

const Cart = () => <div className="p-8 bg-white rounded-lg shadow min-h-[400px]">Đây là Trang Giỏ Hàng</div>;
const Unauthorized = () => <div className="p-10 text-center text-red-500 font-bold text-2xl">403 - Bạn không có quyền truy cập!</div>;
const NotFound = () => <div className="p-10 text-center text-gray-700 font-bold text-2xl">404 - Trang không tồn tại</div>;

// Component tạm cho trang Orders của Seller
const PlaceholderOrders = () => <div className="p-10 text-center text-slate-400 font-bold">Giao diện Quản lý Đơn hàng (Đang phát triển)</div>;

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
            
            {/* Cài đặt Shop */}
            <Route path="shop/settings" element={<ShopForm />} />
            
            {/* Quản lý Sản Phẩm*/}
            <Route path="products" element={<SellerProductList />} />
            <Route path="products/new" element={<SellerProductForm />} />
            <Route path="products/:id/edit" element={<SellerProductForm />} />
            
            {/* Quản lý Đơn hàng */}
            <Route path="orders" element={<PlaceholderOrders />} />
          </Route>
        </Route>

        {/* --- CATCH-ALL: 404 --- */}
        <Route path="*" element={<NotFound />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;