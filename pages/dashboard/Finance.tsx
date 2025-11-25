import React, { useState } from 'react';
import { Wallet, TrendingUp, TrendingDown, Plus, FileText, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { mockCashTransactions, mockExpenses } from '../../services/mockData';

const Finance: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'expenses' | 'payments'>('overview');

  // Calculate simulated balance
  const totalDebit = mockCashTransactions.reduce((acc, t) => acc + t.debit_amount, 0);
  const totalCredit = mockCashTransactions.reduce((acc, t) => acc + t.credit_amount, 0);
  const currentBalance = totalDebit - totalCredit;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Finance & Accounts</h1>
          <p className="text-slate-500">Track cash flow, expenses, and ledger entries.</p>
        </div>
        <div className="flex space-x-2">
             <button className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg flex items-center hover:bg-slate-50 transition-colors shadow-sm">
                <TrendingDown className="w-4 h-4 mr-2 text-red-500" />
                Record Expense
            </button>
            <button className="bg-brand-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-brand-700 transition-colors shadow-sm">
                <Plus className="w-4 h-4 mr-2" />
                Receive Payment
            </button>
        </div>
      </div>

       {/* Tabs */}
       <div className="border-b border-slate-200">
          <nav className="-mb-px flex space-x-8">
            {['overview', 'expenses', 'payments'].map((tab) => (
               <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize transition-colors
                  ${activeTab === tab
                    ? 'border-brand-600 text-brand-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}
                `}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {activeTab === 'overview' && (
            <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 text-white shadow-lg">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-white/10 rounded-lg">
                                <Wallet className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xs font-medium bg-white/20 px-2 py-1 rounded">Today</span>
                        </div>
                        <p className="text-slate-300 text-sm">Current Cash Balance</p>
                        <h3 className="text-3xl font-bold mt-1 font-mono">PKR {currentBalance.toLocaleString()}</h3>
                    </div>

                    <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-green-50 rounded-lg">
                                <TrendingUp className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                        <p className="text-slate-500 text-sm">Total In (This Month)</p>
                        <h3 className="text-2xl font-bold mt-1 text-slate-900 font-mono">PKR {totalDebit.toLocaleString()}</h3>
                    </div>

                    <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-red-50 rounded-lg">
                                <TrendingDown className="w-6 h-6 text-red-600" />
                            </div>
                        </div>
                        <p className="text-slate-500 text-sm">Total Out (This Month)</p>
                        <h3 className="text-2xl font-bold mt-1 text-slate-900 font-mono">PKR {totalCredit.toLocaleString()}</h3>
                    </div>
                </div>

                {/* Ledger Table */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-200">
                        <h3 className="text-lg font-bold text-slate-900">Recent Transactions</h3>
                    </div>
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Description</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Type</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Debit (In)</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Credit (Out)</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {mockCashTransactions.map((t) => (
                                <tr key={t.trans_id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{t.trans_date}</td>
                                    <td className="px-6 py-4 text-sm text-slate-900">{t.description}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full
                                            ${t.trans_type === 'RECEIPT' || t.trans_type === 'SALES' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                                        `}>
                                            {t.trans_type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-green-600">
                                        {t.debit_amount > 0 ? t.debit_amount.toLocaleString() : '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-red-600">
                                        {t.credit_amount > 0 ? t.credit_amount.toLocaleString() : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {activeTab === 'expenses' && (
             <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                 <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-900">Expense History</h3>
                </div>
                <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Head</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Remarks</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {mockExpenses.map((exp) => (
                                <tr key={exp.expense_id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{exp.expense_date}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{exp.head_code}</td>
                                    <td className="px-6 py-4 text-sm text-slate-500">{exp.remarks}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-slate-900">{exp.amount.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
             </div>
        )}

        {activeTab === 'payments' && (
             <div className="p-12 text-center border-2 border-dashed border-slate-300 rounded-xl">
                 <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                 <h3 className="text-lg font-medium text-slate-900">Payments Module</h3>
                 <p className="text-slate-500 mt-2">Manage customer receipts and supplier payments here.</p>
                 <button className="mt-4 text-brand-600 hover:text-brand-700 font-medium">Create New Payment Record</button>
             </div>
        )}

    </div>
  );
};

export default Finance;