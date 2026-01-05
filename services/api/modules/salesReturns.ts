import { SalesReturn } from '../../../types';
import { USE_MOCK, delay, getAuthHeaders, handleFetchResponse } from '../utils';

export const salesReturns = {
    getAll: async (page: number = 1, limit: number = 8): Promise<{ data: SalesReturn[], pagination: any }> => {
        if (USE_MOCK) {
            await delay(300);
            return { data: [], pagination: { page, limit, total: 0, totalPages: 0 } };
        }
        const res = await fetch(`/api/sales-returns?page=${page}&limit=${limit}`, {
            headers: getAuthHeaders()
        });
        return handleFetchResponse<{ data: SalesReturn[], pagination: any }>(res);
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
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify(returnData)
        });
        return handleFetchResponse<SalesReturn>(res);
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
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify(returnData)
        });
        return handleFetchResponse<SalesReturn>(res);
    }
};