import apiClient from './apiClient';

export const appointmentApi = {
  createAppointment: async (data) => {
    const response = await apiClient.post('/appointments', data);
    return response.data;
  },

  getMyAppointments: async (params) => {
    const response = await apiClient.get('/appointments/me', { params });
    return response.data;
  },

  getDoctorAppointments: async (params) => {
    const response = await apiClient.get('/appointments/doctor', { params });
    return response.data;
  },

  getAllAppointments: async (params) => {
    const response = await apiClient.get('/appointments', { params });
    return response.data;
  },

  getAppointmentById: async (id) => {
    const response = await apiClient.get(`/appointments/${id}`);
    return response.data;
  },

  updateStatus: async (id, data) => {
    const response = await apiClient.patch(`/appointments/${id}/status`, data);
    return response.data;
  },

  updateNotes: async (id, data) => {
    const response = await apiClient.patch(`/appointments/${id}/notes`, data);
    return response.data;
  },
};
