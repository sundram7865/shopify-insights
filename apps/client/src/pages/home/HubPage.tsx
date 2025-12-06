import  { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Store, ArrowRight, LayoutDashboard, CheckCircle } from 'lucide-react';
import { getApiUrl } from '../../lib/utils';

export default function HubPage() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [shopName, setShopName] = useState('');
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('connected') === 'true' && user) {
      updateUser({ isShopifyConnected: true });
    }
  }, [location, user]); // updateUser omitted from deps to prevent loop

  const handleConnect = () => {
    if (!shopName || !user?.tenantId) return;
    window.location.href = `${getApiUrl()}/auth/shopify?shop=${shopName}.myshopify.com&tenantId=${user.tenantId}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full grid md:grid-cols-2 gap-8 items-center">
        <div className="space-y-6">
          <h1 className="text-4xl font-bold text-gray-900">
            Welcome, <span className="text-blue-600">{user?.email.split('@')[0]}</span>
          </h1>
          <p className="text-gray-500 text-lg">
            {user?.isShopifyConnected ? "Your store is connected." : "Connect your Shopify store to unlock analytics."}
          </p>
          <Button variant="outline" onClick={logout} className="text-red-600 hover:bg-red-50 border-red-100">Sign Out</Button>
        </div>

        <Card className="p-8 border-t-4 border-t-blue-600 shadow-2xl">
          {user?.isShopifyConnected ? (
            <div className="text-center space-y-6">
              <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">System Operational</h2>
              <Button variant="gradient" className="w-full h-12 text-lg" onClick={() => navigate('/dashboard')}>
                Launch Dashboard <LayoutDashboard className="ml-2 h-5 w-5" />
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-4 mb-2">
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Store className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Connect Store</h2>
                  <p className="text-sm text-gray-500">Shopify Integration</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg p-1">
                  <Input placeholder="my-store-name" value={shopName} onChange={(e) => setShopName(e.target.value)} className="border-0 bg-transparent shadow-none text-right" />
                  <span className="text-sm font-medium text-gray-500 bg-white px-3 py-2 rounded-md shadow-sm">.myshopify.com</span>
                </div>
                <Button onClick={handleConnect} disabled={!shopName} className="w-full h-12" variant="primary">
                  Connect & Sync <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}