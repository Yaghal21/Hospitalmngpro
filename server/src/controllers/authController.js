const { supabase, supabaseAdmin } = require('../config/supabase');
const { registerSchema, loginSchema } = require('../validators/authValidator');

/**
 * Register a new patient
 * Creates Supabase Auth user, profile, and patient records
 */
const register = async (req, res, next) => {
  try {
    // Validate request body
    const validatedData = registerSchema.parse(req.body);
    const { email, password, full_name, phone, date_of_birth, gender, address, blood_group } = validatedData;

    // Create Supabase Auth user using admin API with auto-confirmation
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name
      }
    });

    if (authError) {
      console.error('[REGISTER] Supabase auth error:', authError);
      return res.status(400).json({
        success: false,
        message: 'Failed to create user',
        errors: [authError.message]
      });
    }

    const userId = authData.user.id;

    // Create profile record with patient role
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: userId,
        full_name,
        role: 'patient',
        phone: phone || null
      });

    if (profileError) {
      // Rollback: delete auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return res.status(500).json({
        success: false,
        message: 'Failed to create profile',
        errors: [profileError.message]
      });
    }

    // Generate patient code
    const patientCode = `PT${Date.now().toString().slice(-6)}`;

    // Create patient record
    const { error: patientError } = await supabaseAdmin
      .from('patients')
      .insert({
        id: userId,
        patient_code: patientCode,
        profile_id: userId,
        date_of_birth,
        gender,
        address: address || null,
        blood_group: blood_group || null
      });

    if (patientError) {
      // Rollback: delete profile and auth user
      await supabaseAdmin.from('profiles').delete().eq('id', userId);
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return res.status(500).json({
        success: false,
        message: 'Failed to create patient record',
        errors: [patientError.message]
      });
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please login with your credentials.',
      data: {
        user: {
          id: userId,
          email: email,
          full_name: full_name,
          role: 'patient'
        }
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
 * Login user
 */
const login = async (req, res, next) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const { email, password } = validatedData;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        errors: [error.message]
      });
    }

    // Fetch user profile using supabaseAdmin to bypass RLS restrictions
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, role, phone')
      .eq('id', data.user.id)
      .single();

    if (profileError || !profile) {
      return res.status(401).json({
        success: false,
        message: 'Profile not found',
        errors: ['User profile does not exist']
      });
    }

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: data.user.id,
          email: data.user.email,
          full_name: profile.full_name,
          role: profile.role
        },
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token
        }
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
 * Logout user
 */
const logout = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(400).json({
        success: false,
        message: 'No token provided',
        errors: ['Authorization header with Bearer token is required']
      });
    }

    const token = authHeader.substring(7);
    
    const { error } = await supabase.auth.signOut({
      access_token: token
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Logout failed',
        errors: [error.message]
      });
    }

    res.status(200).json({
      success: true,
      message: 'Logout successful',
      data: null
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user
 */
const getMe = async (req, res, next) => {
  try {
    // User is already attached by authenticate middleware
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error || !profile) {
      console.error('[GET_ME] Profile fetch failed:', error);
      return res.status(404).json({
        success: false,
        message: 'Profile not found',
        errors: ['User profile does not exist']
      });
    }

    // If patient, fetch patient details
    let patientDetails = null;
    if (profile.role === 'patient') {
      const { data: patient } = await supabaseAdmin
        .from('patients')
        .select('*')
        .eq('id', req.user.id)
        .single();
      patientDetails = patient;
    }

    // If doctor, fetch doctor details
    let doctorDetails = null;
    if (profile.role === 'doctor') {
      const { data: doctor } = await supabaseAdmin
        .from('doctors')
        .select('*')
        .eq('profile_id', req.user.id)
        .single();
      doctorDetails = doctor;
    }

    res.status(200).json({
      success: true,
      message: 'User retrieved successfully',
      data: {
        id: req.user.id,
        email: req.user.email,
        full_name: profile.full_name,
        role: profile.role,
        profile,
        patient: patientDetails,
        doctor: doctorDetails
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  getMe
};
