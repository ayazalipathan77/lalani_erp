import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useLoading } from '../../components/LoadingContext';
import { useNotification } from '../../components/NotificationContext';
import { useCompany } from '../../components/CompanyContext';
import { api } from '../../services/api';
import { ExpenseHead } from '../../types';
import MobileTable from '../../components/MobileTable';

const ExpenseHeads: React.FC = () => {
    const { selectedCompany } = useCompany();
    const [expenseHeads, setExpenseHeads] = useState<ExpenseHead[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { showLoader, hideLoader } = useLoading();
    const { showNotification } = useNotification();

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [editingHead, setEditingHead] = useState<ExpenseHead | null>(null);

    // Form data
    const [formData, setFormData] = useState({
        head_code: '',
        head_name: '',
        description: ''
    });

    const fetchExpenseHeads = async () => {
        setIsLoading(true);
        try {
            const response = await api.expenseHeads.getAll();
            setExpenseHeads(response);
        } catch (error) {
            console.error('Failed to fetch expense heads:', error);
            showNotification('Failed to load expense heads', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchExpenseHeads();
    }, [selectedCompany]); // Refetch when company changes

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            showLoader(editingHead ? 'Updating expense head...' : 'Creating expense head...');

            if (editingHead) {
                await api.expenseHeads.update(editingHead.head_code, {
                    head_name: formData.head_name,
                    description: formData.description
                });
                showNotification('Expense head updated successfully!', 'success');
            } else {
                await api.expenseHeads.create(formData);
                showNotification('Expense head created successfully!', 'success');
            }

            setShowModal(false);
            setEditingHead(null);
            setFormData({ head_code: '', head_name: '', description: '' });
            await fetchExpenseHeads();
        } catch (error: any) {
            console.error('Failed to save expense head:', error);
            showNotification(error.message || 'Failed to save expense head', 'error');
        } finally {
            hideLoader();
        }
    };

    const handleEdit = (head: ExpenseHead) => {
        setEditingHead(head);
        setFormData({
            head_code: head.head_code,
            head_name: head.head_name,
            description: head.description
        });
        setShowModal(true);
    };

    const handleDelete = async (head: ExpenseHead) => {
        if (!confirm(`Are you sure you want to deactivate "${head.head_name}"? This will prevent it from being used in new expenses.`)) {
            return;
        }

        try {
            showLoader('Deactivating expense head...');
            await api.expenseHeads.delete(head.head_code);
            showNotification('Expense head deactivated successfully!', 'success');
            await fetchExpenseHeads();
        } catch (error: any) {
            console.error('Failed to deactivate expense head:', error);
            showNotification(error.message || 'Failed to deactivate expense head', 'error');
        } finally {
            hideLoader();
        }
    };

    const handleToggleStatus = async (head: ExpenseHead) => {
        try {
            showLoader('Updating expense head status...');
            const newStatus = !head.is_active;
            if (newStatus) {
                // Reactivating - we need to update the head
                await api.expenseHeads.update(head.head_code, {
                    head_name: head.head_name,
                    description: head.description
                });
                showNotification('Expense head activated successfully!', 'success');
            } else {
                // Deactivating - use delete endpoint
                await api.expenseHeads.delete(head.head_code);
                showNotification('Expense head deactivated successfully!', 'success');
            }
            await fetchExpenseHeads();
        } catch (error: any) {
            console.error('Failed to update expense head status:', error);
            showNotification(error.message || 'Failed to update status', 'error');
        } finally {
            hideLoader();
        }
    };

    const resetForm = () => {
        setFormData({ head_code: '', head_name: '', description: '' });
        setEditingHead(null);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Expense Heads</h1>
                    <p className="text-slate-500">Manage expense categories for financial tracking.</p>
                </div>
                <button
                    onClick={() => {
                        resetForm();
                        setShowModal(true);
                    }}
                    className="bg-brand-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-brand-700 transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Expense Head
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-200">
                    <h3 className="text-lg font-bold text-slate-900">Expense Categories</h3>
                    <p className="text-slate-500 text-sm mt-1">Configure expense categories used throughout the system.</p>
                </div>

                {isLoading ? (
                    <div className="p-8 text-center text-slate-500">Loading expense heads...</div>
                ) : expenseHeads.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">
                        <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                        <p>No expense heads found.</p>
                        <p className="text-sm mt-1">Create your first expense category to get started.</p>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table View */}
                        <div className="hidden lg:block overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Code</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Description</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">Status</th>
                                        <th className="relative px-6 py-3">
                                            <span className="sr-only">Actions</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-200">
                                    {expenseHeads.map((head) => (
                                        <tr key={head.head_code} className="hover:bg-slate-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-brand-600">
                                                {head.head_code}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                                {head.head_name}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate">
                                                {head.description}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full
                                                    ${head.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                    {head.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex items-center justify-end space-x-2">
                                                    <button
                                                        onClick={() => handleEdit(head)}
                                                        className="text-slate-400 hover:text-brand-600 transition-colors"
                                                        title="Edit Expense Head"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleToggleStatus(head)}
                                                        className={`transition-colors ${head.is_active
                                                            ? 'text-green-400 hover:text-green-600'
                                                            : 'text-red-400 hover:text-red-600'
                                                            }`}
                                                        title={head.is_active ? 'Deactivate' : 'Activate'}
                                                    >
                                                        {head.is_active ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                                    </button>
                                                    {head.is_active && (
                                                        <button
                                                            onClick={() => handleDelete(head)}
                                                            className="text-red-400 hover:text-red-600 transition-colors"
                                                            title="Deactivate Expense Head"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Table View */}
                        <MobileTable
                            data={expenseHeads}
                            columns={[
                                {
                                    key: 'head_code',
                                    label: 'Code',
                                    render: (value) => <span className="font-medium text-brand-600">{value}</span>
                                },
                                {
                                    key: 'head_name',
                                    label: 'Name',
                                    render: (value) => <span className="font-medium">{value}</span>
                                },
                                {
                                    key: 'description',
                                    label: 'Description',
                                    render: (value) => <span className="text-sm text-slate-500 truncate max-w-32 block">{value}</span>
                                },
                                {
                                    key: 'is_active',
                                    label: 'Status',
                                    render: (value) => (
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full
                                            ${value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {value ? 'Active' : 'Inactive'}
                                        </span>
                                    )
                                }
                            ]}
                        />
                    </>
                )}
            </div>

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                        <div className="flex justify-between items-center p-6 border-b border-slate-100">
                            <h3 className="text-xl font-bold text-slate-900">
                                {editingHead ? 'Edit Expense Head' : 'Add Expense Head'}
                            </h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleCreate} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Head Code *
                                </label>
                                <input
                                    type="text"
                                    required
                                    maxLength={20}
                                    className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                                    placeholder="e.g., FUEL, RENT, MAINT"
                                    value={formData.head_code}
                                    onChange={(e) => setFormData({ ...formData, head_code: e.target.value.toUpperCase() })}
                                    disabled={!!editingHead} // Can't change code when editing
                                />
                                <p className="text-xs text-slate-500 mt-1">
                                    Unique code identifier (max 20 characters)
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Head Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    maxLength={100}
                                    className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                                    placeholder="e.g., Fuel Expenses, Office Rent"
                                    value={formData.head_name}
                                    onChange={(e) => setFormData({ ...formData, head_name: e.target.value })}
                                />
                                <p className="text-xs text-slate-500 mt-1">
                                    Display name for the expense category
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Description
                                </label>
                                <textarea
                                    maxLength={255}
                                    rows={3}
                                    className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                                    placeholder="Optional description of this expense category"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                                <p className="text-xs text-slate-500 mt-1">
                                    Optional description (max 255 characters)
                                </p>
                            </div>

                            <div className="flex space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 bg-slate-100 text-slate-700 py-2.5 px-4 rounded-lg hover:bg-slate-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-brand-600 text-white py-2.5 px-4 rounded-lg hover:bg-brand-700 transition-colors"
                                >
                                    {editingHead ? 'Update Head' : 'Create Head'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExpenseHeads;