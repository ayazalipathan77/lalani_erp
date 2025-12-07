import React, { useState, useEffect } from 'react';
import { Calculator, Plus, Edit2, Trash2, X, CheckCircle } from 'lucide-react';
import { useLoading } from '../../components/LoadingContext';
import { useCompany } from '../../components/CompanyContext';
import { api } from '../../services/api';
import { TaxRate } from '../../types';
import MobileTable from '../../components/MobileTable';

const TaxRates: React.FC = () => {
    const { selectedCompany } = useCompany();
    const [taxRates, setTaxRates] = useState<TaxRate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { showLoader, hideLoader } = useLoading();

    // Modals
    const [showTaxModal, setShowTaxModal] = useState(false);

    // Edit state
    const [editingTax, setEditingTax] = useState<TaxRate | null>(null);

    // Form Data
    const [taxForm, setTaxForm] = useState({
        tax_code: '',
        tax_name: '',
        tax_rate: 0,
        tax_type: 'GST',
        description: ''
    });

    const fetchTaxRates = async () => {
        setIsLoading(true);
        try {
            const response = await api.taxRates.getAll();
            setTaxRates(response);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTaxRates();
    }, [selectedCompany]); // Refetch when company changes

    const handleCreateTax = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            showLoader(editingTax ? 'Updating tax rate...' : 'Creating tax rate...');
            if (editingTax) {
                await api.taxRates.update(editingTax.tax_code, taxForm);
            } else {
                await api.taxRates.create(taxForm);
            }
            setShowTaxModal(false);
            setEditingTax(null);
            setTaxForm({
                tax_code: '',
                tax_name: '',
                tax_rate: 0,
                tax_type: 'GST',
                description: ''
            });
            await fetchTaxRates();
        } catch (error) {
            console.error(error);
        } finally {
            hideLoader();
        }
    };

    const handleEditTax = (tax: TaxRate) => {
        setEditingTax(tax);
        setTaxForm({
            tax_code: tax.tax_code,
            tax_name: tax.tax_name,
            tax_rate: tax.tax_rate,
            tax_type: tax.tax_type,
            description: tax.description || ''
        });
        setShowTaxModal(true);
    };

    const handleDeleteTax = async (tax_code: string) => {
        if (!confirm('Are you sure you want to deactivate this tax rate?')) {
            return;
        }

        try {
            showLoader('Deactivating tax rate...');
            await api.taxRates.delete(tax_code);
            await fetchTaxRates();
        } catch (error: any) {
            alert(error.message || 'Failed to deactivate tax rate');
        } finally {
            hideLoader();
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Tax Rate Management</h1>
                    <p className="text-slate-500">Configure tax rates for GST, VAT, and other tax types.</p>
                </div>
                <button
                    onClick={() => setShowTaxModal(true)}
                    className="bg-brand-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-brand-700 transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Tax Rate
                </button>
            </div>

            {/* Tax Rates Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-200">
                    <h3 className="text-lg font-bold text-slate-900">Tax Rates</h3>
                </div>
                {isLoading ? (
                    <div className="p-8 text-center text-slate-500">Loading tax rates...</div>
                ) : (
                    <>
                        {/* Desktop Table View */}
                        <div className="hidden lg:block">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Code</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Type</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Rate (%)</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Description</th>
                                        <th className="relative px-6 py-3">
                                            <span className="sr-only">Actions</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-200">
                                    {taxRates.map((tax) => (
                                        <tr key={tax.tax_code} className="hover:bg-slate-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{tax.tax_code}</td>
                                            <td className="px-6 py-4 text-sm text-slate-900">{tax.tax_name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{tax.tax_type}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 font-mono">{tax.tax_rate}%</td>
                                            <td className="px-6 py-4 text-sm text-slate-500">{tax.description}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() => handleEditTax(tax)}
                                                    className="text-slate-400 hover:text-brand-600 transition-colors mr-2"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteTax(tax.tax_code)}
                                                    className="text-slate-400 hover:text-red-600 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Table View */}
                        <MobileTable
                            data={taxRates}
                            columns={[
                                {
                                    key: 'tax_code',
                                    label: 'Code'
                                },
                                {
                                    key: 'tax_name',
                                    label: 'Name'
                                },
                                {
                                    key: 'tax_type',
                                    label: 'Type'
                                },
                                {
                                    key: 'tax_rate',
                                    label: 'Rate (%)',
                                    render: (value) => `${value}%`
                                },
                                {
                                    key: 'description',
                                    label: 'Description'
                                }
                            ]}
                        />
                    </>
                )}
            </div>

            {/* Tax Modal */}
            {showTaxModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                        <div className="flex justify-between items-center p-6 border-b border-slate-100">
                            <h3 className="text-xl font-bold text-slate-900">
                                {editingTax ? 'Edit Tax Rate' : 'Add Tax Rate'}
                            </h3>
                            <button onClick={() => setShowTaxModal(false)} className="text-slate-400">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateTax} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tax Code *</label>
                                <input
                                    type="text"
                                    required
                                    maxLength={20}
                                    className="w-full border border-slate-300 rounded-lg p-2"
                                    value={taxForm.tax_code}
                                    onChange={e => setTaxForm({ ...taxForm, tax_code: e.target.value.toUpperCase() })}
                                    disabled={!!editingTax}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tax Name *</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full border border-slate-300 rounded-lg p-2"
                                    value={taxForm.tax_name}
                                    onChange={e => setTaxForm({ ...taxForm, tax_name: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Tax Type</label>
                                    <select
                                        className="w-full border border-slate-300 rounded-lg p-2"
                                        value={taxForm.tax_type}
                                        onChange={e => setTaxForm({ ...taxForm, tax_type: e.target.value })}
                                    >
                                        <option value="GST">GST</option>
                                        <option value="VAT">VAT</option>
                                        <option value="EXCISE">Excise</option>
                                        <option value="OTHER">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Rate (%) *</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        max="100"
                                        step="0.01"
                                        className="w-full border border-slate-300 rounded-lg p-2"
                                        value={taxForm.tax_rate}
                                        onChange={e => setTaxForm({ ...taxForm, tax_rate: Number(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                <textarea
                                    className="w-full border border-slate-300 rounded-lg p-2"
                                    rows={2}
                                    value={taxForm.description}
                                    onChange={e => setTaxForm({ ...taxForm, description: e.target.value })}
                                />
                            </div>
                            <button type="submit" className="w-full bg-brand-600 text-white py-2 rounded-lg hover:bg-brand-700 mt-2">
                                {editingTax ? 'Update Tax Rate' : 'Create Tax Rate'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TaxRates;