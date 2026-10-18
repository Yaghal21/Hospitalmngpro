import { useEffect, useState } from 'react';
import { dashboardApi } from '../../api/dashboardApi';
import { useAuth } from '../../context/AuthContext';
import { 
  Users, 
  UserPlus, 
  Calendar, 
  FileText, 
  DollarSign,
  TrendingUp 
} from 'lucide-react';

const Dashboard = () => {
  const { isAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, appointmentsRes] = await Promise.all([
        dashboardApi.getStats(),
        dashboardApi.getRecentAppointments(5),
      ]);
      setStats(statsRes.data);
      setRecentAppointments(appointmentsRes.data || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, [isAdmin]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Patients',
      value: stats?.total_patients || 0,
      icon: Users,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Total Doctors',
      value: stats?.total_doctors || 0,
      icon: UserPlus,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
    },
    {
      title: "Today's Appointments",
      value: stats?.today_appointments || 0,
      icon: Calendar,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Pending Bills',
      value: stats?.pending_bills || 0,
      icon: FileText,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Total Revenue',
      value: `$${(stats?.total_revenue || 0).toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-teal-500',
      bgColor: 'bg-teal-50',
    },
  ];

  return (
    <div className="space-y-6 w-full">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome to your hospital management dashboard</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{card.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${card.bgColor}`}>
                  <Icon className={`w-6 h-6 ${card.color.replace('bg-', 'text-')}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Appointments */}
      {isAdmin && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Recent Appointments</h2>
          </div>
          <div className="p-6">
            {recentAppointments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm font-medium text-gray-500">
                      <th className="pb-3">Patient</th>
                      <th className="pb-3">Doctor</th>
                      <th className="pb-3">Date</th>
                      <th className="pb-3">Time</th>
                      <th className="pb-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {recentAppointments.map((appointment) => (
                      <tr key={appointment.id} className="text-sm">
                        <td className="py-3">
                          {appointment.patients?.profiles?.full_name || appointment.patients?.patient_code || 'N/A'}
                        </td>
                        <td className="py-3">
                          {appointment.doctors?.full_name || 'N/A'}
                        </td>
                        <td className="py-3">
                          {new Date(appointment.appointment_date).toLocaleDateString()}
                        </td>
                        <td className="py-3">{appointment.appointment_time}</td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            appointment.status === 'Completed' ? 'bg-green-100 text-green-700' :
                            appointment.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {appointment.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No recent appointments
              </div>
            )}
          </div>
        </div>
      )}

      {!isAdmin && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="text-center py-8">
            <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Patient Dashboard</h3>
            <p className="text-gray-600">
              Use the navigation menu to book appointments, view your history, and manage your profile.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
