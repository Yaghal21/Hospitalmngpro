const express = require('express');
const router = express.Router();
const {
  createAppointment,
  getMyAppointments,
  getAllAppointments,
  getDoctorAppointments,
  getAppointmentById,
  updateAppointmentStatus,
  updateAppointmentNotes
} = require('../controllers/appointmentController');
const { authenticate, authorize } = require('../middleware/auth');

// Patient booking
router.post('/', authenticate, authorize('patient'), createAppointment);
router.get('/me', authenticate, authorize('patient'), getMyAppointments);

// Doctor appointments
router.get('/doctor', authenticate, authorize('doctor'), getDoctorAppointments);

// Admin listing
router.get('/', authenticate, authorize('admin'), getAllAppointments);

// Individual appointment access
router.get('/:id', authenticate, getAppointmentById);
router.patch('/:id/status', authenticate, updateAppointmentStatus);
router.patch('/:id/notes', authenticate, authorize('doctor'), updateAppointmentNotes);

module.exports = router;
