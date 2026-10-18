require('dotenv').config();
const { supabaseAdmin } = require('./src/config/supabase');

async function seedAppointments() {
  console.log('🌱 Creating sample appointments...\n');

  try {
    // Get doctor ID
    const { data: doctor } = await supabaseAdmin
      .from('doctors')
      .select('id')
      .eq('full_name', 'Dr. Sarah Johnson')
      .single();

    if (!doctor) {
      console.error('❌ Doctor not found. Please run seed.js first.');
      process.exit(1);
    }

    // Get patient IDs
    const { data: patients } = await supabaseAdmin
      .from('patients')
      .select('id, profiles (full_name)')
      .limit(5);

    if (!patients || patients.length === 0) {
      console.log('⚠️  No patients found. Creating a sample patient first...');
      
      const { data: newPatientAuth } = await supabaseAdmin.auth.admin.createUser({
        email: 'patient1@hospital.com',
        password: 'patient123',
        email_confirm: true,
        user_metadata: { full_name: 'John Smith' }
      });

      const patientId = newPatientAuth.user.id;
      
      await supabaseAdmin.from('profiles').insert({
        id: patientId,
        full_name: 'John Smith',
        role: 'patient',
        phone: '5551234567'
      });

      await supabaseAdmin.from('patients').insert({
        id: patientId,
        patient_code: `PT${Date.now().toString().slice(-6)}`,
        profile_id: patientId,
        date_of_birth: '1985-05-15',
        gender: 'Male'
      });

      patients.push({ id: patientId, profiles: { full_name: 'John Smith' } });
    }

    // Create sample appointments
    const today = new Date();
    const appointments = [
      {
        patient_id: patients[0].id,
        doctor_id: doctor.id,
        appointment_date: today.toISOString().split('T')[0],
        appointment_time: '09:00',
        status: 'Completed',
        reason: 'Regular checkup'
      },
      {
        patient_id: patients[0].id,
        doctor_id: doctor.id,
        appointment_date: new Date(today.getTime() + 86400000).toISOString().split('T')[0],
        appointment_time: '10:30',
        status: 'Booked',
        reason: 'Follow-up consultation'
      },
      {
        patient_id: patients[0].id,
        doctor_id: doctor.id,
        appointment_date: new Date(today.getTime() + 172800000).toISOString().split('T')[0],
        appointment_time: '14:00',
        status: 'Booked',
        reason: 'Cardiac evaluation'
      }
    ];

    for (const appointment of appointments) {
      const { error } = await supabaseAdmin.from('appointments').insert(appointment);
      if (error) {
        console.error('❌ Failed to create appointment:', error.message);
      } else {
        console.log(`✅ Appointment created for ${appointment.appointment_date} at ${appointment.appointment_time}`);
      }
    }

    console.log('\n🎉 Sample appointments created successfully!');
    console.log('Login as admin at http://localhost:5173/login to view the dashboard.');

  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
}

seedAppointments();
