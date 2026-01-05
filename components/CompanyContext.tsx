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
            // Check if user is authenticated before fetching companies
            const authToken = localStorage.getItem('authToken');
            const currentUserStr = localStorage.getItem('currentUser');

            if (!authToken || !currentUserStr) {
                setIsLoading(false);
                return;
            }

            try {
                const currentUser = JSON.parse(currentUserStr);

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
                // If it's an actual authentication error (invalid/expired token), clear auth data
                if (error instanceof Error && (error.message.includes('403') || error.message.includes('Forbidden') || error.message.includes('401') || error.message.includes('Unauthorized'))) {
                    console.warn('Authentication failed - clearing auth data');
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('currentUser');
                    // The App component will detect missing auth and redirect to login
                }
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