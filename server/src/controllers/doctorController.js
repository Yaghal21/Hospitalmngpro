const { supabase, supabaseAdmin } = require('../config/supabase');
const { createDoctorSchema, updateDoctorSchema, provisionDoctorAccountSchema } = require('../validators/doctorValidator');

/**
 * Get all doctors (public/authorized)
 * Supports search, filtering by availability, and pagination
 */
const getAllDoctors = async (req, res, next) => {
  try {
    const { search, specialization, is_available, page = 1, limit = 10 } = req.query;

    let query = supabaseAdmin
      .from('doctors')
      .select('*', { count: 'exact' });

    // Search by name
    if (search) {
      query = query.ilike('full_name', `%${search}%`);
    }

    // Filter by specialization
    if (specialization) {
      query = query.ilike('specialization', `%${specialization}%`);
    }

    // Filter by availability
    if (is_available !== undefined) {
      query = query.eq('is_available', is_available === 'true');
    }

    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: doctors, error, count } = await query;

    if (error) {
      console.error('[GET DOCTORS] Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch doctors',
        errors: [error.message]
      });
    }

    console.log('[GET DOCTORS] Found', doctors?.length || 0, 'doctors');

    res.status(200).json({
      success: true,
      message: 'Doctors retrieved successfully',
      data: {
        doctors,
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
 * Get doctor by ID
 */
const getDoctorById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: doctor, error } = await supabaseAdmin
      .from('doctors')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found',
        errors: ['Doctor with this ID does not exist']
      });
    }

    res.status(200).json({
      success: true,
      message: 'Doctor retrieved successfully',
      data: doctor
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new doctor (admin only)
 * Creates Supabase Auth user, profile, and doctor records
 */
const createDoctor = async (req, res, next) => {
  try {
    const validatedData = createDoctorSchema.parse(req.body);
    const { email, password, full_name, specialization, qualification, experience_years, phone, consultation_fee, available_days, is_available } = validatedData;

    // Create Supabase Auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (authError) {
      return res.status(400).json({
        success: false,
        message: 'Failed to create user',
        errors: [authError.message]
      });
    }

    const userId = authData.user.id;

    // Create profile record with doctor role
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: userId,
        full_name,
        role: 'doctor',
        phone
      });

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return res.status(500).json({
        success: false,
        message: 'Failed to create profile',
        errors: [profileError.message]
      });
    }

    // Generate doctor code
    const doctorCode = `DR${Date.now().toString().slice(-6)}`;

    // Create doctor record
    const { data: doctor, error: doctorError } = await supabaseAdmin
      .from('doctors')
      .insert({
        id: userId,
        doctor_code: doctorCode,
        profile_id: userId,
        full_name,
        specialization,
        qualification,
        experience_years,
        phone,
        email,
        consultation_fee,
        available_days,
        is_available: is_available !== undefined ? is_available : true
      })
      .select()
      .single();

    if (doctorError) {
      await supabaseAdmin.from('profiles').delete().eq('id', userId);
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return res.status(500).json({
        success: false,
        message: 'Failed to create doctor record',
        errors: [doctorError.message]
      });
    }

    res.status(201).json({
      success: true,
      message: 'Doctor created successfully',
      data: doctor
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
 * Update doctor (admin only)
 */
const updateDoctor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const validatedData = updateDoctorSchema.parse(req.body);

    // Check if doctor exists
    const { data: existingDoctor, error: checkError } = await supabaseAdmin
      .from('doctors')
      .select('*')
      .eq('id', id)
      .single();

    if (checkError || !existingDoctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found',
        errors: ['Doctor with this ID does not exist']
      });
    }

    // Update doctor record
    const { data: doctor, error } = await supabaseAdmin
      .from('doctors')
      .update(validatedData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to update doctor',
        errors: [error.message]
      });
    }

    // If updating full_name or phone, also update profile
    if (validatedData.full_name || validatedData.phone) {
      const profileUpdate = {};
      if (validatedData.full_name) profileUpdate.full_name = validatedData.full_name;
      if (validatedData.phone) profileUpdate.phone = validatedData.phone;

      await supabaseAdmin
        .from('profiles')
        .update(profileUpdate)
        .eq('id', existingDoctor.profile_id);
    }

    res.status(200).json({
      success: true,
      message: 'Doctor updated successfully',
      data: doctor
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
 * Delete doctor (admin only)
 * Only if no active appointments
 */
const deleteDoctor = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if doctor exists
    const { data: existingDoctor, error: checkError } = await supabaseAdmin
      .from('doctors')
      .select('*')
      .eq('id', id)
      .single();

    if (checkError || !existingDoctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found',
        errors: ['Doctor with this ID does not exist']
      });
    }

    // Check for active appointments
    const { data: appointments, error: appointmentError } = await supabaseAdmin
      .from('appointments')
      .select('id')
      .eq('doctor_id', id)
      .in('status', ['Booked']);

    if (appointmentError) {
      return res.status(500).json({
        success: false,
        message: 'Failed to check appointments',
        errors: [appointmentError.message]
      });
    }

    if (appointments && appointments.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete doctor',
        errors: ['Doctor has active appointments']
      });
    }

    // Delete doctor record
    const { error: deleteError } = await supabaseAdmin
      .from('doctors')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return res.status(500).json({
        success: false,
        message: 'Failed to delete doctor',
        errors: [deleteError.message]
      });
    }

    // Delete profile
    await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', existingDoctor.profile_id);

    // Delete auth user
    await supabaseAdmin.auth.admin.deleteUser(existingDoctor.profile_id);

    res.status(200).json({
      success: true,
      message: 'Doctor deleted successfully',
      data: null
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get distinct doctor specializations
 */
const getSpecializations = async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('doctors')
      .select('specialization')
      .eq('is_available', true);

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch specializations',
        errors: [error.message]
      });
    }

    const specializations = [...new Set((data || []).map(d => d.specialization).filter(Boolean))].sort();

    res.status(200).json({
      success: true,
      message: 'Specializations retrieved successfully',
      data: specializations
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Provision auth account for an existing directory doctor (admin only)
 */
const provisionDoctorAccount = async (req, res, next) => {
  try {
    const { id } = req.params;
    const validatedData = provisionDoctorAccountSchema.parse(req.body);
    const { password } = validatedData;

    // Check if doctor exists
    const { data: doctor, error: doctorError } = await supabaseAdmin
      .from('doctors')
      .select('*')
      .eq('id', id)
      .single();

    if (doctorError || !doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found',
        errors: ['Doctor with this ID does not exist']
      });
    }

    if (doctor.profile_id) {
      return res.status(400).json({
        success: false,
        message: 'Doctor already linked',
        errors: ['This doctor is already linked to an authentication account']
      });
    }

    const email = (validatedData.email || doctor.email || '').trim().toLowerCase();
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email required',
        errors: ['No email found for this doctor. Please provide an email in the request body.']
      });
    }

    // Create Supabase Auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (authError) {
      return res.status(400).json({
        success: false,
        message: 'Failed to create auth account',
        errors: [authError.message]
      });
    }

    const userId = authData.user.id;

    // Create profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: userId,
        full_name: doctor.full_name,
        role: 'doctor',
        phone: doctor.phone
      });

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return res.status(500).json({
        success: false,
        message: 'Failed to create profile',
        errors: [profileError.message]
      });
    }

    // Link doctor to profile
    const { data: updatedDoctor, error: updateError } = await supabaseAdmin
      .from('doctors')
      .update({ profile_id: userId, email })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      await supabaseAdmin.from('profiles').delete().eq('id', userId);
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return res.status(500).json({
        success: false,
        message: 'Failed to link doctor record',
        errors: [updateError.message]
      });
    }

    res.status(200).json({
      success: true,
      message: 'Doctor account provisioned and linked successfully',
      data: updatedDoctor
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
  getAllDoctors,
  getDoctorById,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  getSpecializations,
  provisionDoctorAccount
};
