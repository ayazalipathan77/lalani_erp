import React from 'react';
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
import { DollarSign, ShoppingBag, Users, TrendingUp, AlertCircle } from 'lucide-react';
import { salesData, mockInvoices, mockCustomers, mockProducts } from '../../services/mockData';

const DashboardHome: React.FC = () => {
  const totalRevenue = mockInvoices.reduce((acc, curr) => acc + curr.total_amount, 0);
  const pendingAmount = mockInvoices.filter(i => i.status !== 'PAID').reduce((acc, curr) => acc + curr.balance_due, 0);
  const lowStockCount = mockProducts.filter(p => p.current_stock <= p.min_stock_level).length;

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
          <p className="text-2xl font-bold text-slate-900 mt-1">PKR {totalRevenue.toLocaleString()}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <h3 className="text-slate-500 text-sm font-medium">Active Vendors</h3>
          <p className="text-2xl font-bold text-slate-900 mt-1">{mockCustomers.length}</p>
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
          <p className="text-2xl font-bold text-slate-900 mt-1">PKR {pendingAmount.toLocaleString()}</p>
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
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
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
                {mockInvoices.slice(0, 5).map((invoice) => (
                  <tr key={invoice.inv_id} className="hover:bg-slate-50">
                    <td className="py-3 text-sm font-medium text-slate-900">{invoice.inv_number}</td>
                    <td className="py-3 text-sm text-slate-500">{invoice.cust_code}</td>
                    <td className="py-3 text-sm text-right font-mono text-slate-900">{invoice.total_amount.toLocaleString()}</td>
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
            <button className="text-brand-600 hover:text-brand-700 text-sm font-medium">View All Invoices</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;