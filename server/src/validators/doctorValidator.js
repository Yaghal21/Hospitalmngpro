const { z } = require('zod');

/**
 * Doctor creation validation schema (admin only)
 */
const createDoctorSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  specialization: z.string().min(2, 'Specialization is required'),
  qualification: z.string().min(2, 'Qualification is required'),
  experience_years: z.number().int().min(0).max(70, 'Experience must be between 0 and 70 years'),
  phone: z.string().min(10, 'Phone number must be at least 10 characters'),
  consultation_fee: z.number().positive('Consultation fee must be positive'),
  available_days: z.array(z.string()).min(1, 'At least one available day is required'),
  is_available: z.boolean().optional().default(true)
});

/**
 * Doctor update validation schema (admin only)
 */
const updateDoctorSchema = z.object({
  full_name: z.string().min(2).optional(),
  specialization: z.string().min(2).optional(),
  qualification: z.string().min(2).optional(),
  experience_years: z.number().int().min(0).max(70).optional(),
  phone: z.string().min(10).optional(),
  email: z.string().email().optional(),
  consultation_fee: z.number().positive().optional(),
  available_days: z.array(z.string()).optional(),
  is_available: z.boolean().optional()
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update'
});

module.exports = {
  createDoctorSchema,
  updateDoctorSchema
};
