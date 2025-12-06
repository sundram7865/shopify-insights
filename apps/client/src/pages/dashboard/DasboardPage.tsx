import  { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { LayoutDashboard, LogOut, ShoppingBag, Users, DollarSign, TrendingUp, Bug, RefreshCcw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/axios';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { cn } from '../../lib/utils';
import type { StatsData, TopCustomer, CustomerSegment, SalesDataPoint } from '../../types';

// Interfaces for component state to ensure type safety
interface DashboardData {
  stats: StatsData | null;
  sales: SalesDataPoint[];
  top: TopCustomer[];
  segments: CustomerSegment | null;
}

const StatCard = ({ title, value, icon: Icon, trend }: any) => (
  <Card className="p-6 flex flex-col justify-between h-32 border-l-4 border-l-blue-500">
    <div className="flex justify-between items-start">
      <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
        <Icon className="h-5 w-5" />
      </div>
      <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-md">{trend}</span>
    </div>
    <div>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <h3 className="text-2xl font-bold tracking-tight text-gray-900 mt-1">{value}</h3>
    </div>
  </Card>
);

const EmptyState = () => (
  <div className="col-span-full py-16 text-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
    <h3 className="text-lg font-semibold text-gray-900">Waiting for Data</h3>
    <p className="text-gray-500 mt-1">Create an order in Shopify to see it here.</p>
  </div>
);

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [data, setData] = useState<DashboardData>({ stats: null, sales: [], top: [], segments: null });
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  const fetchData = useCallback(async (background = false) => {
    if (!user?.tenantId) return;
    if (!background) setIsRefreshing(true);

    try {
      // NOTE: Added date parameters to ensure we fetch historical data if backend filters default to 30 days
      const q = `?tenantId=${user.tenantId}&range=all&startDate=2000-01-01`;
      const [stats, sales, top, segments] = await Promise.all([
        api.get(`/analytics/stats${q}`),
        api.get(`/analytics/sales-over-time${q}`),
        api.get(`/analytics/top-customers${q}`),
        api.get(`/analytics/customer-segments${q}`)
      ]);

      setData({
        stats: stats.data,
        sales: sales.data || [],
        top: top.data || [],
        segments: segments.data
      });
    } catch (e) { 
      console.error(e); 
    } finally { 
      setLoading(false); 
      setIsRefreshing(false); 
    }
  }, [user?.tenantId]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Handle empty or null stats gracefully
  const isEmpty = !loading && (!data.stats || (data.stats.totalRevenue === 0 && data.top.length === 0));
  
  const pieData = [
    { name: 'New', value: data.segments?.newCustomers || 0, color: '#3b82f6' },
    { name: 'Returning', value: data.segments?.returningCustomers || 0, color: '#10b981' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-white border-r border-gray-200 fixed h-full hidden lg:block z-10">
        <div className="p-6 border-b border-gray-100 flex items-center gap-2">
          <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">X</div>
          <span className="font-bold text-lg">XenoFDE</span>
        </div>
        <nav className="p-4 space-y-1">
          <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-700 rounded-lg font-medium border border-blue-100">
            <LayoutDashboard className="h-5 w-5" /> Overview
          </div>
        </nav>
        <div className="absolute bottom-0 w-full p-4 border-t border-gray-100">
          <div className="mb-4 px-2">
            <p className="text-sm font-medium truncate">{user?.email}</p>
            <p className="text-xs text-gray-400 truncate">ID: {user?.tenantId.slice(0,8)}...</p>
          </div>
          <Button variant="outline" onClick={logout} className="w-full text-red-600 hover:bg-red-50 border-red-100 justify-start">
            <LogOut className="h-4 w-4 mr-2" /> Sign Out
          </Button>
        </div>
      </aside>

      <main className="flex-1 lg:ml-64 p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500 text-sm">Real-time store analytics</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowDebug(!showDebug)}>
              <Bug className="h-4 w-4 mr-2" /> Debug
            </Button>
            <Button variant="outline" onClick={() => fetchData(false)} disabled={isRefreshing}>
              <RefreshCcw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} /> Refresh
            </Button>
          </div>
        </div>

        {isEmpty ? <EmptyState /> : (
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-4">
              <StatCard title="Revenue" value={data.stats ? `$${data.stats.totalRevenue.toLocaleString()}` : '$0'} icon={DollarSign} trend="+12%" />
              <StatCard title="Orders" value={data.stats?.totalOrders || 0} icon={ShoppingBag} trend="+5%" />
              <StatCard title="Customers" value={data.stats?.totalCustomers || 0} icon={Users} trend="+8%" />
              <StatCard title="AOV" value={data.stats ? `$${data.stats.averageOrderValue}` : '$0'} icon={TrendingUp} trend="+2%" />
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <Card className="col-span-2 p-6 h-[400px]">
                <h3 className="font-semibold mb-6">Revenue Trend</h3>
                <ResponsiveContainer width="100%" height="90%">
                  <LineChart data={data.sales}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                    <YAxis tick={{fontSize: 12}} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                    <Tooltip />
                    <Line type="monotone" dataKey="sales" stroke="#2563eb" strokeWidth={3} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </Card>

              <Card className="p-6 h-[400px] flex flex-col items-center justify-center">
                <h3 className="font-semibold w-full text-left mb-4">Retention</h3>
                <ResponsiveContainer width="100%" height="80%">
                  <PieChart>
                    <Pie data={pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" />
                  </PieChart>
                </ResponsiveContainer>
                <div className="text-center -mt-24 mb-12">
                  <span className="text-3xl font-bold">{data.segments?.repeatRate || 0}%</span>
                  <p className="text-xs text-gray-500">Rate</p>
                </div>
              </Card>
            </div>

            <Card className="overflow-hidden">
              <div className="p-6 border-b border-gray-100 font-semibold">Top Customers</div>
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="px-6 py-3">Email</th>
                    <th className="px-6 py-3">Orders</th>
                    <th className="px-6 py-3 text-right">Spent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.top.map((c, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-blue-600">{c.email}</td>
                      <td className="px-6 py-4">{c.orders}</td>
                      <td className="px-6 py-4 text-right font-bold">${c.totalSpent}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        )}

        {showDebug && (
          <div className="mt-8 p-4 bg-slate-900 text-slate-300 rounded-lg text-xs font-mono">
            <pre>{JSON.stringify(data, null, 2)}</pre>
          </div>
        )}
      </main>
    </div>
  );
}