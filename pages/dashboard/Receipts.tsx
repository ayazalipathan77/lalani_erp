import React, { useState, useEffect } from 'react';
import { Plus, Edit2 } from 'lucide-react';
import { useLoading } from '../../components/LoadingContext';
import { useCompany } from '../../components/CompanyContext';
import { api } from '../../services/api';
import { PaymentReceipt, Customer } from '../../types';
import { formatTableDate } from '../../src/utils/dateUtils';
import MobileTable from '../../components/MobileTable';

const Receipts: React.FC = () => {
    const { selectedCompany } = useCompany();
    const [receipts, setReceipts] = useState<PaymentReceipt[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { showLoader, hideLoader } = useLoading();

    // Modal
    const [showModal, setShowModal] = useState(false);
    const [editingReceipt, setEditingReceipt] = useState<PaymentReceipt | null>(null);

    // Form
    const [form, setForm] = useState({
        cust_code: '',
        amount: 0,
        receipt_date: new Date().toISOString().split('T')[0],
        payment_method: '',
        reference_number: ''
    });

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [receiptsRes, customersRes] = await Promise.all([
                api.paymentReceipts.getAll(1, 100),
                api.customers.getAll(1, 100)
            ]);
            setReceipts(receiptsRes.data);
            setCustomers(customersRes.data);
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
            showLoader(editingReceipt ? 'Updating receipt...' : 'Creating receipt...');
            if (editingReceipt) {
                await api.paymentReceipts.update(editingReceipt.receipt_id, form);
            } else {
                await api.paymentReceipts.create(form);
            }
            setShowModal(false);
            setEditingReceipt(null);
            setForm({
                cust_code: '',
                amount: 0,
                receipt_date: new Date().toISOString().split('T')[0],
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

    const handleEdit = (receipt: PaymentReceipt) => {
        setEditingReceipt(receipt);
        setForm({
            cust_code: receipt.cust_code,
            amount: receipt.amount,
            receipt_date: receipt.receipt_date.split('T')[0],
            payment_method: receipt.payment_method,
            reference_number: receipt.reference_number
        });
        setShowModal(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Customer Receipts</h1>
                    <p className="text-slate-500">Manage payments received from customers.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-brand-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-brand-700 transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    New Receipt
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-200">
                    <h3 className="text-lg font-bold text-slate-900">Receipt History</h3>
                </div>

                {isLoading ? (
                    <div className="p-8 text-center text-slate-500">Loading receipts...</div>
                ) : (
                    <>
                        <div className="overflow-x-auto hidden lg:block">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Receipt No</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Customer</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Method</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Amount</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Reference</th>
                                        <th className="relative px-6 py-3">
                                            <span className="sr-only">Actions</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-200">
                                    {receipts.map((receipt) => (
                                        <tr key={receipt.receipt_id} className="hover:bg-slate-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                {formatTableDate(receipt.receipt_date)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                                {receipt.receipt_number}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                                {customers.find(c => c.cust_code === receipt.cust_code)?.cust_name || receipt.cust_code}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                {receipt.payment_method}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-slate-900">
                                                PKR {receipt.amount.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                {receipt.reference_number}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() => handleEdit(receipt)}
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
                            data={receipts.map(receipt => ({
                                ...receipt,
                                cust_name: customers.find(c => c.cust_code === receipt.cust_code)?.cust_name || receipt.cust_code
                            }))}
                            columns={[
                                {
                                    key: 'receipt_date',
                                    label: 'Date',
                                    render: (value) => formatTableDate(value)
                                },
                                {
                                    key: 'receipt_number',
                                    label: 'Receipt No'
                                },
                                {
                                    key: 'cust_name',
                                    label: 'Customer'
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
                                {editingReceipt ? 'Edit Receipt' : 'Record Receipt'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400">
                                <Edit2 className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Customer</label>
                                <select
                                    required
                                    className="w-full border border-slate-300 rounded-lg p-2"
                                    value={form.cust_code}
                                    onChange={e => setForm({ ...form, cust_code: e.target.value })}
                                >
                                    <option value="">Select Customer</option>
                                    {customers.map(customer => (
                                        <option key={customer.cust_code} value={customer.cust_code}>
                                            {customer.cust_name}
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
                                <label className="block text-sm font-medium text-slate-700 mb-1">Receipt Date</label>
                                <input
                                    type="date"
                                    required
                                    className="w-full border border-slate-300 rounded-lg p-2"
                                    value={form.receipt_date}
                                    onChange={e => setForm({ ...form, receipt_date: e.target.value })}
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
                                {editingReceipt ? 'Update Receipt' : 'Record Receipt'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Receipts;