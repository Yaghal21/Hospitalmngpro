require('dotenv').config();
const { supabaseAdmin } = require('./src/config/supabase');

async function seedDatabase() {
  console.log('🌱 Starting database seeding...\n');

  try {
    // Create Admin User
    console.log('Creating admin user...');
    const adminEmail = 'admin@hospital.com';
    const adminPassword = 'admin123';
    
    const { data: adminAuth, error: adminError } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        full_name: 'System Administrator'
      }
    });

    if (adminError) {
      if (adminError.message.includes('already registered')) {
        console.log('⚠️  Admin user already exists');
      } else {
        throw adminError;
      }
    } else {
      const adminId = adminAuth.user.id;
      
      // Create admin profile
      await supabaseAdmin.from('profiles').insert({
        id: adminId,
        full_name: 'System Administrator',
        role: 'admin',
        phone: '0000000000'
      });
      
      console.log('✅ Admin user created successfully');
      console.log(`   Email: ${adminEmail}`);
      console.log(`   Password: ${adminPassword}\n`);
    }

    // Create Doctor User
    console.log('Creating doctor user...');
    const doctorEmail = 'doctor@hospital.com';
    const doctorPassword = 'doctor123';
    
    const { data: doctorAuth, error: doctorError } = await supabaseAdmin.auth.admin.createUser({
      email: doctorEmail,
      password: doctorPassword,
      email_confirm: true,
      user_metadata: {
        full_name: 'Dr. Sarah Johnson'
      }
    });

    if (doctorError) {
      if (doctorError.message.includes('already registered')) {
        console.log('⚠️  Doctor user already exists');
      } else {
        throw doctorError;
      }
    } else {
      const doctorId = doctorAuth.user.id;
      
      // Create doctor profile
      await supabaseAdmin.from('profiles').insert({
        id: doctorId,
        full_name: 'Dr. Sarah Johnson',
        role: 'doctor',
        phone: '9876543210'
      });
      
      // Create doctor record
      await supabaseAdmin.from('doctors').insert({
        id: doctorId,
        profile_id: doctorId,
        full_name: 'Dr. Sarah Johnson',
        specialization: 'Cardiology',
        qualification: 'MBBS, MD (Cardiology)',
        experience_years: 12,
        consultation_fee: 500,
        available_days: ['Monday', 'Wednesday', 'Friday'],
        is_available: true
      });
      
      console.log('✅ Doctor user created successfully');
      console.log(`   Email: ${doctorEmail}`);
      console.log(`   Password: ${doctorPassword}\n`);
    }

    console.log('🎉 Seeding completed successfully!\n');
    console.log('Credentials:');
    console.log('================');
    console.log('ADMIN:');
    console.log(`  Email: ${adminEmail}`);
    console.log(`  Password: ${adminPassword}`);
    console.log('');
    console.log('DOCTOR:');
    console.log(`  Email: ${doctorEmail}`);
    console.log(`  Password: ${doctorPassword}`);
    console.log('');
    console.log('You can now login with these credentials at http://localhost:5173/login');

  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
}

seedDatabase();
