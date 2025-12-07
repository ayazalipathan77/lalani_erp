import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Company } from '../types';
import { api } from '../services/api';

interface CompanyContextType {
    selectedCompany: string;
    companies: Company[];
    setSelectedCompany: (companyCode: string) => void;
    isLoading: boolean;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

interface CompanyProviderProps {
    children: ReactNode;
}

export const CompanyProvider: React.FC<CompanyProviderProps> = ({ children }) => {
    const [selectedCompany, setSelectedCompanyState] = useState<string>(
        localStorage.getItem('selectedCompany') || 'CMP01'
    );
    const [companies, setCompanies] = useState<Company[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Load companies on mount
    useEffect(() => {
        const fetchCompanies = async () => {
            try {
                const companyList = await api.companies.getAll();
                setCompanies(companyList);

                // If no company is selected or selected company doesn't exist, select the first one
                if (!selectedCompany || !companyList.find(c => c.comp_code === selectedCompany)) {
                    const defaultCompany = companyList[0]?.comp_code || 'CMP01';
                    setSelectedCompanyState(defaultCompany);
                    localStorage.setItem('selectedCompany', defaultCompany);
                }
            } catch (error) {
                console.error('Failed to fetch companies:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCompanies();
    }, []);

    const setSelectedCompany = (companyCode: string) => {
        setSelectedCompanyState(companyCode);
        localStorage.setItem('selectedCompany', companyCode);
    };

    const value: CompanyContextType = {
        selectedCompany,
        companies,
        setSelectedCompany,
        isLoading
    };

    return (
        <CompanyContext.Provider value={value}>
            {children}
        </CompanyContext.Provider>
    );
};

export const useCompany = () => {
    const context = useContext(CompanyContext);
    if (context === undefined) {
        throw new Error('useCompany must be used within a CompanyProvider');
    }
    return context;
};