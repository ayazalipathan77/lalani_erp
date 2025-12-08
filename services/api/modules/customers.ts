import { Customer } from '../../../types';
import { USE_MOCK, delay, getAuthHeaders, _customers, addCustomer, removeCustomer, updateCustomer } from '../utils';

export const customers = {
    getAll: async (page: number = 1, limit: number = 8): Promise<{ data: Customer[], pagination: any }> => {
        if (USE_MOCK) {
            await delay(300);
            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + limit;
            const paginatedCustomers = _customers.slice(startIndex, endIndex);
            return {
                data: paginatedCustomers,
                pagination: {
                    page,
                    limit,
                    total: _customers.length,
                    totalPages: Math.ceil(_customers.length / limit)
                }
            };
        }
        const res = await fetch(`/api/customers?page=${page}&limit=${limit}`, {
            headers: getAuthHeaders()
        });
        return res.json();
    },
    create: async (customer: Omit<Customer, 'cust_id'>): Promise<Customer> => {
        if (USE_MOCK) {
            await delay(300);
            const newCustomer = { ...customer, cust_id: Math.max(0, ..._customers.map(c => c.cust_id)) + 1 };
            addCustomer(newCustomer);
            return newCustomer;
        }
        const res = await fetch('/api/customers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify(customer)
        });
        return res.json();
    },
    update: async (id: number, data: Partial<Customer>): Promise<Customer> => {
        if (USE_MOCK) {
            await delay(300);
            updateCustomer(id, data);
            const customer = _customers.find(c => c.cust_id === id);
            if (customer) return customer;
            throw new Error("Customer not found");
        }
        const res = await fetch(`/api/customers/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify(data)
        });
        return res.json();
    },
    delete: async (id: number): Promise<void> => {
        if (USE_MOCK) {
            await delay(300);
            removeCustomer(id);
            return;
        }
        await fetch(`/api/customers/${id}`, { method: 'DELETE' });
    }
};