const { z } = require('zod');

/**
 * Bill creation validation schema (admin only)
 */
const createBillSchema = z.object({
  appointment_id: z.string().uuid('Invalid appointment ID'),
  consultation_charge: z.number().positive('Consultation charge must be positive'),
  additional_charges: z.number().min(0, 'Additional charges cannot be negative').default(0),
  discount: z.number().min(0, 'Discount cannot be negative').default(0)
});

/**
 * Bill payment update validation schema (admin only)
 */
const updatePaymentSchema = z.object({
  payment_status: z.enum(['Pending', 'Paid'], {
    required_error: 'Payment status is required'
  }),
  payment_method: z.enum(['Cash', 'Card', 'UPI', 'Other']).optional()
});

module.exports = {
  createBillSchema,
  updatePaymentSchema
};
