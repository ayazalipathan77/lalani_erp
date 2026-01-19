import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Company, User } from '../types';
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
    currentUser: User | null;
}

export const CompanyProvider: React.FC<CompanyProviderProps> = ({ children, currentUser }) => {
    const [selectedCompany, setSelectedCompanyState] = useState<string>(
        localStorage.getItem('selectedCompany') || 'CMP01'
    );
    const [companies, setCompanies] = useState<Company[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Load companies when currentUser changes
    useEffect(() => {
        const fetchCompanies = async () => {
            if (!currentUser) {
                // Not authenticated
                setIsLoading(false);
                return;
            }

            try {
                // For USER role: Use their assigned company, no need to fetch company list
                if (currentUser.role === 'USER') {
                    const userCompany = currentUser.default_company || selectedCompany || 'CMP01';
                    setSelectedCompanyState(userCompany);
                    localStorage.setItem('selectedCompany', userCompany);
                    console.log('USER role: Using assigned company', userCompany);
                    setIsLoading(false);
                    return;
                }

                // For ADMIN role: Fetch all companies and allow selection
                const companyList = await api.companies.getAll();
                setCompanies(companyList);

                // If no company is selected or selected company doesn't exist, select the first one
                if (!selectedCompany || !companyList.find(c => c.comp_code === selectedCompany)) {
                    const defaultCompany = companyList[0]?.comp_code || 'CMP01';
                    setSelectedCompanyState(defaultCompany);
                    localStorage.setItem('selectedCompany', defaultCompany);
                }
                setIsLoading(false);
            } catch (error) {
                console.error('Failed to fetch companies:', error);
                // Auth error handling is done by App component mostly, but we can be safe
                setIsLoading(false);
            }
        };

        fetchCompanies();
    }, [currentUser]); // Re-run when user changes

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