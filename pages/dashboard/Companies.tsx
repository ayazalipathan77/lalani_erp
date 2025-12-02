import React, { useState, useEffect } from 'react';
import { Building2, Plus, Edit2, Trash2, X, CheckCircle } from 'lucide-react';
import { useLoading } from '../../components/LoadingContext';
import { api } from '../../services/api';
import { Company } from '../../types';
import MobileTable from '../../components/MobileTable';

const Companies: React.FC = () => {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { showLoader, hideLoader } = useLoading();

    // Modals
    const [showCompanyModal, setShowCompanyModal] = useState(false);

    // Edit state
    const [editingCompany, setEditingCompany] = useState<Company | null>(null);

    // Form Data
    const [companyForm, setCompanyForm] = useState({
        comp_code: '',
        comp_name: '',
        address: '',
        phone: '',
        email: '',
        gstin: '',
        pan_number: '',
        tax_registration: ''
    });

    const fetchCompanies = async () => {
        setIsLoading(true);
        try {
            const response = await api.companies.getAll();
            setCompanies(response);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCompanies();
    }, []);

    const handleCreateCompany = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            showLoader(editingCompany ? 'Updating company...' : 'Creating company...');
            if (editingCompany) {
                await api.companies.update(editingCompany.comp_code, companyForm);
            } else {
                await api.companies.create(companyForm);
            }
            setShowCompanyModal(false);
            setEditingCompany(null);
            setCompanyForm({
                comp_code: '',
                comp_name: '',
                address: '',
                phone: '',
                email: '',
                gstin: '',
                pan_number: '',
                tax_registration: ''
            });
            await fetchCompanies();
        } catch (error) {
            console.error(error);
        } finally {
            hideLoader();
        }
    };

    const handleEditCompany = (company: Company) => {
        setEditingCompany(company);
        setCompanyForm({
            comp_code: company.comp_code,
            comp_name: company.comp_name,
            address: company.address || '',
            phone: company.phone || '',
            email: company.email || '',
            gstin: company.gstin || '',
            pan_number: company.pan_number || '',
            tax_registration: company.tax_registration || ''
        });
        setShowCompanyModal(true);
    };

    const handleDeleteCompany = async (comp_code: string) => {
        if (!confirm('Are you sure you want to delete this company? This action cannot be undone.')) {
            return;
        }

        try {
            showLoader('Deleting company...');
            await api.companies.delete(comp_code);
            await fetchCompanies();
        } catch (error: any) {
            alert(error.message || 'Failed to delete company');
        } finally {
            hideLoader();
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Company Management</h1>
                    <p className="text-slate-500">Manage multiple companies and their tax information.</p>
                </div>
                <button
                    onClick={() => setShowCompanyModal(true)}
                    className="bg-brand-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-brand-700 transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Company
                </button>
            </div>

            {/* Companies Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-200">
                    <h3 className="text-lg font-bold text-slate-900">Companies</h3>
                </div>
                {isLoading ? (
                    <div className="p-8 text-center text-slate-500">Loading companies...</div>
                ) : (
                    <>
                        {/* Desktop Table View */}
                        <div className="hidden lg:block">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Code</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Address</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Phone</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Email</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">GSTIN</th>
                                        <th className="relative px-6 py-3">
                                            <span className="sr-only">Actions</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-200">
                                    {companies.map((company) => (
                                        <tr key={company.comp_code} className="hover:bg-slate-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{company.comp_code}</td>
                                            <td className="px-6 py-4 text-sm text-slate-900">{company.comp_name}</td>
                                            <td className="px-6 py-4 text-sm text-slate-500">{company.address}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{company.phone}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{company.email}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{company.gstin}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() => handleEditCompany(company)}
                                                    className="text-slate-400 hover:text-brand-600 transition-colors mr-2"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteCompany(company.comp_code)}
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
                            data={companies}
                            columns={[
                                {
                                    key: 'comp_code',
                                    label: 'Code'
                                },
                                {
                                    key: 'comp_name',
                                    label: 'Name'
                                },
                                {
                                    key: 'address',
                                    label: 'Address'
                                },
                                {
                                    key: 'phone',
                                    label: 'Phone'
                                },
                                {
                                    key: 'email',
                                    label: 'Email'
                                },
                                {
                                    key: 'gstin',
                                    label: 'GSTIN'
                                }
                            ]}
                        />
                    </>
                )}
            </div>

            {/* Company Modal */}
            {showCompanyModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center p-6 border-b border-slate-100">
                            <h3 className="text-xl font-bold text-slate-900">
                                {editingCompany ? 'Edit Company' : 'Add Company'}
                            </h3>
                            <button onClick={() => setShowCompanyModal(false)} className="text-slate-400">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateCompany} className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Company Code *</label>
                                    <input
                                        type="text"
                                        required
                                        maxLength={10}
                                        className="w-full border border-slate-300 rounded-lg p-2"
                                        value={companyForm.comp_code}
                                        onChange={e => setCompanyForm({ ...companyForm, comp_code: e.target.value.toUpperCase() })}
                                        disabled={!!editingCompany}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Company Name *</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full border border-slate-300 rounded-lg p-2"
                                        value={companyForm.comp_name}
                                        onChange={e => setCompanyForm({ ...companyForm, comp_name: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                                <textarea
                                    className="w-full border border-slate-300 rounded-lg p-2"
                                    rows={2}
                                    value={companyForm.address}
                                    onChange={e => setCompanyForm({ ...companyForm, address: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                                    <input
                                        type="tel"
                                        className="w-full border border-slate-300 rounded-lg p-2"
                                        value={companyForm.phone}
                                        onChange={e => setCompanyForm({ ...companyForm, phone: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        className="w-full border border-slate-300 rounded-lg p-2"
                                        value={companyForm.email}
                                        onChange={e => setCompanyForm({ ...companyForm, email: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="border-t border-slate-200 pt-4">
                                <h4 className="text-lg font-medium text-slate-900 mb-4">Tax Information</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">GSTIN</label>
                                        <input
                                            type="text"
                                            className="w-full border border-slate-300 rounded-lg p-2"
                                            value={companyForm.gstin}
                                            onChange={e => setCompanyForm({ ...companyForm, gstin: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">PAN Number</label>
                                        <input
                                            type="text"
                                            className="w-full border border-slate-300 rounded-lg p-2"
                                            value={companyForm.pan_number}
                                            onChange={e => setCompanyForm({ ...companyForm, pan_number: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Tax Registration</label>
                                        <input
                                            type="text"
                                            className="w-full border border-slate-300 rounded-lg p-2"
                                            value={companyForm.tax_registration}
                                            onChange={e => setCompanyForm({ ...companyForm, tax_registration: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <button type="submit" className="w-full bg-brand-600 text-white py-2 rounded-lg hover:bg-brand-700 mt-2">
                                {editingCompany ? 'Update Company' : 'Create Company'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Companies;