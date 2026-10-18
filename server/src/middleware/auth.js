const { supabase, supabaseAdmin } = require('../config/supabase');

/**
 * Verify Bearer token and authenticate user
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided',
        errors: ['Authorization header with Bearer token is required']
      });
    }

    const token = authHeader.substring(7);
    
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
        errors: [error?.message || 'Authentication failed']
      });
    }

    // Fetch user's profile from database to get role using supabaseAdmin to bypass RLS restrictions
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, role, phone')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('[AUTH MIDDLEWARE] Profile fetch failed:', profileError);
      return res.status(401).json({
        success: false,
        message: 'Profile not found',
        errors: ['User profile does not exist']
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
      profile: profile
    };

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Authentication error',
      errors: [error.message]
    });
  }
};

/**
 * Authorize by role
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.profile) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
        errors: ['Authentication required']
      });
    }

    if (!allowedRoles.includes(req.user.profile.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
        errors: [`Role '${req.user.profile.role}' is not authorized`]
      });
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorize
};
