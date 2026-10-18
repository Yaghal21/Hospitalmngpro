import apiClient from './apiClient';

export const doctorApi = {
  getAllDoctors: async (params) => {
    const response = await apiClient.get('/doctors', { params });
    return response.data;
  },

  getDoctorById: async (id) => {
    const response = await apiClient.get(`/doctors/${id}`);
    return response.data;
  },

  createDoctor: async (data) => {
    const response = await apiClient.post('/doctors', data);
    return response.data;
  },

  updateDoctor: async (id, data) => {
    const response = await apiClient.patch(`/doctors/${id}`, data);
    return response.data;
  },

  deleteDoctor: async (id) => {
    const response = await apiClient.delete(`/doctors/${id}`);
    return response.data;
  },

  getSpecializations: async () => {
    const response = await apiClient.get('/doctors/specializations');
    return response.data;
  },

  provisionDoctorAccount: async (id, data) => {
    const response = await apiClient.post(`/doctors/${id}/provision`, data);
    return response.data;
  },
};
