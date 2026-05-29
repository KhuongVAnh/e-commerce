import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import CustomerLayout from './layouts/CustomerLayout';
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';

import AdminDashboard from './pages/admin/AdminDashboard';
// Thêm các trang quản lý của Admin
import UserManagement from './pages/admin/UserManagement';
import ShopManagement from './pages/admin/ShopManagement';
import CategoryManagement from './pages/admin/CategoryManagement';
import ProductManagement from './pages/admin/ProductManagement';
import OrderManagement from './pages/admin/OrderManagement';

import SellerDashboard from './pages/seller/SellerDashboard';
import ShopForm from './pages/seller/ShopForm';

// Import giao diện Seller Products
import SellerProductList from './pages/seller/ProductList';
import SellerProductForm from './pages/seller/ProductForm';

// Thêm các trang quản lý Seller Orders
import SellerOrderList from './pages/seller/OrderList';
import SellerOrderDetail from './pages/seller/OrderDetail';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Home from './pages/customer/Home';
import ProductList from './pages/customer/ProductList';
import ProductDetail from './pages/customer/ProductDetail';
import Cart from './pages/customer/Cart';
import Checkout from './pages/customer/Checkout';
import OrderList from './pages/customer/OrderList';
import OrderDetail from './pages/customer/OrderDetail';
import PaymentResult from './pages/customer/PaymentResult';
import Categories from './pages/customer/Categories';
import ShopList from './pages/customer/ShopList';
import ShopDetail from './pages/customer/ShopDetail';

const Unauthorized = () => <div className="p-10 text-center text-red-500 font-bold text-2xl">403 - Bạn không có quyền truy cập!</div>;
const NotFound = () => <div className="p-10 text-center text-gray-700 font-bold text-2xl">404 - Trang không tồn tại</div>;

function App() {
  return (
    <BrowserRouter>
      <Toaster 
        position="top-right" 
        toastOptions={{
          duration: 3000,
          style: { borderRadius: '12px', fontWeight: 'bold', fontSize: '14px' },
        }} 
      />
      <Routes>
        
        {/* --- TRANG ĐĂNG NHẬP / ĐĂNG KÝ --- */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* --- DÀNH CHO KHÁCH --- */}
        <Route path="/" element={<CustomerLayout />}>
          <Route index element={<Home />} />
          <Route path="unauthorized" element={<Unauthorized />} />
          <Route path="products" element={<ProductList />} />
          <Route path="product/:slug" element={<ProductDetail />} />
          <Route path="categories" element={<Categories />} />
          <Route path="shop" element={<ShopList />} />
          <Route path="shop/:slug" element={<ShopDetail />} />
          <Route element={<ProtectedRoute />}>
            <Route path="cart" element={<Cart />} />
            <Route path="checkout" element={<Checkout />} />
            <Route path="orders" element={<OrderList />} />
            <Route path="orders/:id" element={<OrderDetail />} />
            <Route path="payment-return" element={<PaymentResult />} />
          </Route>
        </Route>

        {/* --- DÀNH CHO ADMIN --- */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/admin" element={<DashboardLayout roleTitle="Admin" />}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="shops" element={<ShopManagement />} />
            <Route path="categories" element={<CategoryManagement />} />
            <Route path="products" element={<ProductManagement />} />
            <Route path="orders" element={<OrderManagement />} />
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
            <Route path="orders" element={<SellerOrderList />} />
            <Route path="orders/:id" element={<SellerOrderDetail />} />
          </Route>
        </Route>

        {/* --- CATCH-ALL: 404 --- */}
        <Route path="*" element={<NotFound />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;