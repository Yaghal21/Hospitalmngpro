import apiClient from './apiClient';

export const patientApi = {
  getMyProfile: async () => {
    const response = await apiClient.get('/patients/me');
    return response.data;
  },

  updateMyProfile: async (data) => {
    const response = await apiClient.patch('/patients/me', data);
    return response.data;
  },

  getAllPatients: async (params) => {
    const response = await apiClient.get('/patients', { params });
    return response.data;
  },

  getPatientById: async (id) => {
    const response = await apiClient.get(`/patients/${id}`);
    return response.data;
  },
};
