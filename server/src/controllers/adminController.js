const { supabase } = require('../config/supabase');

/**
 * Get dashboard statistics
 */
const getDashboardStats = async (req, res, next) => {
  try {
    // Try to use the existing view first
    const { data: viewData, error: viewError } = await supabase
      .from('hospital_dashboard_stats')
      .select('*')
      .single();

    if (!viewError && viewData) {
      return res.status(200).json({
        success: true,
        message: 'Dashboard statistics retrieved successfully',
        data: viewData
      });
    }

    // Fallback: calculate stats manually
    const [
      { count: totalPatients },
      { count: totalDoctors },
      { count: totalAppointments },
      { count: todayAppointments },
      { count: pendingBills },
      { data: paidBills }
    ] = await Promise.all([
      supabase.from('patients').select('*', { count: 'exact', head: true }),
      supabase.from('doctors').select('*', { count: 'exact', head: true }),
      supabase.from('appointments').select('*', { count: 'exact', head: true }),
      supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('appointment_date', new Date().toISOString().split('T')[0]),
      supabase.from('bills').select('*', { count: 'exact', head: true }).eq('payment_status', 'Pending'),
      supabase
        .from('bills')
        .select('total_amount')
        .eq('payment_status', 'Paid')
    ]);

    const totalRevenue = paidBills ? paidBills.reduce((sum, bill) => sum + (bill.total_amount || 0), 0) : 0;

    res.status(200).json({
      success: true,
      message: 'Dashboard statistics retrieved successfully',
      data: {
        total_patients: totalPatients || 0,
        total_doctors: totalDoctors || 0,
        total_appointments: totalAppointments || 0,
        today_appointments: todayAppointments || 0,
        pending_bills: pendingBills || 0,
        total_revenue: totalRevenue
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get recent appointments
 */
const getRecentAppointments = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;

    const { data: appointments, error } = await supabase
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
          profiles (
            full_name
          )
        )
      `)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (error) {
      console.error('[RECENT APPOINTMENTS] Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch recent appointments',
        errors: [error.message]
      });
    }

    res.status(200).json({
      success: true,
      message: 'Recent appointments retrieved successfully',
      data: appointments
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get revenue statistics
 */
const getRevenueStats = async (req, res, next) => {
  try {
    const { start_date, end_date } = req.query;

    let query = supabase
      .from('bills')
      .select('created_at, total_amount, payment_status')
      .eq('payment_status', 'Paid');

    if (start_date) {
      query = query.gte('created_at', start_date);
    }
    if (end_date) {
      query = query.lte('created_at', end_date);
    }

    const { data: bills, error } = await query.order('created_at', { ascending: true });

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch revenue statistics',
        errors: [error.message]
      });
    }

    const totalRevenue = bills ? bills.reduce((sum, bill) => sum + (bill.total_amount || 0), 0) : 0;
    const totalTransactions = bills ? bills.length : 0;

    // Group by date
    const revenueByDate = {};
    bills?.forEach(bill => {
      const date = bill.created_at.split('T')[0];
      revenueByDate[date] = (revenueByDate[date] || 0) + (bill.total_amount || 0);
    });

    res.status(200).json({
      success: true,
      message: 'Revenue statistics retrieved successfully',
      data: {
        total_revenue: totalRevenue,
        total_transactions: totalTransactions,
        revenue_by_date: revenueByDate
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get doctor summary
 */
const getDoctorSummary = async (req, res, next) => {
  try {
    const { data: doctors, error } = await supabase
      .from('doctors')
      .select(`
        id,
        full_name,
        specialization,
        is_available,
        appointments:appointments (
          id,
          status
        )
      `);

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch doctor summary',
        errors: [error.message]
      });
    }

    // Calculate statistics for each doctor
    const doctorSummary = doctors.map(doctor => {
      const totalAppointments = doctor.appointments?.length || 0;
      const completedAppointments = doctor.appointments?.filter(a => a.status === 'Completed').length || 0;
      const bookedAppointments = doctor.appointments?.filter(a => a.status === 'Booked').length || 0;

      return {
        id: doctor.id,
        full_name: doctor.full_name,
        specialization: doctor.specialization,
        is_available: doctor.is_available,
        total_appointments: totalAppointments,
        completed_appointments: completedAppointments,
        booked_appointments: bookedAppointments
      };
    });

    res.status(200).json({
      success: true,
      message: 'Doctor summary retrieved successfully',
      data: doctorSummary
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getRecentAppointments,
  getRevenueStats,
  getDoctorSummary
};
