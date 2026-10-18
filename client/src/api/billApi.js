import apiClient from './apiClient';

export const billApi = {
  getMyBills: async (params) => {
    const response = await apiClient.get('/bills/me', { params });
    return response.data;
  },

  getAllBills: async (params) => {
    const response = await apiClient.get('/bills', { params });
    return response.data;
  },

  getBillById: async (id) => {
    const response = await apiClient.get(`/bills/${id}`);
    return response.data;
  },

  createBill: async (data) => {
    const response = await apiClient.post('/bills', data);
    return response.data;
  },

  updatePayment: async (id, data) => {
    const response = await apiClient.patch(`/bills/${id}/payment`, data);
    return response.data;
  },
};
