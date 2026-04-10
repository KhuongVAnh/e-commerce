import { BrowserRouter, Routes, Route } from 'react-router-dom';
import CustomerLayout from './layouts/CustomerLayout';

// Các trang mẫu để test (sau này FE1 sẽ code các trang này ra file riêng)
const Home = () => <div className="p-8 bg-white rounded-lg shadow min-h-[400px]">Đây là Trang Chủ sản phẩm</div>;
const Cart = () => <div className="p-8 bg-white rounded-lg shadow min-h-[400px]">Đây là Trang Giỏ Hàng</div>;
const NotFound = () => <div className="p-4 text-2xl font-bold text-red-500">404 - Trang không tồn tại</div>;

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Đưa CustomerLayout xịn vào đây */}
        <Route path="/" element={<CustomerLayout />}>
          <Route index element={<Home />} />
          <Route path="cart" element={<Cart />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;