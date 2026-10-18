const { supabaseAdmin } = require('../config/supabase');
const { createAppointmentSchema, updateStatusSchema, updateNotesSchema } = require('../validators/appointmentValidator');

/**
 * Create appointment (patient only)
 */
const createAppointment = async (req, res, next) => {
  try {
    const validatedData = createAppointmentSchema.parse(req.body);
    const { doctor_id, appointment_date, appointment_time, reason } = validatedData;

    // Verify the authenticated user has a patient record
    const { data: patient, error: patientError } = await supabaseAdmin
      .from('patients')
      .select('id')
      .eq('id', req.user.id)
      .single();

    if (patientError || !patient) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
        errors: ['No patient record found for this user. Please complete your patient profile first.']
      });
    }

    // Verify doctor exists and is available
    const { data: doctor, error: doctorError } = await supabaseAdmin
      .from('doctors')
      .select('*')
      .eq('id', doctor_id)
      .single();

    if (doctorError || !doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found',
        errors: ['Doctor with this ID does not exist']
      });
    }

    if (!doctor.is_available) {
      return res.status(400).json({
        success: false,
        message: 'Doctor not available',
        errors: ['This doctor is currently not accepting appointments']
      });
    }

    // Check if doctor is available on the appointment day (use UTC noon to avoid timezone shift)
    const appointmentDay = new Date(appointment_date + 'T12:00:00Z').toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' });
    if (doctor.available_days && !doctor.available_days.includes(appointmentDay)) {
      return res.status(400).json({
        success: false,
        message: 'Doctor not available on this day',
        errors: [`Doctor is not available on ${appointmentDay}. Available days: ${doctor.available_days.join(', ')}`]
      });
    }

    // Generate appointment code
    const appointmentCode = `APT${Date.now().toString().slice(-6)}`;

    // Create appointment using server-derived patient_id (never trust browser)
    const { data: appointment, error } = await supabaseAdmin
      .from('appointments')
      .insert({
        appointment_code: appointmentCode,
        patient_id: req.user.id,
        doctor_id,
        appointment_date,
        appointment_time,
        status: 'Booked',
        reason
      })
      .select(`
        *,
        doctors:doctor_id (
          id,
          full_name,
          specialization
        )
      `)
      .single();

    if (error) {
      // Handle unique constraint violation (double booking)
      if (error.code === '23505') {
        return res.status(409).json({
          success: false,
          message: 'Time slot already booked',
          errors: ['This doctor is already booked at this date and time']
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Failed to create appointment',
        errors: [error.message]
      });
    }

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      data: appointment
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      const issues = error.errors || error.issues || [];
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: issues.map(e => e.message)
      });
    }
    next(error);
  }
};

/**
 * Get current patient's appointments
 */
const getMyAppointments = async (req, res, next) => {
  try {
    const { status } = req.query;

    let query = supabaseAdmin
      .from('appointments')
      .select(`
        *,
        doctors:doctor_id (
          id,
          full_name,
          specialization,
          phone
        )
      `)
      .eq('patient_id', req.user.id)
      .order('appointment_date', { ascending: false })
      .order('appointment_time', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: appointments, error } = await query;

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch appointments',
        errors: [error.message]
      });
    }

    res.status(200).json({
      success: true,
      message: 'Appointments retrieved successfully',
      data: appointments
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all appointments (admin only)
 */
const getAllAppointments = async (req, res, next) => {
  try {
    const { status, doctor_id, patient_id, page = 1, limit = 10 } = req.query;

    let query = supabaseAdmin
      .from('appointments')
      .select(`
        *,
        doctors!inner (
          id,
          full_name,
          specialization
        ),
        patients!inner (
          id,
          patient_code,
          profiles:profile_id (
            full_name,
            phone
          )
        )
      `, { count: 'exact' })
      .order('appointment_date', { ascending: false })
      .order('appointment_time', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }
    if (doctor_id) {
      query = query.eq('doctor_id', doctor_id);
    }
    if (patient_id) {
      query = query.eq('patient_id', patient_id);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: appointments, error, count } = await query;

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch appointments',
        errors: [error.message]
      });
    }

    res.status(200).json({
      success: true,
      message: 'Appointments retrieved successfully',
      data: {
        appointments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count || 0,
          pages: Math.ceil((count || 0) / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get doctor's appointments (doctor only)
 */
const getDoctorAppointments = async (req, res, next) => {
  try {
    const { status } = req.query;

    // Resolve doctor record from the authenticated user's profile_id
    // This is the correct way: doctors.profile_id = auth user UUID
    const { data: doctor, error: doctorError } = await supabaseAdmin
      .from('doctors')
      .select('id')
      .eq('profile_id', req.user.id)
      .single();

    if (doctorError || !doctor) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
        errors: ['No doctor record found for this user. Contact admin to link your account.']
      });
    }

    // Use doctor.id (the actual doctor record ID) for the appointment lookup
    let query = supabaseAdmin
      .from('appointments')
      .select(`
        *,
        patients!inner (
          id,
          patient_code,
          profiles:profile_id (
            full_name,
            phone
          )
        ),
        doctors:doctor_id (
          id,
          full_name,
          specialization
        )
      `)
      .eq('doctor_id', doctor.id)
      .order('appointment_date', { ascending: false })
      .order('appointment_time', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: appointments, error } = await query;

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch appointments',
        errors: [error.message]
      });
    }

    res.status(200).json({
      success: true,
      message: 'Appointments retrieved successfully',
      data: appointments
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get appointment by ID (authorized access only)
 */
const getAppointmentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: appointment, error } = await supabaseAdmin
      .from('appointments')
      .select(`
        *,
        doctors:doctor_id (
          id,
          full_name,
          specialization,
          phone
        ),
        patients:patient_id (
          id,
          patient_code,
          profiles:profile_id (
            full_name,
            phone
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error || !appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
        errors: ['Appointment with this ID does not exist']
      });
    }

    // Check authorization
    const role = req.user.role || req.user.profile?.role;
    const isAdmin = role === 'admin';
    const isPatient = req.user.id === appointment.patient_id;
    
    let isDoctor = false;
    if (role === 'doctor') {
      const { data: doctorRecord } = await supabaseAdmin
        .from('doctors')
        .select('id')
        .eq('profile_id', req.user.id)
        .single();
      isDoctor = Boolean(doctorRecord && doctorRecord.id === appointment.doctor_id);
    }

    if (!isAdmin && !isPatient && !isDoctor) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
        errors: ['You are not authorized to view this appointment']
      });
    }

    res.status(200).json({
      success: true,
      message: 'Appointment retrieved successfully',
      data: appointment
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update appointment status (authorized)
 */
const updateAppointmentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const validatedData = updateStatusSchema.parse(req.body);
    const { status } = validatedData;

    // Get appointment
    const { data: appointment, error: fetchError } = await supabaseAdmin
      .from('appointments')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
        errors: ['Appointment with this ID does not exist']
      });
    }

    // Check authorization
    const role = req.user.role || req.user.profile?.role;
    const isAdmin = role === 'admin';
    const isPatient = req.user.id === appointment.patient_id;
    
    let isDoctor = false;
    if (role === 'doctor') {
      const { data: doctorRecord } = await supabaseAdmin
        .from('doctors')
        .select('id')
        .eq('profile_id', req.user.id)
        .single();
      isDoctor = Boolean(doctorRecord && doctorRecord.id === appointment.doctor_id);
    }

    // Patients can only cancel their own appointments
    if (isPatient && status !== 'Cancelled') {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
        errors: ['Patients can only cancel appointments']
      });
    }

    // Doctors can only complete or cancel their own appointments
    if (isDoctor && !['Completed', 'Cancelled'].includes(status)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
        errors: ['Doctors can only complete or cancel appointments']
      });
    }

    if (!isAdmin && !isPatient && !isDoctor) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
        errors: ['You are not authorized to update this appointment']
      });
    }

    // Update status
    const { data: updatedAppointment, error: updateError } = await supabaseAdmin
      .from('appointments')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return res.status(500).json({
        success: false,
        message: 'Failed to update appointment',
        errors: [updateError.message]
      });
    }

    res.status(200).json({
      success: true,
      message: 'Appointment status updated successfully',
      data: updatedAppointment
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      const issues = error.errors || error.issues || [];
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: issues.map(e => e.message)
      });
    }
    next(error);
  }
};

/**
 * Update appointment notes (assigned doctor only)
 */
const updateAppointmentNotes = async (req, res, next) => {
  try {
    const { id } = req.params;
    const validatedData = updateNotesSchema.parse(req.body);
    const { doctor_notes } = validatedData;

    // Get appointment
    const { data: appointment, error: fetchError } = await supabaseAdmin
      .from('appointments')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
        errors: ['Appointment with this ID does not exist']
      });
    }

    // Resolve authenticated doctor record
    const { data: doctorRecord, error: doctorError } = await supabaseAdmin
      .from('doctors')
      .select('id')
      .eq('profile_id', req.user.id)
      .single();

    if (doctorError || !doctorRecord || doctorRecord.id !== appointment.doctor_id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
        errors: ['Only the assigned doctor can update notes']
      });
    }

    // Update notes
    const { data: updatedAppointment, error: updateError } = await supabaseAdmin
      .from('appointments')
      .update({ doctor_notes })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return res.status(500).json({
        success: false,
        message: 'Failed to update appointment notes',
        errors: [updateError.message]
      });
    }

    res.status(200).json({
      success: true,
      message: 'Appointment notes updated successfully',
      data: updatedAppointment
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      const issues = error.errors || error.issues || [];
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: issues.map(e => e.message)
      });
    }
    next(error);
  }
};

module.exports = {
  createAppointment,
  getMyAppointments,
  getAllAppointments,
  getDoctorAppointments,
  getAppointmentById,
  updateAppointmentStatus,
  updateAppointmentNotes
};
