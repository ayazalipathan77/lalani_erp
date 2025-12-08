import { Supplier } from '../../../types';
import { USE_MOCK, delay, getAuthHeaders } from '../utils';

export const suppliers = {
    getAll: async (page: number = 1, limit: number = 10): Promise<{ data: Supplier[], pagination: any }> => {
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
        const res = await fetch(`/api/suppliers?page=${page}&limit=${limit}`);
        return res.json();
    },
    create: async (supplier: Omit<Supplier, 'supplier_id'>): Promise<Supplier> => {
        if (USE_MOCK) {
            await delay(300);
            return {} as Supplier;
        }
        const res = await fetch('/api/suppliers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(supplier)
        });
        return res.json();
    },
    update: async (id: number, supplier: Partial<Supplier>): Promise<Supplier> => {
        if (USE_MOCK) {
            await delay(300);
            throw new Error("Mock update not implemented");
        }
        const res = await fetch(`/api/suppliers/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(supplier)
        });
        return res.json();
    },
    delete: async (id: number): Promise<{ message: string }> => {
        if (USE_MOCK) {
            await delay(300);
            return { message: 'Deleted' };
        }
        const res = await fetch(`/api/suppliers/${id}`, {
            method: 'DELETE'
        });
        return res.json();
    }
};