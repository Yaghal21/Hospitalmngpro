const { supabaseAdmin } = require('../config/supabase');
const { createBillSchema, updatePaymentSchema } = require('../validators/billValidator');

/**
 * Get current patient's bills
 */
const getMyBills = async (req, res, next) => {
  try {
    const { payment_status } = req.query;

    let query = supabaseAdmin
      .from('bills')
      .select(`
        *,
        appointments:appointment_id!inner (
          id,
          appointment_code,
          appointment_date,
          appointment_time,
          patient_id,
          doctors:doctor_id (
            full_name,
            specialization
          )
        )
      `)
      .eq('appointments.patient_id', req.user.id)
      .order('created_at', { ascending: false });

    if (payment_status) {
      query = query.eq('payment_status', payment_status);
    }

    const { data: bills, error } = await query;

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch bills',
        errors: [error.message]
      });
    }

    res.status(200).json({
      success: true,
      message: 'Bills retrieved successfully',
      data: bills
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all bills (admin only)
 */
const getAllBills = async (req, res, next) => {
  try {
    const { payment_status, page = 1, limit = 10 } = req.query;

    let query = supabaseAdmin
      .from('bills')
      .select(`
        *,
        appointments:appointment_id (
          id,
          appointment_code,
          appointment_date,
          doctors:doctor_id (
            full_name,
            specialization
          ),
          patients:patient_id (
            patient_code,
            profiles:profile_id (
              full_name,
              phone
            )
          )
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    if (payment_status) {
      query = query.eq('payment_status', payment_status);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: bills, error, count } = await query;

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch bills',
        errors: [error.message]
      });
    }

    res.status(200).json({
      success: true,
      message: 'Bills retrieved successfully',
      data: {
        bills,
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
 * Get bill by ID (authorized access only)
 */
const getBillById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: bill, error } = await supabaseAdmin
      .from('bills')
      .select(`
        *,
        appointments:appointment_id (
          id,
          appointment_code,
          appointment_date,
          patient_id,
          doctors:doctor_id (
            full_name,
            specialization
          ),
          patients:patient_id (
            id,
            patient_code,
            profiles:profile_id (
              full_name,
              phone
            )
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error || !bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found',
        errors: ['Bill with this ID does not exist']
      });
    }

    // Check authorization
    const role = req.user.role || req.user.profile?.role;
    const isAdmin = role === 'admin';
    const isPatient = req.user.id === bill.appointments?.patient_id || req.user.id === bill.appointments?.patients?.id;

    if (!isAdmin && !isPatient) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
        errors: ['You are not authorized to view this bill']
      });
    }

    res.status(200).json({
      success: true,
      message: 'Bill retrieved successfully',
      data: bill
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create bill (admin only)
 * total_amount is calculated by PostgreSQL
 */
const createBill = async (req, res, next) => {
  try {
    const validatedData = createBillSchema.parse(req.body);
    const { appointment_id, consultation_charge, additional_charges, discount } = validatedData;

    // Verify appointment exists
    const { data: appointment, error: appointmentError } = await supabaseAdmin
      .from('appointments')
      .select('*')
      .eq('id', appointment_id)
      .single();

    if (appointmentError || !appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
        errors: ['Appointment with this ID does not exist']
      });
    }

    // Check if bill already exists for this appointment
    const { data: existingBill, error: checkError } = await supabaseAdmin
      .from('bills')
      .select('id')
      .eq('appointment_id', appointment_id)
      .single();

    if (existingBill) {
      return res.status(400).json({
        success: false,
        message: 'Bill already exists',
        errors: ['A bill has already been created for this appointment']
      });
    }

    // Generate invoice number
    const invoiceNumber = `INV${Date.now().toString().slice(-6)}`;

    // Create bill (total_amount will be calculated by PostgreSQL)
    const { data: bill, error } = await supabaseAdmin
      .from('bills')
      .insert({
        invoice_number: invoiceNumber,
        appointment_id,
        consultation_charge,
        additional_charges: additional_charges || 0,
        discount: discount || 0,
        payment_status: 'Pending'
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create bill',
        errors: [error.message]
      });
    }

    res.status(201).json({
      success: true,
      message: 'Bill created successfully',
      data: bill
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
 * Update bill payment (admin only)
 */
const updateBillPayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const validatedData = updatePaymentSchema.parse(req.body);
    const { payment_status, payment_method } = validatedData;

    // Get bill
    const { data: bill, error: fetchError } = await supabaseAdmin
      .from('bills')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found',
        errors: ['Bill with this ID does not exist']
      });
    }

    // Prepare update data
    const updateData = {
      payment_status
    };

    if (payment_method) {
      updateData.payment_method = payment_method;
    }

    // Set paid_at if status is being changed to Paid
    if (payment_status === 'Paid' && bill.payment_status !== 'Paid') {
      updateData.paid_at = new Date().toISOString();
    }

    // Update bill
    const { data: updatedBill, error: updateError } = await supabaseAdmin
      .from('bills')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return res.status(500).json({
        success: false,
        message: 'Failed to update bill payment',
        errors: [updateError.message]
      });
    }

    res.status(200).json({
      success: true,
      message: 'Bill payment updated successfully',
      data: updatedBill
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
  getMyBills,
  getAllBills,
  getBillById,
  createBill,
  updateBillPayment
};
