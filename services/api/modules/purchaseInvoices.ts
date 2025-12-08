import { PurchaseInvoice } from '../../../types';
import { USE_MOCK, delay, getAuthHeaders } from '../utils';

export const purchaseInvoices = {
    getAll: async (page: number = 1, limit: number = 10): Promise<{ data: PurchaseInvoice[], pagination: any }> => {
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
        const res = await fetch(`/api/purchase-invoices?page=${page}&limit=${limit}`);
        return res.json();
    },
    create: async (invoice: Omit<PurchaseInvoice, 'purchase_id'>): Promise<PurchaseInvoice> => {
        if (USE_MOCK) {
            await delay(300);
            return {} as PurchaseInvoice;
        }
        const res = await fetch('/api/purchase-invoices', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(invoice)
        });
        return res.json();
    },
    update: async (id: number, invoice: Partial<PurchaseInvoice>): Promise<PurchaseInvoice> => {
        if (USE_MOCK) {
            await delay(300);
            throw new Error("Mock update not implemented");
        }
        const res = await fetch(`/api/purchase-invoices/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(invoice)
        });
        return res.json();
    }
};