import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { DollarSign, ShoppingBag, Users, TrendingUp, AlertCircle, ArrowRight, Package, CreditCard, Target, Activity } from 'lucide-react';
import { api } from '../../services/api';
import { SalesInvoice, Customer, Product } from '../../types';
import { formatTableDate } from '../../src/utils/dateUtils';

const DashboardHome: React.FC = () => {
  const navigate = useNavigate();

  // State for analytics data
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [salesTrends, setSalesTrends] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch analytics data from API
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [metricsData, trendsData] = await Promise.all([
          api.analytics.getDashboardMetrics(),
          api.analytics.getSalesTrends()
        ]);
        setAnalyticsData(metricsData);
        setSalesTrends(trendsData);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Use analytics data for metrics
  const totalRevenue = analyticsData?.totalRevenue || 0;
  const pendingAmount = analyticsData?.pendingReceivables || 0;
  const lowStockCount = analyticsData?.lowStockCount || 0;
  const customerCount = analyticsData?.customerCount || 0;

  // Calculate additional metrics
  const averageOrderValue = analyticsData?.recentInvoices?.length > 0
    ? totalRevenue / analyticsData.recentInvoices.length
    : 0;

  // Calculate monthly growth with proper handling
  const monthlyGrowth = (() => {
    if (salesTrends.length < 2) return 0;

    const currentMonth = salesTrends[salesTrends.length - 1]?.sales || 0;
    const previousMonth = salesTrends[salesTrends.length - 2]?.sales || 0;

    if (previousMonth === 0) {
      return currentMonth > 0 ? 100 : 0; // If no previous sales but current sales exist
    }

    const growth = ((currentMonth - previousMonth) / previousMonth) * 100;

    // Cap extreme values for display
    if (growth > 1000) return 1000; // Cap at 1000%
    if (growth < -1000) return -1000; // Cap at -1000%

    return growth;
  })();

  // Prepare chart data
  const salesData = salesTrends;
  const topProductsData = (analyticsData?.topProducts?.slice(0, 5) || []).map((product: any) => ({
    ...product,
    prod_name: product.prod_name.length > 8
      ? product.prod_name.substring(0, 8) + '...'
      : product.prod_name
  }));

  // Filter and convert sales by category data
  const salesByCategoryData = (analyticsData?.salesByCategory || [])
    .filter((item: any) => parseFloat(item.category_revenue) > 0)
    .map((item: any) => ({
      ...item,
      category_revenue: parseFloat(item.category_revenue)
    }));

  // Colors for pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  // Utility function to format large numbers
  const formatNumber = (num: number): string => {
    if (num >= 1000000000) {
      return `PKR ${(num / 1000000000).toFixed(1)}B`;
    } else if (num >= 1000000) {
      return `PKR ${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `PKR ${(num / 1000).toFixed(1)}K`;
    } else {
      return `PKR ${num.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    }
  };

  // Format percentage with proper display
  const formatPercentage = (percent: number): string => {
    if (Math.abs(percent) >= 1000) {
      return `${percent > 0 ? '+' : ''}${percent > 0 ? '999%+' : '-999%'}`;
    }
    return `${percent >= 0 ? '+' : ''}${percent.toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>
        <p className="text-slate-500">Welcome back, Admin. Here is your daily distribution summary.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-brand-50 rounded-lg">
              <DollarSign className="w-6 h-6 text-brand-600" />
            </div>
            <span className={`text-sm font-medium flex items-center ${monthlyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              <TrendingUp className={`w-3 h-3 mr-1 ${monthlyGrowth < 0 ? 'rotate-180' : ''}`} />
              {formatPercentage(monthlyGrowth)}
            </span>
          </div>
          <h3 className="text-slate-500 text-sm font-medium">Total Revenue</h3>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {isLoading ? '...' : formatNumber(totalRevenue)}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <h3 className="text-slate-500 text-sm font-medium">Active Vendors</h3>
          <p className="text-2xl font-bold text-slate-900 mt-1">{customerCount}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-amber-50 rounded-lg">
              <AlertCircle className="w-6 h-6 text-amber-600" />
            </div>
            <span className="text-amber-600 text-sm font-medium">Action Needed</span>
          </div>
          <h3 className="text-slate-500 text-sm font-medium">Low Stock Items</h3>
          <p className="text-2xl font-bold text-slate-900 mt-1">{lowStockCount}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-50 rounded-lg">
              <CreditCard className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <h3 className="text-slate-500 text-sm font-medium">Pending Receivables</h3>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {isLoading ? '...' : formatNumber(pendingAmount)}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-50 rounded-lg">
              <Target className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
          <h3 className="text-slate-500 text-sm font-medium">Avg Order Value</h3>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {isLoading ? '...' : formatNumber(averageOrderValue)}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-50 rounded-lg">
              <Activity className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <h3 className="text-slate-500 text-sm font-medium">Monthly Growth</h3>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {isLoading ? '...' : formatPercentage(monthlyGrowth)}
          </p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        {/* Sales Trends */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 xl:col-span-2">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Sales Trends (6 Months)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#0f172a' }}
                />
                <Area type="monotone" dataKey="sales" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sales by Category Pie Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Sales by Category</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={salesByCategoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category_name, percent }) => {
                    const shortName = category_name.split(' ')[0]; // Take first word
                    return `${shortName} ${(percent * 100).toFixed(0)}%`;
                  }}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="category_revenue"
                >
                  {salesByCategoryData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    fontSize: '12px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products Bar Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Top Products by Revenue</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProductsData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="prod_name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    fontSize: '12px'
                  }}
                  formatter={(value: any) => [formatNumber(Number(value)), 'Revenue']}
                />
                <Bar dataKey="total_revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Invoices Table */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Recent Invoices</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider py-3">Invoice</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider py-3">Date</th>
                  <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider py-3">Amount</th>
                  <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500">
                      Loading recent invoices...
                    </td>
                  </tr>
                ) : (analyticsData?.recentInvoices || []).slice(0, 5).map((invoice: any) => (
                  <tr key={invoice.inv_id} className="hover:bg-slate-50">
                    <td className="py-3 text-sm font-medium text-slate-900">{invoice.inv_number}</td>
                    <td className="py-3 text-sm text-slate-500">{formatTableDate(invoice.inv_date)}</td>
                    <td className="py-3 text-sm text-right font-mono text-slate-900">
                      {(() => {
                        const amount = typeof invoice.total_amount === 'string' ? parseFloat(invoice.total_amount) : Number(invoice.total_amount);
                        return amount.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
                      })()}
                    </td>
                    <td className="py-3 text-center">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full
                        ${invoice.status === 'PAID' ? 'bg-green-100 text-green-800' :
                          invoice.status === 'PENDING' ? 'bg-blue-100 text-blue-800' :
                            'bg-red-100 text-red-800'}`}>
                        {invoice.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 text-center">
            <Link
              to="/dashboard/sales"
              className="text-brand-600 hover:text-brand-700 text-sm font-medium hover:underline inline-flex items-center"
            >
              View All Invoices <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;