const { z } = require('zod');

/**
 * Appointment creation validation schema
 */
const createAppointmentSchema = z.object({
  doctor_id: z.string().uuid('Invalid doctor ID'),
  appointment_date: z.string().refine(val => !isNaN(Date.parse(val)), 'Invalid appointment date'),
  appointment_time: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  reason: z.string().min(5, 'Reason must be at least 5 characters')
}).refine(data => {
  const appointmentDate = new Date(data.appointment_date);
  const now = new Date();
  return appointmentDate >= now.setHours(0, 0, 0, 0);
}, {
  message: 'Appointment date cannot be in the past'
});

/**
 * Appointment status update validation schema
 */
const updateStatusSchema = z.object({
  status: z.enum(['Booked', 'Completed', 'Cancelled'], {
    required_error: 'Status is required'
  })
});

/**
 * Appointment notes update validation schema (doctor only)
 */
const updateNotesSchema = z.object({
  doctor_notes: z.string().min(1, 'Doctor notes are required')
});

module.exports = {
  createAppointmentSchema,
  updateStatusSchema,
  updateNotesSchema
};
