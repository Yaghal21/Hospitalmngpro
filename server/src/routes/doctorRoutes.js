const express = require('express');
const router = express.Router();
const {
  getAllDoctors,
  getDoctorById,
  createDoctor,
  updateDoctor,
  deleteDoctor
} = require('../controllers/doctorController');
const { authenticate, authorize } = require('../middleware/auth');

// Public access for doctor directory
router.get('/', getAllDoctors);
router.get('/:id', getDoctorById);

// Admin only
router.post('/', authenticate, authorize('admin'), createDoctor);
router.patch('/:id', authenticate, authorize('admin'), updateDoctor);
router.delete('/:id', authenticate, authorize('admin'), deleteDoctor);

module.exports = router;
