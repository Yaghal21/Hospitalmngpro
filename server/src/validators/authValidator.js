const { z } = require('zod');

const emailSchema = z.preprocess(
  val => (typeof val === 'string' ? val.trim().toLowerCase() : val),
  z.string().email('Invalid email address')
);

/**
 * Registration validation schema
 */
const registerSchema = z.object({
  email: emailSchema,
  password: z.string().min(6, 'Password must be at least 6 characters'),
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  phone: z.string().min(10, 'Phone number must be at least 10 characters').optional(),
  date_of_birth: z.string().refine(val => !isNaN(Date.parse(val)), 'Invalid date of birth'),
  gender: z.enum(['Male', 'Female', 'Other'], { required_error: 'Gender is required' }),
  address: z.string().optional(),
  blood_group: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional()
});

/**
 * Login validation schema
 */
const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required')
});

module.exports = {
  registerSchema,
  loginSchema
};
