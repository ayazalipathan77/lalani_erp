import { Category } from '../../../types';
import { USE_MOCK, _categories, getAuthHeaders } from '../utils';

export const categories = {
    getAll: async (): Promise<Category[]> => {
        if (USE_MOCK) return [..._categories];
        const res = await fetch('/api/categories', {
            headers: getAuthHeaders()
        });
        return res.json();
    }
};