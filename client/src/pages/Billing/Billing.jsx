import { useEffect, useState } from 'react';
import { billApi } from '../../api/billApi';
import { useAuth } from '../../context/AuthContext';
import { FileText, DollarSign, Calendar, Filter } from 'lucide-react';

const Billing = () => {
  const { isAdmin, isPatient } = useAuth();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');

  const fetchBills = async () => {
    try {
      const response = isPatient ? await billApi.getMyBills() : await billApi.getAllBills();
      setBills(response.data || response.data.bills || []);
    } catch (error) {
      console.error('Error fetching bills:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, [isAdmin, isPatient]);

  const filteredBills = bills.filter(bill => 
    !filterStatus || bill.payment_status === filterStatus
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
        <p className="text-gray-600">Manage invoices and payments</p>
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
            <option value="Pending">Pending</option>
            <option value="Paid">Paid</option>
          </select>
        </div>
      </div>

      {/* Bills Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {filteredBills.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="text-left text-sm font-medium text-gray-500">
                  <th className="px-6 py-3">Invoice #</th>
                  <th className="px-6 py-3">Patient</th>
                  <th className="px-6 py-3">Doctor</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Consultation</th>
                  <th className="px-6 py-3">Total</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Payment Method</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredBills.map((bill) => (
                  <tr key={bill.id} className="text-sm">
                    <td className="px-6 py-4 font-medium">{bill.invoice_number}</td>
                    <td className="px-6 py-4">
                      {bill.appointments?.patients?.profiles?.full_name || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      {bill.appointments?.doctors?.full_name || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      {new Date(bill.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">₹{bill.consultation_charge}</td>
                    <td className="px-6 py-4 font-semibold">₹{bill.total_amount}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        bill.payment_status === 'Paid' ? 'bg-green-100 text-green-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {bill.payment_status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {bill.payment_method || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4" />
            <p>No bills found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Billing;
