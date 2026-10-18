import { useEffect, useState } from 'react';
import { patientApi } from '../../api/patientApi';
import { useAuth } from '../../context/AuthContext';
import { Search, User, Mail, Phone } from 'lucide-react';

const Patients = () => {
  const { isAdmin } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchPatients = async () => {
    try {
      const response = await patientApi.getAllPatients({ limit: 100 });
      setPatients(response.data.patients || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchPatients();
    } else {
      setLoading(false);
    }
  }, [isAdmin]);

  const filteredPatients = patients.filter(patient =>
    patient.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.patient_code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isAdmin) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
        <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-600">Only administrators can view all patients</p>
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold text-gray-900">Patients</h1>
          <p className="text-gray-600">Manage patient records</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search patients by name or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Patients Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {filteredPatients.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="text-left text-sm font-medium text-gray-500">
                  <th className="px-6 py-3">Patient Code</th>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Phone</th>
                  <th className="px-6 py-3">Gender</th>
                  <th className="px-6 py-3">Blood Group</th>
                  <th className="px-6 py-3">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPatients.map((patient) => (
                  <tr key={patient.id} className="text-sm">
                    <td className="px-6 py-4 font-medium">{patient.patient_code}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-primary-600" />
                        </div>
                        {patient.profiles?.full_name || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        {patient.profiles?.phone || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        {patient.profiles?.phone || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4">{patient.gender}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded">
                        {patient.blood_group || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {new Date(patient.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-gray-500">
            <User className="w-12 h-12 mx-auto mb-4" />
            <p>No patients found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Patients;
