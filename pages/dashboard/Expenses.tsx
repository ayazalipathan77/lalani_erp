import React, { useState, useEffect } from 'react';
import { Plus, Edit2 } from 'lucide-react';
import { useLoading } from '../../components/LoadingContext';
import { useCompany } from '../../components/CompanyContext';
import { api } from '../../services/api';
import { Expense, ExpenseHead } from '../../types';
import { formatTableDate } from '../../src/utils/dateUtils';
import MobileTable from '../../components/MobileTable';

const Expenses: React.FC = () => {
    const { selectedCompany } = useCompany();
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [expenseHeads, setExpenseHeads] = useState<ExpenseHead[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { showLoader, hideLoader } = useLoading();

    // Modal
    const [showModal, setShowModal] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

    // Form
    const [form, setForm] = useState({
        head_code: '',
        amount: 0,
        remarks: '',
        expense_date: new Date().toISOString().split('T')[0]
    });

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [expensesRes, headsRes] = await Promise.all([
                api.finance.getExpenses(1, 100),
                api.finance.getExpenseHeads()
            ]);
            setExpenses(expensesRes.data);
            setExpenseHeads(headsRes);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [selectedCompany]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            showLoader(editingExpense ? 'Updating expense...' : 'Creating expense...');
            if (editingExpense) {
                await api.finance.updateExpense(editingExpense.expense_id, form);
            } else {
                await api.finance.addExpense(form);
            }
            setShowModal(false);
            setEditingExpense(null);
            setForm({
                head_code: '',
                amount: 0,
                remarks: '',
                expense_date: new Date().toISOString().split('T')[0]
            });
            await fetchData();
        } catch (error) {
            console.error(error);
        } finally {
            hideLoader();
        }
    };

    const handleEdit = (expense: Expense) => {
        setEditingExpense(expense);
        setForm({
            head_code: expense.head_code,
            amount: expense.amount,
            remarks: expense.remarks,
            expense_date: expense.expense_date.split('T')[0]
        });
        setShowModal(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Expenses</h1>
                    <p className="text-slate-500">Manage business expenses and costs.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-brand-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-brand-700 transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    New Expense
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-200">
                    <h3 className="text-lg font-bold text-slate-900">Expense History</h3>
                </div>

                {isLoading ? (
                    <div className="p-8 text-center text-slate-500">Loading expenses...</div>
                ) : (
                    <>
                        <div className="overflow-x-auto hidden lg:block">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Head</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Remarks</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Amount</th>
                                        <th className="relative px-6 py-3">
                                            <span className="sr-only">Actions</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-200">
                                    {expenses.map((expense) => (
                                        <tr key={expense.expense_id} className="hover:bg-slate-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                {formatTableDate(expense.expense_date, false)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                                {expense.head_code}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-500">
                                                {expense.remarks}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-slate-900">
                                                PKR {expense.amount.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() => handleEdit(expense)}
                                                    className="text-slate-400 hover:text-brand-600 transition-colors"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <MobileTable
                            data={expenses}
                            columns={[
                                {
                                    key: 'expense_date',
                                    label: 'Date',
                                    render: (value) => formatTableDate(value, false)
                                },
                                {
                                    key: 'head_code',
                                    label: 'Head',
                                    render: (value) => (
                                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                            {value}
                                        </span>
                                    )
                                },
                                {
                                    key: 'remarks',
                                    label: 'Remarks'
                                },
                                {
                                    key: 'amount',
                                    label: 'Amount',
                                    render: (value) => `PKR ${value.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                }
                            ]}
                        />
                    </>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                        <div className="flex justify-between items-center p-6 border-b border-slate-100">
                            <h3 className="text-xl font-bold text-slate-900">
                                {editingExpense ? 'Edit Expense' : 'Record Expense'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400">
                                <Edit2 className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Expense Head</label>
                                <select
                                    required
                                    className="w-full border border-slate-300 rounded-lg p-2"
                                    value={form.head_code}
                                    onChange={e => setForm({ ...form, head_code: e.target.value })}
                                >
                                    <option value="">Select Category</option>
                                    {expenseHeads.map(head => (
                                        <option key={head.head_code} value={head.head_code}>
                                            {head.head_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Amount (PKR)</label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    step="0.01"
                                    className="w-full border border-slate-300 rounded-lg p-2"
                                    value={form.amount}
                                    onChange={e => setForm({ ...form, amount: Number(e.target.value) })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                                <input
                                    type="date"
                                    required
                                    className="w-full border border-slate-300 rounded-lg p-2"
                                    value={form.expense_date}
                                    onChange={e => setForm({ ...form, expense_date: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Remarks</label>
                                <textarea
                                    required
                                    className="w-full border border-slate-300 rounded-lg p-2"
                                    rows={2}
                                    value={form.remarks}
                                    onChange={e => setForm({ ...form, remarks: e.target.value })}
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-brand-600 text-white py-2 rounded-lg hover:bg-brand-700 mt-2"
                            >
                                {editingExpense ? 'Update Expense' : 'Record Expense'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Expenses;