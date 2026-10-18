const express = require('express');
const router = express.Router();
const {
  getAllDoctors,
  getDoctorById,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  getSpecializations,
  provisionDoctorAccount
} = require('../controllers/doctorController');
const { authenticate, authorize } = require('../middleware/auth');

// Public access for doctor directory
router.get('/', getAllDoctors);
router.get('/specializations', getSpecializations);
router.get('/:id', getDoctorById);

// Admin only
router.post('/', authenticate, authorize('admin'), createDoctor);
router.post('/:id/provision', authenticate, authorize('admin'), provisionDoctorAccount);
router.patch('/:id', authenticate, authorize('admin'), updateDoctor);
router.delete('/:id', authenticate, authorize('admin'), deleteDoctor);

module.exports = router;
