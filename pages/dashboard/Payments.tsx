import React, { useState, useEffect } from 'react';
import { Plus, Edit2, FileText } from 'lucide-react';
import { useLoading } from '../../components/LoadingContext';
import { useCompany } from '../../components/CompanyContext';
import { api } from '../../services/api';
import { SupplierPayment, Supplier } from '../../types';
import { formatTableDate } from '../../src/utils/dateUtils';
import MobileTable from '../../components/MobileTable';

const Payments: React.FC = () => {
    const { selectedCompany } = useCompany();
    const [payments, setPayments] = useState<SupplierPayment[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { showLoader, hideLoader } = useLoading();

    // Modal
    const [showModal, setShowModal] = useState(false);
    const [editingPayment, setEditingPayment] = useState<SupplierPayment | null>(null);

    // Form
    const [form, setForm] = useState({
        supplier_code: '',
        amount: 0,
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: '',
        reference_number: ''
    });

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [paymentsRes, suppliersRes] = await Promise.all([
                api.supplierPayments.getAll(1, 100),
                api.suppliers.getAll(1, 100)
            ]);
            setPayments(paymentsRes.data);
            setSuppliers(suppliersRes.data);
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
            showLoader(editingPayment ? 'Updating payment...' : 'Creating payment...');
            if (editingPayment) {
                await api.supplierPayments.update(editingPayment.payment_id, form);
            } else {
                await api.supplierPayments.create(form);
            }
            setShowModal(false);
            setEditingPayment(null);
            setForm({
                supplier_code: '',
                amount: 0,
                payment_date: new Date().toISOString().split('T')[0],
                payment_method: '',
                reference_number: ''
            });
            await fetchData();
        } catch (error) {
            console.error(error);
        } finally {
            hideLoader();
        }
    };

    const handleEdit = (payment: SupplierPayment) => {
        setEditingPayment(payment);
        setForm({
            supplier_code: payment.supplier_code,
            amount: payment.amount,
            payment_date: payment.payment_date.split('T')[0],
            payment_method: payment.payment_method,
            reference_number: payment.reference_number
        });
        setShowModal(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Supplier Payments</h1>
                    <p className="text-slate-500">Manage payments made to suppliers.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-brand-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-brand-700 transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    New Payment
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-200">
                    <h3 className="text-lg font-bold text-slate-900">Payment History</h3>
                </div>

                {isLoading ? (
                    <div className="p-8 text-center text-slate-500">Loading payments...</div>
                ) : (
                    <>
                        <div className="overflow-x-auto hidden lg:block">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Payment No</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Supplier</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Method</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Amount</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Reference</th>
                                        <th className="relative px-6 py-3">
                                            <span className="sr-only">Actions</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-200">
                                    {payments.map((payment) => (
                                        <tr key={payment.payment_id} className="hover:bg-slate-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                {formatTableDate(payment.payment_date)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                                {payment.payment_number}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                                {suppliers.find(s => s.supplier_code === payment.supplier_code)?.supplier_name || payment.supplier_code}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                {payment.payment_method}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-slate-900">
                                                PKR {payment.amount.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                {payment.reference_number}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() => handleEdit(payment)}
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
                            data={payments.map(payment => ({
                                ...payment,
                                supplier_name: suppliers.find(s => s.supplier_code === payment.supplier_code)?.supplier_name || payment.supplier_code
                            }))}
                            columns={[
                                {
                                    key: 'payment_date',
                                    label: 'Date',
                                    render: (value) => formatTableDate(value)
                                },
                                {
                                    key: 'payment_number',
                                    label: 'Payment No'
                                },
                                {
                                    key: 'supplier_name',
                                    label: 'Supplier'
                                },
                                {
                                    key: 'payment_method',
                                    label: 'Method'
                                },
                                {
                                    key: 'amount',
                                    label: 'Amount',
                                    render: (value) => `PKR ${value.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                },
                                {
                                    key: 'reference_number',
                                    label: 'Reference'
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
                                {editingPayment ? 'Edit Payment' : 'Record Payment'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400">
                                <Edit2 className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Supplier</label>
                                <select
                                    required
                                    className="w-full border border-slate-300 rounded-lg p-2"
                                    value={form.supplier_code}
                                    onChange={e => setForm({ ...form, supplier_code: e.target.value })}
                                >
                                    <option value="">Select Supplier</option>
                                    {suppliers.map(supplier => (
                                        <option key={supplier.supplier_code} value={supplier.supplier_code}>
                                            {supplier.supplier_name}
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
                                <label className="block text-sm font-medium text-slate-700 mb-1">Payment Date</label>
                                <input
                                    type="date"
                                    required
                                    className="w-full border border-slate-300 rounded-lg p-2"
                                    value={form.payment_date}
                                    onChange={e => setForm({ ...form, payment_date: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Payment Method</label>
                                <select
                                    required
                                    className="w-full border border-slate-300 rounded-lg p-2"
                                    value={form.payment_method}
                                    onChange={e => setForm({ ...form, payment_method: e.target.value })}
                                >
                                    <option value="">Select Method</option>
                                    <option value="Cash">Cash</option>
                                    <option value="Bank Transfer">Bank Transfer</option>
                                    <option value="Cheque">Cheque</option>
                                    <option value="Online">Online</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Reference Number</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full border border-slate-300 rounded-lg p-2"
                                    value={form.reference_number}
                                    onChange={e => setForm({ ...form, reference_number: e.target.value })}
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-brand-600 text-white py-2 rounded-lg hover:bg-brand-700 mt-2"
                            >
                                {editingPayment ? 'Update Payment' : 'Record Payment'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Payments;