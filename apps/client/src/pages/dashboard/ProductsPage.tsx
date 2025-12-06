import  { useEffect, useState } from 'react';
import api from '../../lib/axios';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Package, RefreshCcw } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export default function ProductsPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    if (!user?.tenantId) return;
    setLoading(true);
    try {
      const res = await api.get(`/analytics/products?tenantId=${user.tenantId}`);
      setProducts(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, [user]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500">Manage your store inventory</p>
        </div>
        <Button variant="outline" onClick={fetchProducts}><RefreshCcw className="h-4 w-4 mr-2" /> Refresh</Button>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-500 uppercase">
            <tr>
              <th className="px-6 py-4">Product Name</th>
              <th className="px-6 py-4 text-right">Price</th>
              <th className="px-6 py-4 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
               <tr><td colSpan={3} className="p-8 text-center text-gray-500">Loading inventory...</td></tr>
            ) : products.length === 0 ? (
               <tr><td colSpan={3} className="p-8 text-center text-gray-500">No products synced yet. Save a product in Shopify to trigger sync.</td></tr>
            ) : (
              products.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium flex items-center gap-3">
                    <div className="h-8 w-8 bg-orange-100 rounded flex items-center justify-center text-orange-600">
                      <Package className="h-4 w-4" />
                    </div>
                    {p.title}
                  </td>
                  <td className="px-6 py-4 text-right font-medium">${p.price}</td>
                  <td className="px-6 py-4 text-right">
                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">Active</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}