import { Company } from '../../../types';
import { USE_MOCK, delay, getAuthHeaders, handleFetchResponse } from '../utils';

export const companies = {
    getAll: async (): Promise<Company[]> => {
        if (USE_MOCK) {
            await delay(300);
            return [
                {
                    comp_code: 'CMP01',
                    comp_name: 'Lalani Traders',
                    address: 'Karachi, Pakistan',
                    phone: '+92-21-1234567',
                    email: 'info@lalanitraders.com',
                    gstin: '27AAAAA0000A1Z5',
                    pan_number: 'AAAAA0000A',
                    tax_registration: 'TR001'
                }
            ];
        }
        const res = await fetch('/api/companies', {
            headers: getAuthHeaders()
        });
        return handleFetchResponse<Company[]>(res);
    },
    getByCode: async (code: string): Promise<Company> => {
        if (USE_MOCK) {
            await delay(300);
            return {
                comp_code: code,
                comp_name: 'Lalani Traders',
                address: 'Karachi, Pakistan',
                phone: '+92-21-1234567',
                email: 'info@lalanitraders.com',
                gstin: '27AAAAA0000A1Z5',
                pan_number: 'AAAAA0000A',
                tax_registration: 'TR001'
            };
        }
        const res = await fetch(`/api/companies/${code}`, {
            headers: getAuthHeaders()
        });
        return handleFetchResponse<Company>(res);
    },
    create: async (companyData: Omit<Company, 'created_at'>): Promise<Company> => {
        if (USE_MOCK) {
            await delay(500);
            return {
                ...companyData,
                created_at: new Date().toISOString()
            } as Company;
        }
        const res = await fetch('/api/companies', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders()
            },
            body: JSON.stringify(companyData)
        });
        return handleFetchResponse<Company>(res);
    },
    update: async (code: string, companyData: Partial<Company>): Promise<Company> => {
        if (USE_MOCK) {
            await delay(500);
            return {
                comp_code: code,
                comp_name: 'Updated Company',
                address: 'Updated Address',
                phone: '1234567890',
                email: 'test@example.com',
                ...companyData
            } as Company;
        }
        const res = await fetch(`/api/companies/${code}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders()
            },
            body: JSON.stringify(companyData)
        });
        return handleFetchResponse<Company>(res);
    },
    delete: async (code: string): Promise<void> => {
        if (USE_MOCK) {
            await delay(300);
            return;
        }
        const res = await fetch(`/api/companies/${code}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        await handleFetchResponse<void>(res);
    }
};