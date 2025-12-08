import { Product } from '../../../types';
import { USE_MOCK, delay, getAuthHeaders, _products, addProduct, removeProduct, updateProduct } from '../utils';

export const products = {
    getAll: async (page: number = 1, limit: number = 8): Promise<{ data: Product[], pagination: any }> => {
        if (USE_MOCK) {
            await delay(300);
            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + limit;
            const paginatedProducts = _products.slice(startIndex, endIndex);
            return {
                data: paginatedProducts,
                pagination: {
                    page,
                    limit,
                    total: _products.length,
                    totalPages: Math.ceil(_products.length / limit)
                }
            };
        }
        const res = await fetch(`/api/products?page=${page}&limit=${limit}`, {
            headers: getAuthHeaders()
        });
        return res.json();
    },
    create: async (product: Omit<Product, 'prod_id'>): Promise<Product> => {
        if (USE_MOCK) {
            await delay(300);
            const newProduct = { ...product, prod_id: Math.max(0, ..._products.map(p => p.prod_id)) + 1 };
            addProduct(newProduct);
            return newProduct;
        }
        const res = await fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify(product),
        });
        return res.json();
    },
    update: async (id: number, product: Partial<Product>): Promise<Product> => {
        if (USE_MOCK) {
            await delay(300);
            updateProduct(id, product);
            const prod = _products.find(p => p.prod_id === id);
            if (prod) return prod;
            throw new Error('Product not found');
        }
        const res = await fetch(`/api/products/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify(product),
        });
        return res.json();
    },
    delete: async (id: number): Promise<void> => {
        if (USE_MOCK) {
            await delay(300);
            removeProduct(id);
            return;
        }
        await fetch(`/api/products/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
    }
};