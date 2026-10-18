const express = require('express');
const router = express.Router();
const {
  getMyProfile,
  updateMyProfile,
  getAllPatients,
  getPatientById
} = require('../controllers/patientController');
const { authenticate, authorize } = require('../middleware/auth');

// Patient access to own profile
router.get('/me', authenticate, getMyProfile);
router.patch('/me', authenticate, updateMyProfile);

// Admin only
router.get('/', authenticate, authorize('admin'), getAllPatients);
router.get('/:id', authenticate, getPatientById);

module.exports = router;
