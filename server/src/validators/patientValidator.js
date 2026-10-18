const { z } = require('zod');

/**
 * Patient profile update validation schema
 */
const updatePatientSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters').optional(),
  phone: z.string().min(10, 'Phone number must be at least 10 characters').optional(),
  date_of_birth: z.string().refine(val => !isNaN(Date.parse(val)), 'Invalid date of birth').optional(),
  gender: z.enum(['Male', 'Female', 'Other']).optional(),
  address: z.string().optional(),
  blood_group: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional()
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update'
});

module.exports = {
  updatePatientSchema
};
