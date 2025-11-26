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
  Area
} from 'recharts';
import { DollarSign, ShoppingBag, Users, TrendingUp, AlertCircle, ArrowRight } from 'lucide-react';
import { api } from '../../services/api';
import { SalesInvoice, Customer, Product } from '../../types';
import { formatTableDate } from '../../src/utils/dateUtils';

const DashboardHome: React.FC = () => {
  const navigate = useNavigate();

  // State for real data
  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch real data from API
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [invData, custData, prodData] = await Promise.all([
          api.invoices.getAll(),
          api.customers.getAll(),
          api.products.getAll()
        ]);
        setInvoices(invData);
        setCustomers(custData);
        setProducts(prodData);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Calculate metrics from real data
  const totalRevenue = invoices.reduce((acc, curr) => {
    const amount = typeof curr.total_amount === 'string' ? parseFloat(curr.total_amount) : Number(curr.total_amount);
    return acc + (isNaN(amount) ? 0 : amount);
  }, 0);

  const pendingAmount = invoices.filter(i => i.status !== 'PAID').reduce((acc, curr) => {
    const balance = typeof curr.balance_due === 'string' ? parseFloat(curr.balance_due) : Number(curr.balance_due);
    return acc + (isNaN(balance) ? 0 : balance);
  }, 0);

  const lowStockCount = products.filter(p => {
    const currentStock = typeof p.current_stock === 'string' ? parseFloat(p.current_stock) : Number(p.current_stock);
    const minStock = typeof p.min_stock_level === 'string' ? parseFloat(p.min_stock_level) : Number(p.min_stock_level);
    return currentStock <= minStock;
  }).length;

  // Create sales chart data from real invoices (last 6 months)
  const salesData = (() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentDate = new Date();
    const chartData = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthName = months[date.getMonth()];
      const year = date.getFullYear();

      // Filter invoices for this month
      const monthInvoices = invoices.filter(inv => {
        const invDate = new Date(inv.inv_date);
        return invDate.getMonth() === date.getMonth() && invDate.getFullYear() === year;
      });

      // Calculate total sales for this month
      const monthSales = monthInvoices.reduce((sum, inv) => {
        const amount = typeof inv.total_amount === 'string' ? parseFloat(inv.total_amount) : Number(inv.total_amount);
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);

      chartData.push({
        name: monthName,
        sales: Math.round(monthSales)
      });
    }

    return chartData;
  })();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>
        <p className="text-slate-500">Welcome back, Admin. Here is your daily distribution summary.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-brand-50 rounded-lg">
              <DollarSign className="w-6 h-6 text-brand-600" />
            </div>
            <span className="text-green-600 text-sm font-medium flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" /> +12.5%
            </span>
          </div>
          <h3 className="text-slate-500 text-sm font-medium">Total Revenue</h3>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {isLoading ? '...' : `PKR ${totalRevenue.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <h3 className="text-slate-500 text-sm font-medium">Active Vendors</h3>
          <p className="text-2xl font-bold text-slate-900 mt-1">{customers.length}</p>
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
              <ShoppingBag className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <h3 className="text-slate-500 text-sm font-medium">Pending Receivables</h3>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {isLoading ? '...' : `PKR ${pendingAmount.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          </p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
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

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Recent Invoices</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider py-3">Invoice</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider py-3">Customer</th>
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
                ) : invoices.slice(0, 5).map((invoice) => (
                  <tr key={invoice.inv_id} className="hover:bg-slate-50">
                    <td className="py-3 text-sm font-medium text-slate-900">{invoice.inv_number}</td>
                    <td className="py-3 text-sm text-slate-500">{formatTableDate(invoice.inv_date)}</td>
                    <td className="py-3 text-sm text-slate-500">{invoice.cust_code}</td>
                    <td className="py-3 text-sm text-right font-mono text-slate-900">
                      {(() => {
                        const amount = typeof invoice.total_amount === 'string' ? parseFloat(invoice.total_amount) : Number(invoice.total_amount);
                        return amount.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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