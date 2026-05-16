import axiosClient from '../utils/axiosClient'; 

export const orderService = {
  getMyOrders: (params) => {
    return axiosClient.get('http://localhost:3000/api/commerce/orders/my', { params });
  },
  getOrderDetail: (id) => {
    return axiosClient.get(`http://localhost:3000/api/commerce/orders/${id}`);
  },
  cancelOrder: (orderCode) => {
    return axiosClient.patch(`http://localhost:3000/api/commerce/orders/${orderCode}/cancel`);
  }
};