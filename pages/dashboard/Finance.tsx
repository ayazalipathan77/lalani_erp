
import React, { useState, useEffect } from 'react';
import { Wallet, TrendingUp, TrendingDown, Plus, FileText, X, CheckCircle } from 'lucide-react';
import { api } from '../../services/api';
import { CashTransaction, Expense, Customer, Supplier } from '../../types';
import { formatTableDate } from '../../src/utils/dateUtils';

const Finance: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'overview' | 'expenses' | 'payments'>('overview');
    const [transactions, setTransactions] = useState<CashTransaction[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Modals
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    // Form Data
    const [expenseForm, setExpenseForm] = useState({ head_code: '', amount: 0, remarks: '', expense_date: new Date().toISOString().split('T')[0] });
    const [paymentForm, setPaymentForm] = useState({ type: 'RECEIPT', party_code: '', amount: 0, date: new Date().toISOString().split('T')[0], remarks: '' });

    // Lookup Data
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [trans, exps, custs, supps] = await Promise.all([
                api.finance.getTransactions(),
                api.finance.getExpenses(),
                api.customers.getAll(),
                api.suppliers.getAll()
            ]);
            setTransactions(trans);
            setExpenses(exps);
            setCustomers(custs);
            setSuppliers(supps);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreateExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.finance.addExpense(expenseForm);
            setShowExpenseModal(false);
            setExpenseForm({ head_code: '', amount: 0, remarks: '', expense_date: new Date().toISOString().split('T')[0] });
            fetchData();
        } catch (error) {
            console.error(error);
        }
    };

    const handleProcessPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.finance.addPayment(paymentForm as any);
            setShowPaymentModal(false);
            setPaymentForm({ type: 'RECEIPT', party_code: '', amount: 0, date: new Date().toISOString().split('T')[0], remarks: '' });
            fetchData();
        } catch (error) {
            console.error(error);
        }
    };

    // Stats - Convert string values to numbers for proper calculation
    const totalDebit = transactions.reduce((acc, t) => {
        const debit = typeof t.debit_amount === 'string' ? parseFloat(t.debit_amount) : Number(t.debit_amount);
        return acc + (isNaN(debit) ? 0 : debit);
    }, 0);

    const totalCredit = transactions.reduce((acc, t) => {
        const credit = typeof t.credit_amount === 'string' ? parseFloat(t.credit_amount) : Number(t.credit_amount);
        return acc + (isNaN(credit) ? 0 : credit);
    }, 0);

    const currentBalance = totalDebit - totalCredit;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Finance & Accounts</h1>
                    <p className="text-slate-500">Track cash flow, expenses, and ledger entries.</p>
                </div>
                <div className="flex space-x-2">
                    <button
                        onClick={() => setShowExpenseModal(true)}
                        className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg flex items-center hover:bg-slate-50 transition-colors shadow-sm"
                    >
                        <TrendingDown className="w-4 h-4 mr-2 text-red-500" />
                        Record Expense
                    </button>
                    <button
                        onClick={() => setShowPaymentModal(true)}
                        className="bg-brand-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-brand-700 transition-colors shadow-sm"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Payment / Receipt
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-200">
                <nav className="-mb-px flex space-x-8">
                    {['overview', 'expenses'].map((tab) => (
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
                                <span className="text-xs font-medium bg-white/20 px-2 py-1 rounded">Net Cash</span>
                            </div>
                            <p className="text-slate-300 text-sm">Current Balance</p>
                            <h3 className="text-3xl font-bold mt-1 font-mono">PKR {currentBalance.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                        </div>

                        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-green-50 rounded-lg">
                                    <TrendingUp className="w-6 h-6 text-green-600" />
                                </div>
                            </div>
                            <p className="text-slate-500 text-sm">Total Money In</p>
                            <h3 className="text-2xl font-bold mt-1 text-slate-900 font-mono">PKR {totalDebit.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                        </div>

                        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-red-50 rounded-lg">
                                    <TrendingDown className="w-6 h-6 text-red-600" />
                                </div>
                            </div>
                            <p className="text-slate-500 text-sm">Total Money Out</p>
                            <h3 className="text-2xl font-bold mt-1 text-slate-900 font-mono">PKR {totalCredit.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                        </div>
                    </div>

                    {/* Ledger Table */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-6 border-b border-slate-200">
                            <h3 className="text-lg font-bold text-slate-900">Transaction Ledger</h3>
                        </div>
                        {isLoading ? (
                            <div className="p-8 text-center text-slate-500">Loading ledger...</div>
                        ) : (
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
                                    {transactions.map((t) => (
                                        <tr key={t.trans_id} className="hover:bg-slate-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{formatTableDate(t.trans_date)}</td>
                                            <td className="px-6 py-4 text-sm text-slate-900">{t.description}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full
                                                ${t.trans_type === 'RECEIPT' || t.trans_type === 'SALES' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                                            `}>
                                                    {t.trans_type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-green-600">
                                                {(() => {
                                                    const debit = typeof t.debit_amount === 'string' ? parseFloat(t.debit_amount) : Number(t.debit_amount);
                                                    return debit > 0 ? debit.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-';
                                                })()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-red-600">
                                                {(() => {
                                                    const credit = typeof t.credit_amount === 'string' ? parseFloat(t.credit_amount) : Number(t.credit_amount);
                                                    return credit > 0 ? credit.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-';
                                                })()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
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
                            {expenses.map((exp) => (
                                <tr key={exp.expense_id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{formatTableDate(exp.expense_date, false)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{exp.head_code}</td>
                                    <td className="px-6 py-4 text-sm text-slate-500">{exp.remarks}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-slate-900">
                                        {(() => {
                                            const amount = typeof exp.amount === 'string' ? parseFloat(exp.amount) : Number(exp.amount);
                                            return amount.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                                        })()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* --- MODALS --- */}

            {/* Expense Modal */}
            {showExpenseModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                        <div className="flex justify-between items-center p-6 border-b border-slate-100">
                            <h3 className="text-xl font-bold text-slate-900">Record Expense</h3>
                            <button onClick={() => setShowExpenseModal(false)} className="text-slate-400"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleCreateExpense} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Expense Head</label>
                                <select
                                    required
                                    className="w-full border border-slate-300 rounded-lg p-2"
                                    value={expenseForm.head_code}
                                    onChange={e => setExpenseForm({ ...expenseForm, head_code: e.target.value })}
                                >
                                    <option value="">Select Category</option>
                                    <option value="FUEL">Fuel</option>
                                    <option value="UTIL">Utilities (Elec/Water)</option>
                                    <option value="RENT">Rent</option>
                                    <option value="MAINT">Maintenance</option>
                                    <option value="MISC">Miscellaneous</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Amount (PKR)</label>
                                <input
                                    type="number" required min="1"
                                    className="w-full border border-slate-300 rounded-lg p-2"
                                    value={expenseForm.amount}
                                    onChange={e => setExpenseForm({ ...expenseForm, amount: Number(e.target.value) })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                                <input
                                    type="date" required
                                    className="w-full border border-slate-300 rounded-lg p-2"
                                    value={expenseForm.expense_date}
                                    onChange={e => setExpenseForm({ ...expenseForm, expense_date: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Remarks</label>
                                <textarea
                                    required
                                    className="w-full border border-slate-300 rounded-lg p-2"
                                    rows={2}
                                    value={expenseForm.remarks}
                                    onChange={e => setExpenseForm({ ...expenseForm, remarks: e.target.value })}
                                />
                            </div>
                            <button type="submit" className="w-full bg-brand-600 text-white py-2 rounded-lg hover:bg-brand-700 mt-2">
                                Save Expense
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Payment Modal */}
            {showPaymentModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                        <div className="flex justify-between items-center p-6 border-b border-slate-100">
                            <h3 className="text-xl font-bold text-slate-900">Record Payment</h3>
                            <button onClick={() => setShowPaymentModal(false)} className="text-slate-400"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleProcessPayment} className="p-6 space-y-4">
                            <div className="flex space-x-4 mb-4">
                                <label className={`flex-1 border rounded-lg p-3 text-center cursor-pointer transition-colors ${paymentForm.type === 'RECEIPT'
                                    ? 'bg-green-50 border-green-500 text-green-700'
                                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                                    }`}>
                                    <input type="radio" name="ptype" className="hidden"
                                        checked={paymentForm.type === 'RECEIPT'}
                                        onChange={() => setPaymentForm({ ...paymentForm, type: 'RECEIPT', party_code: '' })}
                                    />
                                    <div className="font-bold">Receipt</div>
                                    <div className="text-xs">Money In (From Customer)</div>
                                </label>
                                <label className={`flex-1 border rounded-lg p-3 text-center cursor-pointer transition-colors ${paymentForm.type === 'PAYMENT'
                                    ? 'bg-red-50 border-red-500 text-red-700'
                                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                                    }`}>
                                    <input type="radio" name="ptype" className="hidden"
                                        checked={paymentForm.type === 'PAYMENT'}
                                        onChange={() => setPaymentForm({ ...paymentForm, type: 'PAYMENT', party_code: '' })}
                                    />
                                    <div className="font-bold">Payment</div>
                                    <div className="text-xs">Money Out (To Supplier)</div>
                                </label>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    {paymentForm.type === 'RECEIPT' ? 'Select Customer' : 'Select Supplier'}
                                </label>
                                <select
                                    required
                                    className="w-full border border-slate-300 rounded-lg p-2"
                                    value={paymentForm.party_code}
                                    onChange={e => setPaymentForm({ ...paymentForm, party_code: e.target.value })}
                                >
                                    <option value="">Select Party</option>
                                    {paymentForm.type === 'RECEIPT'
                                        ? customers.map(c => <option key={c.cust_code} value={c.cust_code}>{c.cust_name}</option>)
                                        : suppliers.map(s => <option key={s.supplier_code} value={s.supplier_code}>{s.supplier_name}</option>)
                                    }
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Amount (PKR)</label>
                                <input
                                    type="number" required min="1"
                                    className="w-full border border-slate-300 rounded-lg p-2"
                                    value={paymentForm.amount}
                                    onChange={e => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Description / Ref #</label>
                                <input
                                    type="text" required
                                    className="w-full border border-slate-300 rounded-lg p-2"
                                    value={paymentForm.remarks}
                                    onChange={e => setPaymentForm({ ...paymentForm, remarks: e.target.value })}
                                />
                            </div>

                            <button type="submit" className="w-full bg-brand-600 text-white py-2 rounded-lg hover:bg-brand-700 mt-2">
                                Process {paymentForm.type === 'RECEIPT' ? 'Receipt' : 'Payment'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Finance;
