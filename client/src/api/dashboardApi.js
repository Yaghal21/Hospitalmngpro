import apiClient from './apiClient';

export const dashboardApi = {
  getStats: async () => {
    const response = await apiClient.get('/admin/dashboard/stats');
    return response.data;
  },

  getRecentAppointments: async (limit = 10) => {
    const response = await apiClient.get('/admin/dashboard/recent-appointments', {
      params: { limit }
    });
    return response.data;
  },

  getRevenue: async (startDate, endDate) => {
    const response = await apiClient.get('/admin/dashboard/revenue', {
      params: { start_date: startDate, end_date: endDate }
    });
    return response.data;
  },

  getDoctorSummary: async () => {
    const response = await apiClient.get('/admin/dashboard/doctor-summary');
    return response.data;
  },
};
