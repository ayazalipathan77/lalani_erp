import { DiscountRate } from '../../../types';
import { USE_MOCK, delay, getAuthHeaders } from '../utils';

export const discountRates = {
    getAll: async (): Promise<DiscountRate[]> => {
        if (USE_MOCK) {
            await delay(300);
            return [];
        }
        const res = await fetch('/api/discount-rates', {
            headers: getAuthHeaders()
        });
        return res.json();
    },
    create: async (discountRate: Omit<DiscountRate, 'discount_id'>): Promise<DiscountRate> => {
        if (USE_MOCK) {
            await delay(300);
            return { ...discountRate, discount_id: Math.floor(Math.random() * 1000) };
        }
        const res = await fetch('/api/discount-rates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify(discountRate)
        });
        return res.json();
    },
    update: async (id: number, data: Partial<DiscountRate>): Promise<DiscountRate> => {
        if (USE_MOCK) {
            await delay(300);
            return { ...data, discount_id: id } as DiscountRate;
        }
        const res = await fetch(`/api/discount-rates/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify(data)
        });
        return res.json();
    },
    delete: async (id: number): Promise<void> => {
        if (USE_MOCK) {
            await delay(300);
            return;
        }
        await fetch(`/api/discount-rates/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
    }
};