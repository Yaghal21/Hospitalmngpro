import { useEffect, useState } from 'react';
import { appointmentApi } from '../../api/appointmentApi';
import { doctorApi } from '../../api/doctorApi';
import { useAuth } from '../../context/AuthContext';
import { Calendar, Clock, User, Plus, X, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

const Appointments = () => {
  const { isAdmin, isPatient, isDoctor } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [bookingForm, setBookingForm] = useState({
    specialization: '',
    appointment_date: '',
    appointment_time: '',
    reason: '',
  });

  const fetchData = async () => {
    try {
      let appointmentsRes;
      if (isPatient) {
        appointmentsRes = await appointmentApi.getMyAppointments();
      } else if (isDoctor) {
        appointmentsRes = await appointmentApi.getDoctorAppointments();
      } else {
        appointmentsRes = await appointmentApi.getAllAppointments();
      }
      
      const doctorsRes = await doctorApi.getAllDoctors();
      
      console.log('[APPOINTMENTS] Doctors response:', doctorsRes);
      
      const doctorsList = doctorsRes?.data?.data?.doctors || doctorsRes?.data?.doctors || doctorsRes?.data || [];
      console.log('[APPOINTMENTS] Doctors list:', doctorsList);
      
      setAppointments(appointmentsRes.data || appointmentsRes.data.appointments || []);
      setDoctors(doctorsList);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isAdmin, isPatient, isDoctor]);

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    try {
      // Find an available doctor from the selected specialization
      const availableDoctor = doctors.find(d => 
        d.specialization === bookingForm.specialization && d.is_available
      );

      if (!availableDoctor) {
        toast.error('No available doctors in this specialization');
        return;
      }

      await appointmentApi.createAppointment({
        ...bookingForm,
        doctor_id: availableDoctor.id
      });
      toast.success('Appointment booked successfully');
      setShowBookingModal(false);
      setBookingForm({ specialization: '', appointment_date: '', appointment_time: '', reason: '' });
      fetchData();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to book appointment';
      toast.error(message);
    }
  };

  const handleCancelAppointment = async (id) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;
    
    try {
      await appointmentApi.updateStatus(id, { status: 'Cancelled' });
      toast.success('Appointment cancelled successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to cancel appointment');
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await appointmentApi.updateStatus(id, { status });
      toast.success(`Appointment ${status.toLowerCase()} successfully`);
      fetchData();
    } catch (error) {
      toast.error('Failed to update appointment status');
    }
  };

  const filteredAppointments = appointments.filter(apt => 
    !filterStatus || apt.status === filterStatus
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
          <p className="text-gray-600">Manage your appointments</p>
        </div>
        {isPatient && (
          <button
            onClick={() => setShowBookingModal(true)}
            className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Book Appointment
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="Booked">Booked</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Appointments Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {filteredAppointments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="text-left text-sm font-medium text-gray-500">
                  <th className="px-6 py-3">Appointment ID</th>
                  {!isPatient && <th className="px-6 py-3">Patient</th>}
                  <th className="px-6 py-3">Specialization</th>
                  {!isDoctor && <th className="px-6 py-3">Doctor</th>}
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Time</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredAppointments.map((appointment) => (
                  <tr key={appointment.id} className="text-sm">
                    <td className="px-6 py-4 font-medium">{appointment.appointment_code}</td>
                    {!isPatient && (
                      <td className="px-6 py-4">
                        {appointment.patients?.profiles?.full_name || appointment.patients?.patient_code || 'N/A'}
                      </td>
                    )}
                    <td className="px-6 py-4">
                      {appointment.doctors?.specialization || 'N/A'}
                    </td>
                    {!isDoctor && (
                      <td className="px-6 py-4">
                        {appointment.doctors?.full_name || 'N/A'}
                      </td>
                    )}
                    <td className="px-6 py-4">
                      {new Date(appointment.appointment_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">{appointment.appointment_time}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        appointment.status === 'Completed' ? 'bg-green-100 text-green-700' :
                        appointment.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {appointment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {appointment.status === 'Booked' && isPatient && (
                        <button
                          onClick={() => handleCancelAppointment(appointment.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Cancel
                        </button>
                      )}
                      {appointment.status === 'Booked' && isDoctor && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdateStatus(appointment.id, 'Completed')}
                            className="text-green-600 hover:text-green-700"
                          >
                            Complete
                          </button>
                          <button
                            onClick={() => handleCancelAppointment(appointment.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-4" />
            <p>No appointments found</p>
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Book Appointment</h2>
              <button
                onClick={() => setShowBookingModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBookAppointment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Specialization
                </label>
                <select
                  value={bookingForm.specialization}
                  onChange={(e) => setBookingForm({ ...bookingForm, specialization: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Choose a specialization</option>
                  {(() => {
                    const specializations = [...new Set(doctors.map(d => d.specialization))];
                    console.log('[APPOINTMENTS] All specializations:', specializations);
                    return specializations.map((spec) => (
                      <option key={spec} value={spec}>
                        {spec}
                      </option>
                    ));
                  })()}
                </select>
                {doctors.length === 0 && (
                  <p className="text-sm text-gray-500 mt-1">No doctors available</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={bookingForm.appointment_date}
                  onChange={(e) => setBookingForm({ ...bookingForm, appointment_date: e.target.value })}
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time
                </label>
                <input
                  type="time"
                  value={bookingForm.appointment_time}
                  onChange={(e) => setBookingForm({ ...bookingForm, appointment_time: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason
                </label>
                <textarea
                  value={bookingForm.reason}
                  onChange={(e) => setBookingForm({ ...bookingForm, reason: e.target.value })}
                  required
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Describe your symptoms or reason for visit"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors"
              >
                Book Appointment
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Appointments;
