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
                const companyList = await api.companies.getAll();
                setCompanies(companyList);
            } catch (error) {
                console.error('Failed to fetch companies:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCompanies();
    }, []);

    const selectedCompanyData = companies.find(c => c.comp_code === selectedCompany);

    if (isLoading) {
        return (
            <div className="flex items-center space-x-2 px-3 py-2 bg-slate-50 rounded-lg">
                <Building2 className="w-4 h-4 text-slate-400" />
                <div className="w-24 h-4 bg-slate-200 rounded animate-pulse"></div>
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
                <span className="text-sm font-medium text-slate-700">
                    {selectedCompanyData?.comp_name || selectedCompany}
                </span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    ></div>
                    <div className="absolute top-full mt-1 w-64 bg-white border border-slate-200 rounded-lg shadow-lg z-20">
                        <div className="py-1">
                            {companies.map((company) => (
                                <button
                                    key={company.comp_code}
                                    onClick={() => {
                                        onCompanyChange(company.comp_code);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full px-4 py-2 text-left hover:bg-slate-50 transition-colors ${company.comp_code === selectedCompany ? 'bg-brand-50 text-brand-700' : 'text-slate-700'
                                        }`}
                                >
                                    <div className="flex items-center space-x-2">
                                        <Building2 className="w-4 h-4" />
                                        <div>
                                            <div className="text-sm font-medium">{company.comp_name}</div>
                                            <div className="text-xs text-slate-500">{company.comp_code}</div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default CompanySelector;