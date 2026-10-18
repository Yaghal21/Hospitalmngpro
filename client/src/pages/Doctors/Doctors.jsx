import { useEffect, useState } from 'react';
import { doctorApi } from '../../api/doctorApi';
import { Search, User, Stethoscope, Clock, DollarSign } from 'lucide-react';

const Doctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSpecialization, setFilterSpecialization] = useState('');

  const fetchDoctors = async () => {
    try {
      const response = await doctorApi.getAllDoctors({ limit: 100 });
      setDoctors(response.data.doctors || []);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const filteredDoctors = doctors.filter(doctor => {
    const matchesSearch = doctor.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpecialization = !filterSpecialization || 
                                  doctor.specialization === filterSpecialization;
    return matchesSearch && matchesSpecialization;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Doctors</h1>
        <p className="text-gray-600">Browse our medical specialists</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search doctors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterSpecialization}
            onChange={(e) => setFilterSpecialization(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">All Specializations</option>
            {[...new Set(doctors.map(d => d.specialization))].map(spec => (
              <option key={spec} value={spec}>{spec}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Doctors Grid */}
      {filteredDoctors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDoctors.map((doctor) => (
            <div key={doctor.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{doctor.full_name}</h3>
                      <p className="text-sm text-gray-600">{doctor.specialization}</p>
                    </div>
                  </div>
                  {doctor.is_available ? (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                      Available
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                      Unavailable
                    </span>
                  )}
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Stethoscope className="w-4 h-4" />
                    <span>{doctor.qualification}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{doctor.experience_years} years experience</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    <span>₹{doctor.consultation_fee} consultation</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-2">Available Days:</p>
                  <div className="flex flex-wrap gap-1">
                    {doctor.available_days?.map((day) => (
                      <span key={day} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        {day}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No doctors found</h3>
          <p className="text-gray-600">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
};

export default Doctors;
