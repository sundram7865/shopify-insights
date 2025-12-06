import React, { useEffect, useState } from 'react';
import api from '../../lib/axios';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Users, RefreshCcw } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export default function CustomersPage() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCustomers = async () => {
    if (!user?.tenantId) return;
    setLoading(true);
    try {
      const res = await api.get(`/analytics/customers?tenantId=${user.tenantId}`);
      setCustomers(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCustomers(); }, [user]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-500">Your most valuable assets</p>
        </div>
        <Button variant="outline" onClick={fetchCustomers}><RefreshCcw className="h-4 w-4 mr-2" /> Refresh</Button>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-500 uppercase">
            <tr>
              <th className="px-6 py-4">Customer Email</th>
              <th className="px-6 py-4">Total Orders</th>
              <th className="px-6 py-4 text-right">Lifetime Spend</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
               <tr><td colSpan={3} className="p-8 text-center text-gray-500">Loading customers...</td></tr>
            ) : customers.length === 0 ? (
               <tr><td colSpan={3} className="p-8 text-center text-gray-500">No customers found.</td></tr>
            ) : (
              customers.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium flex items-center gap-3">
                    <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 text-xs font-bold">
                      {c.email[0].toUpperCase()}
                    </div>
                    {c.email}
                  </td>
                  <td className="px-6 py-4">{c._count?.orders || 0}</td>
                  <td className="px-6 py-4 text-right font-medium">${c.totalSpent}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}