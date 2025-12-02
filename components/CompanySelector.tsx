import React, { useState, useEffect } from 'react';
import { Building2, ChevronDown } from 'lucide-react';
import { api } from '../services/api';
import { Company } from '../types';

interface CompanySelectorProps {
    selectedCompany: string;
    onCompanyChange: (companyCode: string) => void;
}

const CompanySelector: React.FC<CompanySelectorProps> = ({ selectedCompany, onCompanyChange }) => {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchCompanies = async () => {
            try {
                const response = await api.companies.getAll();
                setCompanies(response);
            } catch (error) {
                console.error('Failed to fetch companies:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCompanies();
    }, []);

    const handleCompanySelect = (companyCode: string) => {
        onCompanyChange(companyCode);
        localStorage.setItem('selectedCompany', companyCode);
        setIsOpen(false);
        // Reload the page to refresh all data with new company context
        window.location.reload();
    };

    const selectedCompanyData = companies.find(c => c.comp_code === selectedCompany);

    if (isLoading) {
        return (
            <div className="flex items-center space-x-2 px-3 py-2 bg-slate-100 rounded-lg">
                <Building2 className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-500">Loading...</span>
            </div>
        );
    }

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-2 px-3 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
                <Building2 className="w-4 h-4 text-slate-600" />
                <span className="text-sm font-medium text-slate-900">
                    {selectedCompanyData?.comp_name || selectedCompany}
                </span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full mt-1 w-64 bg-white border border-slate-200 rounded-lg shadow-lg z-50">
                    <div className="py-1">
                        {companies.map((company) => (
                            <button
                                key={company.comp_code}
                                onClick={() => handleCompanySelect(company.comp_code)}
                                className={`w-full px-4 py-2 text-left hover:bg-slate-50 transition-colors ${company.comp_code === selectedCompany ? 'bg-brand-50 text-brand-700' : 'text-slate-700'
                                    }`}
                            >
                                <div className="font-medium">{company.comp_name}</div>
                                <div className="text-xs text-slate-500">{company.comp_code}</div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Overlay to close dropdown when clicking outside */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </div>
    );
};

export default CompanySelector;