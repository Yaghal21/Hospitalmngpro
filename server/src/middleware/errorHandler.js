/**
 * Centralized error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Zod validation error handling
  if (err.name === 'ZodError') {
    const issues = err.errors || err.issues || [];
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: issues.map(e => e.message)
    });
  }

  // Supabase error handling
  if (err.code) {
    const supabaseErrors = {
      '23505': { status: 409, message: 'Duplicate entry', details: 'A record with this value already exists' },
      '23503': { status: 400, message: 'Foreign key violation', details: 'Referenced record does not exist' },
      '23502': { status: 400, message: 'Not null violation', details: 'Required field is missing' },
      'PGRST116': { status: 404, message: 'Not found', details: 'Resource not found' }
    };

    const supabaseError = supabaseErrors[err.code];
    if (supabaseError) {
      return res.status(supabaseError.status).json({
        success: false,
        message: supabaseError.message,
        errors: [supabaseError.details]
      });
    }
  }

  // Default error response
  const status = err.status || 500;
  const message = err.message || 'Internal server error';
  
  // In production, don't expose stack traces
  const isDevelopment = process.env.NODE_ENV === 'development';

  res.status(status).json({
    success: false,
    message: message,
    errors: isDevelopment && err.details ? [err.details] : []
  });
};

/**
 * 404 Not Found handler
 */
const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Resource not found',
    errors: [`Cannot ${req.method} ${req.path}`]
  });
};

module.exports = {
  errorHandler,
  notFound
};
