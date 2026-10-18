const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getRecentAppointments,
  getRevenueStats,
  getDoctorSummary
} = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');

// All admin routes require admin role
router.get('/dashboard/stats', authenticate, authorize('admin'), getDashboardStats);
router.get('/dashboard/recent-appointments', authenticate, authorize('admin'), getRecentAppointments);
router.get('/dashboard/revenue', authenticate, authorize('admin'), getRevenueStats);
router.get('/dashboard/doctor-summary', authenticate, authorize('admin'), getDoctorSummary);

module.exports = router;
