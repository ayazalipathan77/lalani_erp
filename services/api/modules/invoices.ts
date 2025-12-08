import { SalesInvoice } from '../../../types';
import { USE_MOCK, delay, getAuthHeaders } from '../utils';

export const invoices = {
    getAll: async (page: number = 1, limit: number = 8): Promise<{ data: SalesInvoice[], pagination: any }> => {
        if (USE_MOCK) {
            await delay(300);
            return {
                data: [],
                pagination: {
                    page,
                    limit,
                    total: 0,
                    totalPages: 0
                }
            };
        }
        const res = await fetch(`/api/invoices?page=${page}&limit=${limit}`, {
            headers: getAuthHeaders()
        });
        return res.json();
    },
    create: async (invoiceData: {
        cust_code: string;
        items: any[];
        date: string;
        status: 'PAID' | 'PENDING'
    }): Promise<SalesInvoice> => {
        if (USE_MOCK) {
            await delay(500);
            return {
                inv_id: 1,
                inv_number: 'INV-001',
                inv_date: invoiceData.date,
                cust_code: invoiceData.cust_code,
                total_amount: 0,
                balance_due: 0,
                status: invoiceData.status,
                items: invoiceData.items
            };
        }
        const res = await fetch('/api/invoices', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify(invoiceData)
        });
        if (!res.ok) throw new Error("Failed to create invoice");
        return res.json();
    },
    update: async (id: number, invoiceData: {
        cust_code: string;
        items: any[];
        inv_date: string;
        status: 'PAID' | 'PENDING'
    }): Promise<SalesInvoice> => {
        if (USE_MOCK) {
            await delay(500);
            throw new Error("Mock update not implemented");
        }
        const res = await fetch(`/api/invoices/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify(invoiceData)
        });
        if (!res.ok) throw new Error("Failed to update invoice");
        return res.json();
    }
};