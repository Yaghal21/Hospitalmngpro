const express = require('express');
const router = express.Router();
const {
  getMyBills,
  getAllBills,
  getBillById,
  createBill,
  updateBillPayment
} = require('../controllers/billController');
const { authenticate, authorize } = require('../middleware/auth');

// Patient access to own bills
router.get('/me', authenticate, authorize('patient'), getMyBills);

// Admin operations
router.get('/', authenticate, authorize('admin'), getAllBills);
router.post('/', authenticate, authorize('admin'), createBill);
router.patch('/:id/payment', authenticate, authorize('admin'), updateBillPayment);

// Individual bill access (admin or patient)
router.get('/:id', authenticate, getBillById);

module.exports = router;
