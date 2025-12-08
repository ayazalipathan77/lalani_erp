import { SupplierPayment } from '../../../types';
import { USE_MOCK, delay, getAuthHeaders } from '../utils';

export const supplierPayments = {
    getAll: async (page: number = 1, limit: number = 8): Promise<{ data: SupplierPayment[], pagination: any }> => {
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
        const res = await fetch(`/api/supplier-payments?page=${page}&limit=${limit}`, {
            headers: getAuthHeaders()
        });
        return res.json();
    },
    create: async (paymentData: Omit<SupplierPayment, 'payment_id' | 'payment_number' | 'status'>): Promise<SupplierPayment> => {
        if (USE_MOCK) {
            await delay(500);
            return {
                payment_id: 1,
                payment_number: 'PAY-001',
                payment_date: paymentData.payment_date,
                supplier_code: paymentData.supplier_code,
                amount: paymentData.amount,
                payment_method: paymentData.payment_method,
                reference_number: paymentData.reference_number,
                status: 'COMPLETED'
            } as SupplierPayment;
        }
        const res = await fetch('/api/supplier-payments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify(paymentData)
        });
        if (!res.ok) throw new Error("Failed to create payment");
        return res.json();
    },
    update: async (id: number, paymentData: Partial<SupplierPayment>): Promise<SupplierPayment> => {
        if (USE_MOCK) {
            await delay(500);
            throw new Error("Mock update not implemented");
        }
        const res = await fetch(`/api/supplier-payments/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify(paymentData)
        });
        if (!res.ok) throw new Error("Failed to update payment");
        return res.json();
    }
};