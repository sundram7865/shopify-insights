import  { useState, useEffect } from 'react';
import { 
  RefreshCw, 
  ShoppingCart, 
  ExternalLink, 
  AlertCircle, 
  Mail
} from 'lucide-react';

interface Checkout {
  id: string;
  date: string;
  email: string;
  total: number;
  currency: string;
  recoveryUrl: string;
}

interface CheckoutStats {
  count: number;
  lostRevenue: number;
}

const AbandonedCheckouts = () => {
  const [checkouts, setCheckouts] = useState<Checkout[]>([]);
  const [stats, setStats] = useState<CheckoutStats>({ count: 0, lostRevenue: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [emailSent, setEmailSent] = useState<string | null>(null);

  const fetchCheckouts = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token'); 
      
      const response = await fetch('http://localhost:3000/api/analytics/checkouts', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch checkouts');

      const data = await response.json();
      setCheckouts(data.checkouts);
      setStats(data.stats);
    } catch (err) {
      console.error(err);
      setError('Could not load abandoned checkouts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCheckouts();
  }, []);

  const handleSendRecovery = (id: string, email: string) => {
    // In a real app, this would call an API endpoint to trigger an email
    setEmailSent(id);
    setTimeout(() => setEmailSent(null), 3000); // Reset after 3 seconds
    alert(`Recovery email simulation: Sending reminder to ${email}...`);
  };

  return (
    <div className="p-6">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            Abandoned Checkouts
            <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              Action Required
            </span>
          </h1>
          <p className="text-gray-500 mt-1">Review and recover lost sales opportunities</p>
        </div>
        <button 
          onClick={fetchCheckouts}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors shadow-sm"
        >
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          Refresh Data
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Potential Lost Revenue</p>
            <h3 className="text-3xl font-bold text-gray-900">${stats.lostRevenue.toLocaleString()}</h3>
          </div>
          <div className="h-12 w-12 bg-red-50 rounded-full flex items-center justify-center">
            <ShoppingCart className="h-6 w-6 text-red-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">At Risk Carts</p>
            <h3 className="text-3xl font-bold text-gray-900">{stats.count}</h3>
          </div>
          <div className="h-12 w-12 bg-orange-50 rounded-full flex items-center justify-center">
            <AlertCircle className="h-6 w-6 text-orange-500" />
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg flex items-center gap-2 border border-red-100">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {/* Checkouts Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-700 font-semibold uppercase text-xs border-b border-gray-200">
              <tr>
                <th className="px-6 py-4">Date Abandoned</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4 text-right">Cart Value</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Recovery Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-16 ml-auto"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-20 mx-auto"></div></td>
                    <td className="px-6 py-4"><div className="h-8 bg-gray-200 rounded w-24 ml-auto"></div></td>
                  </tr>
                ))
              ) : checkouts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-gray-400 bg-gray-50/50">
                    <ShoppingCart size={48} className="mx-auto mb-3 opacity-20" />
                    <p className="font-medium">No abandoned checkouts found.</p>
                    <p className="text-xs mt-1">Great job! Your customers are completing their orders.</p>
                  </td>
                </tr>
              ) : (
                checkouts.map((checkout) => (
                  <tr key={checkout.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        {new Date(checkout.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(checkout.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 truncate max-w-[200px]" title={checkout.email}>
                        {checkout.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-gray-900">
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: checkout.currency || 'USD' }).format(checkout.total)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                        Not Completed
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {checkout.recoveryUrl && checkout.recoveryUrl !== '#' ? (
                          <a 
                            href={checkout.recoveryUrl} 
                            target="_blank" 
                            rel="noreferrer"
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Checkout"
                          >
                            <ExternalLink size={18} />
                          </a>
                        ) : null}
                        
                        <button
                          onClick={() => handleSendRecovery(checkout.id, checkout.email)}
                          disabled={emailSent === checkout.id || checkout.email.includes("No Email")}
                          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                            emailSent === checkout.id 
                              ? "bg-green-100 text-green-700 border border-green-200"
                              : "bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow"
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {emailSent === checkout.id ? (
                            <>Sent!</>
                          ) : (
                            <><Mail size={14} /> Send Email</>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AbandonedCheckouts;