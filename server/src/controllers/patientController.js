const { supabase, supabaseAdmin } = require('../config/supabase');
const { updatePatientSchema } = require('../validators/patientValidator');

/**
 * Get current patient's profile
 */
const getMyProfile = async (req, res, next) => {
  try {
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found',
        errors: ['User profile does not exist']
      });
    }

    const { data: patient, error: patientError } = await supabaseAdmin
      .from('patients')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (patientError || !patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient record not found',
        errors: ['Patient record does not exist']
      });
    }

    res.status(200).json({
      success: true,
      message: 'Patient profile retrieved successfully',
      data: {
        profile,
        patient
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update current patient's profile
 */
const updateMyProfile = async (req, res, next) => {
  try {
    const validatedData = updatePatientSchema.parse(req.body);

    // Update profile
    const profileUpdate = {};
    if (validatedData.full_name) profileUpdate.full_name = validatedData.full_name;
    if (validatedData.phone) profileUpdate.phone = validatedData.phone;

    if (Object.keys(profileUpdate).length > 0) {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update(profileUpdate)
        .eq('id', req.user.id);

      if (profileError) {
        return res.status(500).json({
          success: false,
          message: 'Failed to update profile',
          errors: [profileError.message]
        });
      }
    }

    // Update patient record
    const patientUpdate = {};
    if (validatedData.date_of_birth) patientUpdate.date_of_birth = validatedData.date_of_birth;
    if (validatedData.gender) patientUpdate.gender = validatedData.gender;
    if (validatedData.address !== undefined) patientUpdate.address = validatedData.address;
    if (validatedData.blood_group !== undefined) patientUpdate.blood_group = validatedData.blood_group;

    if (Object.keys(patientUpdate).length > 0) {
      const { error: patientError } = await supabaseAdmin
        .from('patients')
        .update(patientUpdate)
        .eq('id', req.user.id);

      if (patientError) {
        return res.status(500).json({
          success: false,
          message: 'Failed to update patient record',
          errors: [patientError.message]
        });
      }
    }

    // Fetch updated data
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .single();

    const { data: patient } = await supabaseAdmin
      .from('patients')
      .select('*')
      .eq('id', req.user.id)
      .single();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        profile,
        patient
      }
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
 * Get all patients (admin only)
 */
const getAllPatients = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data: patients, error, count } = await supabase
      .from('patients')
      .select(`
        *,
        profiles:profile_id (
          id,
          full_name,
          role,
          phone,
          created_at
        )
      `, { count: 'exact' })
      .range(from, to);

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch patients',
        errors: [error.message]
      });
    }

    res.status(200).json({
      success: true,
      message: 'Patients retrieved successfully',
      data: {
        patients,
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
 * Get patient by ID (admin only, or the patient themselves)
 */
const getPatientById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if user is admin or the patient themselves
    const isAdmin = req.user.profile.role === 'admin';
    const isOwnProfile = req.user.id === id;

    if (!isAdmin && !isOwnProfile) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
        errors: ['You can only view your own profile']
      });
    }

    const { data: patient, error } = await supabase
      .from('patients')
      .select(`
        *,
        profiles:profile_id (
          id,
          full_name,
          role,
          phone,
          created_at
        )
      `)
      .eq('id', id)
      .single();

    if (error || !patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found',
        errors: ['Patient with this ID does not exist']
      });
    }

    res.status(200).json({
      success: true,
      message: 'Patient retrieved successfully',
      data: patient
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyProfile,
  updateMyProfile,
  getAllPatients,
  getPatientById
};
