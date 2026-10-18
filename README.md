# Hospital Management System

A full-stack Hospital Management System website prototype with React frontend and Express backend, integrated with Supabase PostgreSQL.

## Technology Stack

- **Frontend**: React + Vite + JavaScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Charts**: Recharts
- **Notifications**: React Hot Toast
- **Backend**: Node.js + Express.js
- **Database**: Supabase PostgreSQL
- **Authentication**: Supabase Auth
- **API Client**: Axios

## Project Structure

```
hospital-management-system/
├── client/                 # React + Vite frontend
│   ├── src/
│   │   ├── api/           # API service modules
│   │   ├── components/    # Reusable components
│   │   ├── context/       # React Context (Auth)
│   │   ├── layouts/       # Page layouts
│   │   ├── pages/         # Page components
│   │   └── routes/        # Route protection
│   ├── .env               # Frontend environment variables
│   └── package.json
│
├── server/                 # Node.js + Express backend
│   ├── src/
│   │   ├── config/        # Supabase configuration
│   │   ├── controllers/   # Request handlers
│   │   ├── middleware/    # Auth, error handling
│   │   ├── routes/        # API routes
│   │   ├── validators/    # Zod schemas
│   │   ├── app.js         # Express app
│   │   └── server.js      # Server entry point
│   ├── .env               # Backend environment variables
│   └── package.json
│
└── README.md
```

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Supabase account with project set up
- Existing database schema with tables: `profiles`, `patients`, `doctors`, `appointments`, `bills`

## Installation & Setup

### 1. Backend Setup

```bash
cd server
npm install
```

Create a `.env` file in the server directory:

```env
PORT=5001
NODE_ENV=development
CLIENT_URL=http://localhost:5173

SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_rotated_service_role_key
```

Start the backend server:

```bash
npm run dev
```

The server will start on port 5001.

### 2. Frontend Setup

```bash
cd client
npm install
```

Create a `.env` file in the client directory:

```env
VITE_API_BASE_URL=http://localhost:5001/api
```

Start the frontend development server:

```bash
npm run dev
```

The frontend will be available at `http://localhost:5173/`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new patient
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Doctors
- `GET /api/doctors` - Get all doctors (public)
- `GET /api/doctors/:id` - Get doctor by ID
- `POST /api/doctors` - Create doctor (admin only)
- `PATCH /api/doctors/:id` - Update doctor (admin only)
- `DELETE /api/doctors/:id` - Delete doctor (admin only)

### Patients
- `GET /api/patients/me` - Get own profile (patient)
- `PATCH /api/patients/me` - Update own profile (patient)
- `GET /api/patients` - Get all patients (admin only)
- `GET /api/patients/:id` - Get patient by ID (admin or own)

### Appointments
- `POST /api/appointments` - Book appointment (patient)
- `GET /api/appointments/me` - Get own appointments (patient)
- `GET /api/appointments` - Get all appointments (admin)
- `GET /api/appointments/:id` - Get appointment by ID
- `PATCH /api/appointments/:id/status` - Update status
- `PATCH /api/appointments/:id/notes` - Update notes (doctor only)

### Billing
- `GET /api/bills/me` - Get own bills (patient)
- `GET /api/bills` - Get all bills (admin)
- `GET /api/bills/:id` - Get bill by ID
- `POST /api/bills` - Create bill (admin)
- `PATCH /api/bills/:id/payment` - Update payment (admin)

### Admin Dashboard
- `GET /api/admin/dashboard/stats` - Dashboard statistics
- `GET /api/admin/dashboard/recent-appointments` - Recent appointments
- `GET /api/admin/dashboard/revenue` - Revenue statistics
- `GET /api/admin/dashboard/doctor-summary` - Doctor summary

## Features

### Authentication
- Patient registration with Supabase Auth
- Login/logout functionality
- Role-based access control (admin, doctor, patient)
- Protected routes
- Token management

### Dashboard
- Overview cards (patients, doctors, appointments, bills, revenue)
- Recent appointments table
- Role-specific views

### Patients
- Patient listing (admin only)
- Patient search and filtering
- Patient profile management
- Patient appointment history

### Doctors
- Doctor directory (public)
- Search by name and specialization
- Filter by availability
- Doctor details with specialization, experience, fees
- Available days display

### Appointments
- Book appointments (patients)
- View appointment history
- Cancel appointments
- Filter by status
- Doctor availability checking
- Time slot conflict prevention

### Billing
- View bills (patients and admin)
- Bill details with consultation charges
- Payment status tracking
- Filter by payment status

## Security Features

- Helmet security headers
- CORS restricted to CLIENT_URL
- Rate limiting on auth endpoints
- Input validation with Zod
- Bearer token authentication
- Role-based authorization
- Server-side permission enforcement
- Environment variable protection
- Service role key only used server-side

## Database Schema

The system uses the following Supabase tables:

- `profiles` - User profiles with roles (admin, doctor, patient)
- `patients` - Patient records linked to profiles
- `doctors` - Doctor records with specialization and availability
- `appointments` - Appointment bookings with status tracking
- `bills` - Billing records with payment status
- `hospital_dashboard_stats` - Dashboard statistics view

## Creating the First Admin

Since public registration only creates patient accounts, the first admin must be created through Supabase:

1. Go to Supabase Dashboard → Authentication → Users
2. Create a new user with email/password
3. Go to SQL Editor and run:

```sql
UPDATE profiles 
SET role = 'admin' 
WHERE id = 'your_user_uuid';
```

4. Login via the application with admin credentials

## Testing

### Backend Health Check
```bash
curl http://localhost:5001/api/health
```

### Test Authentication
```bash
# Register a patient
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","full_name":"Test User","phone":"1234567890","date_of_birth":"1990-01-01","gender":"Male"}'

# Login
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## Troubleshooting

### Port Conflicts
- If port 5001 is in use, change the PORT in `server/.env`
- If port 5173 is in use, Vite will automatically use the next available port

### Supabase Connection Issues
- Verify SUPABASE_URL is correct
- Check that keys match your Supabase project
- Ensure Supabase project is active
- Check network connectivity

### Tailwind CSS Not Working
- Ensure PostCSS and Autoprefixer are installed
- Verify `tailwind.config.js` exists
- Check that `index.css` has Tailwind directives

## Development

### Backend Scripts
- `npm run dev` - Start server with nodemon (development)
- `npm start` - Start server (production)
- `npm test` - Run tests

### Frontend Scripts
- `npm run dev` - Start Vite dev server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## License

ISC
# Hospitalmngpro
