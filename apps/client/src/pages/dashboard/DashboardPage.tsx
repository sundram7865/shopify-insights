import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { ShoppingBag, Users, DollarSign, TrendingUp, Bug, RefreshCcw, Calendar } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/axios';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { cn } from '../../lib/utils';
import type { StatsData, TopCustomer, CustomerSegment, SalesDataPoint } from '../../types';

interface DashboardData {
  stats: StatsData | null;
  sales: SalesDataPoint[];
  top: TopCustomer[];
  segments: CustomerSegment | null;
}

const StatCard = ({ title, value, icon: Icon, colorClass }: any) => (
  <Card className={cn("p-6 flex flex-col justify-between h-32 border-l-4", colorClass)}>
    <div className="flex justify-between items-start">
      <div className="h-10 w-10 rounded-lg bg-gray-50 flex items-center justify-center">
        <Icon className="h-5 w-5 text-gray-700" />
      </div>
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

type DateRange = '7d' | '30d' | '90d' | '12m' | 'all';

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData>({ stats: null, sales: [], top: [], segments: null });
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>('30d');

  const getDateParams = (range: DateRange) => {
    const now = new Date();
    const start = new Date();
    
    switch (range) {
      case '7d': start.setDate(now.getDate() - 7); break;
      case '30d': start.setDate(now.getDate() - 30); break;
      case '90d': start.setDate(now.getDate() - 90); break;
      case '12m': start.setMonth(now.getMonth() - 12); break;
      case 'all': return { range: 'all', startDate: '2000-01-01' };
    }
    
    return { range, startDate: start.toISOString().split('T')[0] };
  };

  const fetchData = useCallback(async (background = false) => {
    if (!user?.tenantId) return;
    if (!background) setIsRefreshing(true);

    try {
      const { range, startDate } = getDateParams(dateRange);
      const q = `?tenantId=${user.tenantId}&range=${range}&startDate=${startDate}`;
      
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
  }, [user?.tenantId, dateRange]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 30000); // Increased poll time slightly
    return () => clearInterval(interval);
  }, [fetchData]);

  const isEmpty = !loading && (!data.stats || (data.stats.totalRevenue === 0 && data.top.length === 0));
  
  // Process chart data to ensure we always show a trend line
  const chartData = useMemo(() => {
    const rawData = data.sales || [];
    if (rawData.length === 1) {
      const firstPoint = rawData[0];
      const prevDate = new Date(firstPoint.date);
      prevDate.setDate(prevDate.getDate() - 1);
      const prevDateStr = prevDate.toISOString().split('T')[0];
      return [{ date: prevDateStr, sales: 0 }, firstPoint];
    }
    return rawData;
  }, [data.sales]);

  const pieData = [
    { name: 'New', value: data.segments?.newCustomers || 0, color: '#3b82f6' },
    { name: 'Returning', value: data.segments?.returningCustomers || 0, color: '#10b981' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm">Real-time store analytics</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as DateRange)}
              className="pl-9 pr-8 h-10 w-40 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none cursor-pointer"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="12m">Last 12 Months</option>
              <option value="all">All Time</option>
            </select>
            <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-500 pointer-events-none" />
          </div>

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
            <StatCard title="Total Revenue" value={data.stats ? `$${data.stats.totalRevenue.toLocaleString()}` : '$0'} icon={DollarSign} colorClass="border-l-blue-500" />
            <StatCard title="Total Orders" value={data.stats?.totalOrders || 0} icon={ShoppingBag} colorClass="border-l-indigo-500" />
            <StatCard title="Avg Order Value" value={data.stats ? `$${data.stats.averageOrderValue}` : '$0'} icon={TrendingUp} colorClass="border-l-emerald-500" />
            <StatCard title="Active Customers" value={data.stats?.totalCustomers || 0} icon={Users} colorClass="border-l-purple-500" />
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <Card className="col-span-2 p-6 h-[400px]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-semibold">Revenue Trend</h3>
                <span className="text-xs text-gray-400 font-medium px-2 py-1 bg-gray-100 rounded">
                  {dateRange === 'all' ? 'All Time' : `Last ${dateRange.replace('d', ' Days').replace('m', ' Months')}`}
                </span>
              </div>
              <ResponsiveContainer width="100%" height="90%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                  <YAxis tick={{fontSize: 12}} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                  <Tooltip 
                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'Sales']}
                    labelStyle={{ color: '#6b7280' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="sales" 
                    stroke="#2563eb" 
                    strokeWidth={3} 
                    dot={{ r: 4, strokeWidth: 2 }}
                    activeDot={{ r: 6 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-6 h-[400px] flex flex-col">
              <h3 className="font-semibold mb-2">Retention</h3>
              <div className="flex-1 relative min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      data={pieData} 
                      innerRadius={60} 
                      outerRadius={80} 
                      paddingAngle={5} 
                      dataKey="value"
                    >
                      {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" />
                  </PieChart>
                </ResponsiveContainer>
                
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-6">
                  <span className="text-3xl font-bold">{data.segments?.repeatRate || 0}%</span>
                  <p className="text-xs text-gray-500">Rate</p>
                </div>
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
                {data.top.map((c: any, i: number) => (
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
          <pre>{JSON.stringify({ dateRange, data }, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}