import { PaymentReceipt } from '../../../types';
import { USE_MOCK, delay, getAuthHeaders } from '../utils';

export const paymentReceipts = {
    getAll: async (page: number = 1, limit: number = 8): Promise<{ data: PaymentReceipt[], pagination: any }> => {
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
        const res = await fetch(`/api/payment-receipts?page=${page}&limit=${limit}`, {
            headers: getAuthHeaders()
        });
        return res.json();
    },
    create: async (receiptData: Omit<PaymentReceipt, 'receipt_id' | 'receipt_number' | 'status'>): Promise<PaymentReceipt> => {
        if (USE_MOCK) {
            await delay(500);
            return {
                receipt_id: 1,
                receipt_number: 'REC-001',
                receipt_date: receiptData.receipt_date,
                cust_code: receiptData.cust_code,
                amount: receiptData.amount,
                payment_method: receiptData.payment_method,
                reference_number: receiptData.reference_number,
                status: 'COMPLETED'
            } as PaymentReceipt;
        }
        const res = await fetch('/api/payment-receipts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify(receiptData)
        });
        if (!res.ok) throw new Error("Failed to create receipt");
        return res.json();
    },
    update: async (id: number, receiptData: Partial<PaymentReceipt>): Promise<PaymentReceipt> => {
        if (USE_MOCK) {
            await delay(500);
            throw new Error("Mock update not implemented");
        }
        const res = await fetch(`/api/payment-receipts/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify(receiptData)
        });
        if (!res.ok) throw new Error("Failed to update receipt");
        return res.json();
    }
};