# Hospital Management System - Backend API

A complete backend API for a Hospital Management System built with Node.js, Express.js, and Supabase PostgreSQL.

## Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: Supabase PostgreSQL
- **Authentication**: Supabase Auth
- **Validation**: Zod
- **Security**: Helmet, CORS, Rate Limiting

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Supabase account with project set up
- Existing database schema with tables: `profiles`, `patients`, `doctors`, `appointments`, `bills`

## Installation

1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

4. Configure your environment variables in `.env`:
```env
PORT=5001
NODE_ENV=development
CLIENT_URL=http://localhost:5173

SUPABASE_URL=https://hpdjmsosyqbykmfbituiq.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_rotated_service_role_key_here
```

**Important**: 
- Replace `your_supabase_anon_key_here` with your actual Supabase anon key from the Supabase dashboard
- Replace `your_rotated_service_role_key_here` with your rotated service role key
- Never commit the `.env` file or expose the service role key to the frontend

## Starting the Server

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will start on the port specified in `.env` (default: 5000).

## API Endpoints

### Health Check

- `GET /api/health` - Check server status (public)

### Authentication

- `POST /api/auth/register` - Register a new patient (public, rate-limited)
- `POST /api/auth/login` - Login user (public, rate-limited)
- `POST /api/auth/logout` - Logout user (authenticated)
- `GET /api/auth/me` - Get current user (authenticated)

### Doctors

- `GET /api/doctors` - Get all doctors (authenticated, supports search, filtering, pagination)
- `GET /api/doctors/:id` - Get doctor by ID (authenticated)
- `POST /api/doctors` - Create new doctor (admin only)
- `PATCH /api/doctors/:id` - Update doctor (admin only)
- `DELETE /api/doctors/:id` - Delete doctor (admin only)

### Patients

- `GET /api/patients/me` - Get current patient's profile (patient only)
- `PATCH /api/patients/me` - Update current patient's profile (patient only)
- `GET /api/patients` - Get all patients (admin only)
- `GET /api/patients/:id` - Get patient by ID (admin or own profile)

### Appointments

- `POST /api/appointments` - Create appointment (patient only)
- `GET /api/appointments/me` - Get current patient's appointments (patient only)
- `GET /api/appointments` - Get all appointments (admin only, supports filters)
- `GET /api/appointments/:id` - Get appointment by ID (authorized access)
- `PATCH /api/appointments/:id/status` - Update appointment status (authorized)
- `PATCH /api/appointments/:id/notes` - Update appointment notes (assigned doctor only)

### Billing

- `GET /api/bills/me` - Get current patient's bills (patient only)
- `GET /api/bills` - Get all bills (admin only)
- `GET /api/bills/:id` - Get bill by ID (admin or own bill)
- `POST /api/bills` - Create bill (admin only)
- `PATCH /api/bills/:id/payment` - Update bill payment (admin only)

### Admin Dashboard

- `GET /api/admin/dashboard/stats` - Get dashboard statistics (admin only)
- `GET /api/admin/dashboard/recent-appointments` - Get recent appointments (admin only)
- `GET /api/admin/dashboard/revenue` - Get revenue statistics (admin only)
- `GET /api/admin/dashboard/doctor-summary` - Get doctor summary (admin only)

## Authentication

The API uses Supabase Auth for authentication. After login, you receive an access token that must be included in the `Authorization` header as a Bearer token:

```
Authorization: Bearer <your_access_token>
```

### Role-Based Authorization

The system supports three roles:
- `admin` - Full access to all resources
- `doctor` - Access to assigned appointments and patient information
- `patient` - Access to own profile, appointments, and bills

Roles are stored in the `profiles` table and are enforced server-side. The frontend cannot modify roles.

## Creating the First Admin

Since public registration only creates patient accounts, the first admin must be created through a secure process:

### Option 1: Direct Database Insert (Recommended for Initial Setup)

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Run the following SQL to create an admin user:

```sql
-- First, create the auth user (you'll need to do this via Supabase Auth API or dashboard)
-- Then insert into profiles with admin role:

INSERT INTO profiles (id, full_name, role, phone)
VALUES ('user_uuid_from_auth', 'Admin Name', 'admin', 'phone_number');
```

### Option 2: Manual Provisioning Script

Create a temporary script to provision the initial admin:

```javascript
// This should be run once and then deleted
const { supabaseAdmin } = require('./src/config/supabase');

async function createAdmin() {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: 'admin@hospital.com',
    password: 'secure_password',
    email_confirm: true
  });
  
  if (error) {
    console.error('Error creating admin:', error);
    return;
  }
  
  await supabaseAdmin.from('profiles').insert({
    id: data.user.id,
    full_name: 'System Administrator',
    role: 'admin',
    phone: '0000000000'
  });
  
  console.log('Admin created successfully');
}

createAdmin();
```

**Important**: After creating the initial admin, delete or secure any provisioning scripts.

## Creating Doctor Accounts

Doctor accounts should be created through the admin API endpoint:

```bash
POST /api/doctors
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "email": "doctor@hospital.com",
  "password": "secure_password",
  "full_name": "Dr. John Doe",
  "specialization": "Cardiology",
  "qualification": "MBBS, MD",
  "experience_years": 10,
  "phone": "1234567890",
  "consultation_fee": 500,
  "available_days": ["Monday", "Wednesday", "Friday"],
  "is_available": true
}
```

This creates:
1. A Supabase Auth user
2. A profile record with `role: 'doctor'`
3. A doctor record linked to the profile

## Testing with Postman

### 1. Import the Collection

Create a new Postman collection and add the following requests:

#### Register Patient
```http
POST {{SERVER_URL}}/api/auth/register
Content-Type: application/json

{
  "email": "patient@example.com",
  "password": "password123",
  "full_name": "John Doe",
  "phone": "1234567890",
  "date_of_birth": "1990-01-01",
  "gender": "Male",
  "address": "123 Main St",
  "blood_group": "O+"
}
```

#### Login
```http
POST {{SERVER_URL}}/api/auth/login
Content-Type: application/json

{
  "email": "patient@example.com",
  "password": "password123"
}
```

#### Get Current User
```http
GET {{SERVER_URL}}/api/auth/me
Authorization: Bearer {{access_token}}
```

#### Get Doctors
```http
GET {{SERVER_URL}}/api/doctors
Authorization: Bearer {{access_token}}
```

#### Book Appointment
```http
POST {{SERVER_URL}}/api/appointments
Authorization: Bearer {{patient_token}}
Content-Type: application/json

{
  "doctor_id": "doctor_uuid_here",
  "appointment_date": "2024-12-01",
  "appointment_time": "10:00",
  "reason": "Regular checkup"
}
```

### 2. Set Environment Variables

In Postman, create an environment with:
- `SERVER_URL`: `http://localhost:5000`
- `access_token`: (copy from login response)
- `patient_token`: (copy from patient login response)
- `admin_token`: (copy from admin login response)

## Request/Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data here
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    "Specific error details"
  ]
}
```

### Pagination Response
```json
{
  "success": true,
  "message": "Data retrieved successfully",
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "pages": 10
    }
  }
}
```

## Common Errors

### 401 Unauthorized
- Missing or invalid Bearer token
- Expired session (login again)

### 403 Forbidden
- Insufficient permissions for the requested role
- Attempting to access another user's data

### 404 Not Found
- Resource does not exist
- Invalid ID format

### 409 Conflict
- Duplicate entry (e.g., booking an occupied time slot)
- Unique constraint violation

### 422 Validation Error
- Invalid request data
- Missing required fields
- Invalid data format

## Database Constraints

The API respects the following database constraints:

1. **Unique Appointment Slots**: A doctor cannot be booked in the same date/time slot unless the previous appointment is cancelled
2. **Foreign Keys**: All relationships are enforced (e.g., appointments must reference valid doctors and patients)
3. **Generated Columns**: `total_amount` in bills is calculated by PostgreSQL and cannot be written directly

## Security Features

- **Helmet**: Security headers for Express
- **CORS**: Restricted to configured CLIENT_URL
- **Rate Limiting**: Auth endpoints limited to 5 requests per 15 minutes per IP
- **Input Validation**: All inputs validated with Zod schemas
- **Role-Based Authorization**: Server-side role enforcement
- **Token Verification**: Bearer tokens verified with Supabase Auth
- **Environment Variables**: Sensitive data stored in `.env` (never committed)

## Supabase Connection Errors

### Connection Failed
- Verify SUPABASE_URL is correct
- Check network connectivity
- Ensure Supabase project is active

### Authentication Failed
- Verify SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY
- Check that keys haven't been rotated
- Ensure keys match the correct Supabase project

### Permission Denied
- Check Row Level Security (RLS) policies in Supabase
- Ensure service role key is used for admin operations
- Verify user has required permissions in database

## Development Notes

- The server uses CommonJS modules (`require`/`module.exports`)
- All database operations use the Supabase client
- The service role client is only used for privileged operations (admin, user creation)
- Regular user operations use the anon key client with user authentication
- Errors are logged to console in development mode
- Stack traces are hidden in production mode

## Testing

Run tests with:
```bash
npm test
```

Tests should verify:
- Server starts without configuration errors
- Health endpoint returns success
- Authentication works correctly
- Protected endpoints reject unauthorized requests
- Role-based authorization is enforced
- Database operations persist correctly
- Validation errors are returned for invalid data

## License

ISC
