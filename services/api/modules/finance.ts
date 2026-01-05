import { CashTransaction, Expense, ExpenseHead, TaxRate, LoanTaken, LoanReturn } from '../../../types';
import { USE_MOCK, delay, getAuthHeaders, handleFetchResponse } from '../utils';

export const finance = {
    getTransactions: async (page: number = 1, limit: number = 8): Promise<{ data: CashTransaction[], pagination: any }> => {
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
        const res = await fetch(`/api/finance/transactions?page=${page}&limit=${limit}`, {
            headers: getAuthHeaders()
        });
        return handleFetchResponse<{ data: CashTransaction[], pagination: any }>(res);
    },
    getExpenses: async (page: number = 1, limit: number = 8): Promise<{ data: Expense[], pagination: any }> => {
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
        const res = await fetch(`/api/finance/expenses?page=${page}&limit=${limit}`, {
            headers: getAuthHeaders()
        });
        return handleFetchResponse<{ data: Expense[], pagination: any }>(res);
    },
    addExpense: async (expense: Omit<Expense, 'expense_id'>): Promise<Expense> => {
        if (USE_MOCK) {
            await delay(300);
            return {} as Expense;
        }
        const res = await fetch('/api/finance/expenses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify(expense)
        });
        return handleFetchResponse<Expense>(res);
    },
    updateExpense: async (id: number, expense: Partial<Expense>): Promise<Expense> => {
        if (USE_MOCK) {
            await delay(300);
            throw new Error("Mock update not implemented");
        }
        const res = await fetch(`/api/finance/expenses/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify(expense)
        });
        return handleFetchResponse<Expense>(res);
    },
    addPayment: async (data: {
        type: 'RECEIPT' | 'PAYMENT',
        party_code: string,
        amount: number,
        date: string,
        remarks: string
    }): Promise<CashTransaction> => {
        if (USE_MOCK) {
            await delay(300);
            return {} as CashTransaction;
        }
        const res = await fetch('/api/finance/payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify(data)
        });
        return handleFetchResponse<CashTransaction>(res);
    },
    updateTransaction: async (id: number, data: {
        trans_type: 'RECEIPT' | 'PAYMENT',
        party_code: string,
        amount: number,
        trans_date: string,
        description: string
    }): Promise<CashTransaction> => {
        if (USE_MOCK) {
            await delay(300);
            throw new Error("Mock update not implemented");
        }
        const res = await fetch(`/api/finance/transactions/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify(data)
        });
        return handleFetchResponse<CashTransaction>(res);
    },
    // Expense Heads
    getExpenseHeads: async (): Promise<ExpenseHead[]> => {
        if (USE_MOCK) {
            await delay(300);
            return [];
        }
        const res = await fetch('/api/finance/expense-heads', {
            headers: getAuthHeaders()
        });
        return handleFetchResponse<ExpenseHead[]>(res);
    },
    addExpenseHead: async (head: Omit<ExpenseHead, 'head_id'>): Promise<ExpenseHead> => {
        if (USE_MOCK) {
            await delay(300);
            return {} as ExpenseHead;
        }
        const res = await fetch('/api/finance/expense-heads', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify(head)
        });
        return handleFetchResponse<ExpenseHead>(res);
    },
    updateExpenseHead: async (code: string, head: Partial<ExpenseHead>): Promise<ExpenseHead> => {
        if (USE_MOCK) {
            await delay(300);
            throw new Error("Mock update not implemented");
        }
        const res = await fetch(`/api/finance/expense-heads/${code}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify(head)
        });
        return handleFetchResponse<ExpenseHead>(res);
    },
    deleteExpenseHead: async (code: string): Promise<{ message: string }> => {
        if (USE_MOCK) {
            await delay(300);
            return { message: 'Deleted' };
        }
        const res = await fetch(`/api/finance/expense-heads/${code}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        return handleFetchResponse<{ message: string }>(res);
    },
    // Tax Rates
    getTaxRates: async (): Promise<TaxRate[]> => {
        if (USE_MOCK) {
            await delay(300);
            return [];
        }
        const res = await fetch('/api/finance/tax-rates', {
            headers: getAuthHeaders()
        });
        return handleFetchResponse<TaxRate[]>(res);
    },
    getTaxRate: async (code: string): Promise<TaxRate> => {
        if (USE_MOCK) {
            await delay(300);
            return {} as TaxRate;
        }
        const res = await fetch(`/api/finance/tax-rates/${code}`, {
            headers: getAuthHeaders()
        });
        return handleFetchResponse<TaxRate>(res);
    },
    addTaxRate: async (taxRate: Omit<TaxRate, 'tax_id'>): Promise<TaxRate> => {
        if (USE_MOCK) {
            await delay(300);
            return {} as TaxRate;
        }
        const res = await fetch('/api/finance/tax-rates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify(taxRate)
        });
        return handleFetchResponse<TaxRate>(res);
    },
    updateTaxRate: async (code: string, taxRate: Partial<TaxRate>): Promise<TaxRate> => {
        if (USE_MOCK) {
            await delay(300);
            throw new Error("Mock update not implemented");
        }
        const res = await fetch(`/api/finance/tax-rates/${code}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify(taxRate)
        });
        return handleFetchResponse<TaxRate>(res);
    },
    deleteTaxRate: async (code: string): Promise<{ message: string }> => {
        if (USE_MOCK) {
            await delay(300);
            return { message: 'Deleted' };
        }
        const res = await fetch(`/api/finance/tax-rates/${code}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        return handleFetchResponse<{ message: string }>(res);
    },
    // Opening Cash Balance
    getOpeningBalance: async (): Promise<any> => {
        if (USE_MOCK) {
            await delay(300);
            return null;
        }
        const res = await fetch('/api/finance/opening-balance', {
            headers: getAuthHeaders()
        });
        return handleFetchResponse<any>(res);
    },
    setOpeningBalance: async (balance: { balance_date: string, opening_amount: number, closing_amount?: number }): Promise<any> => {
        if (USE_MOCK) {
            await delay(300);
            return {};
        }
        const res = await fetch('/api/finance/opening-balance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify(balance)
        });
        return handleFetchResponse<any>(res);
    },
    // Loans
    getLoans: async (page: number = 1, limit: number = 10): Promise<{ data: LoanTaken[], pagination: any }> => {
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
        const res = await fetch(`/api/finance/loans?page=${page}&limit=${limit}`, {
            headers: getAuthHeaders()
        });
        return handleFetchResponse<{ data: LoanTaken[], pagination: any }>(res);
    },
    addLoan: async (loan: Omit<LoanTaken, 'loan_id'>): Promise<LoanTaken> => {
        if (USE_MOCK) {
            await delay(300);
            return {} as LoanTaken;
        }
        const res = await fetch('/api/finance/loans', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify(loan)
        });
        return handleFetchResponse<LoanTaken>(res);
    },
    getLoanReturns: async (loanId: number): Promise<LoanReturn[]> => {
        if (USE_MOCK) {
            await delay(300);
            return [];
        }
        const res = await fetch(`/api/finance/loans/${loanId}/returns`, {
            headers: getAuthHeaders()
        });
        return handleFetchResponse<LoanReturn[]>(res);
    },
    addLoanReturn: async (loanReturn: Omit<LoanReturn, 'return_id'>): Promise<LoanReturn> => {
        if (USE_MOCK) {
            await delay(300);
            return {} as LoanReturn;
        }
        const res = await fetch('/api/finance/loan-returns', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify(loanReturn)
        });
        return handleFetchResponse<LoanReturn>(res);
    }
};