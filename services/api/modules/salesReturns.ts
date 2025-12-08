import { SalesReturn } from '../../../types';
import { USE_MOCK, delay } from '../utils';

export const salesReturns = {
    getAll: async (page: number = 1, limit: number = 8): Promise<{ data: SalesReturn[], pagination: any }> => {
        if (USE_MOCK) {
            await delay(300);
            return { data: [], pagination: { page, limit, total: 0, totalPages: 0 } };
        }
        const res = await fetch(`/api/sales-returns?page=${page}&limit=${limit}`);
        return res.json();
    },
    create: async (returnData: {
        inv_id: number;
        items: any[];
        return_date: string;
    }): Promise<SalesReturn> => {
        if (USE_MOCK) {
            await delay(500);
            return {} as SalesReturn;
        }
        const res = await fetch('/api/sales-returns', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(returnData)
        });
        return res.json();
    },
    update: async (id: number, returnData: {
        inv_id: number;
        items: any[];
        return_date: string;
    }): Promise<SalesReturn> => {
        if (USE_MOCK) {
            await delay(500);
            return {} as SalesReturn;
        }
        const res = await fetch(`/api/sales-returns/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(returnData)
        });
        return res.json();
    }
};