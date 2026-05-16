import axiosClient from '../utils/axiosClient'; 

export const orderService = {
  getMyOrders: (params) => {
    return axiosClient.get('/commerce/orders/my', { params });
  },
  getOrderDetail: (id) => {
    return axiosClient.get(`/commerce/orders/${id}`);
  },
  cancelOrder: (orderCode) => {
    return axiosClient.post(`http://localhost:3000/api/commerce/orders/${orderCode}/cancel`);
  }
};