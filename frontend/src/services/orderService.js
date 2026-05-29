import axiosClient from '../utils/axiosClient'; 

export const orderService = {
  getMyOrders: (params) => {
    return axiosClient.get('/commerce/orders/my', { params });
  },
  getOrderDetail: (id) => {
    return axiosClient.get(`/commerce/orders/${id}`);
  },
  getPaymentUrl: (orderCode) => {
    return axiosClient.get(`/commerce/orders/${orderCode}/payment-url`);
  },
  cancelOrder: (orderCode) => {
    return axiosClient.post(`/commerce/orders/${orderCode}/cancel`);
  }
};
