import { CashTransaction, Expense, ExpenseHead, TaxRate, LoanTaken, LoanReturn } from '../../../types';
import { USE_MOCK, delay, getAuthHeaders } from '../utils';

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
        const res = await fetch(`/api/finance/transactions?page=${page}&limit=${limit}`);
        return res.json();
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
        const res = await fetch(`/api/finance/expenses?page=${page}&limit=${limit}`);
        return res.json();
    },
    addExpense: async (expense: Omit<Expense, 'expense_id'>): Promise<Expense> => {
        if (USE_MOCK) {
            await delay(300);
            return {} as Expense;
        }
        const res = await fetch('/api/finance/expenses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(expense)
        });
        return res.json();
    },
    updateExpense: async (id: number, expense: Partial<Expense>): Promise<Expense> => {
        if (USE_MOCK) {
            await delay(300);
            throw new Error("Mock update not implemented");
        }
        const res = await fetch(`/api/finance/expenses/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(expense)
        });
        return res.json();
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
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return res.json();
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
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return res.json();
    },
    // Expense Heads
    getExpenseHeads: async (): Promise<ExpenseHead[]> => {
        if (USE_MOCK) {
            await delay(300);
            return [];
        }
        const res = await fetch('/api/finance/expense-heads');
        return res.json();
    },
    addExpenseHead: async (head: Omit<ExpenseHead, 'head_id'>): Promise<ExpenseHead> => {
        if (USE_MOCK) {
            await delay(300);
            return {} as ExpenseHead;
        }
        const res = await fetch('/api/finance/expense-heads', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(head)
        });
        return res.json();
    },
    updateExpenseHead: async (code: string, head: Partial<ExpenseHead>): Promise<ExpenseHead> => {
        if (USE_MOCK) {
            await delay(300);
            throw new Error("Mock update not implemented");
        }
        const res = await fetch(`/api/finance/expense-heads/${code}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(head)
        });
        return res.json();
    },
    deleteExpenseHead: async (code: string): Promise<{ message: string }> => {
        if (USE_MOCK) {
            await delay(300);
            return { message: 'Deleted' };
        }
        const res = await fetch(`/api/finance/expense-heads/${code}`, {
            method: 'DELETE'
        });
        return res.json();
    },
    // Tax Rates
    getTaxRates: async (): Promise<TaxRate[]> => {
        if (USE_MOCK) {
            await delay(300);
            return [];
        }
        const res = await fetch('/api/finance/tax-rates');
        return res.json();
    },
    getTaxRate: async (code: string): Promise<TaxRate> => {
        if (USE_MOCK) {
            await delay(300);
            return {} as TaxRate;
        }
        const res = await fetch(`/api/finance/tax-rates/${code}`);
        return res.json();
    },
    addTaxRate: async (taxRate: Omit<TaxRate, 'tax_id'>): Promise<TaxRate> => {
        if (USE_MOCK) {
            await delay(300);
            return {} as TaxRate;
        }
        const res = await fetch('/api/finance/tax-rates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(taxRate)
        });
        return res.json();
    },
    updateTaxRate: async (code: string, taxRate: Partial<TaxRate>): Promise<TaxRate> => {
        if (USE_MOCK) {
            await delay(300);
            throw new Error("Mock update not implemented");
        }
        const res = await fetch(`/api/finance/tax-rates/${code}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(taxRate)
        });
        return res.json();
    },
    deleteTaxRate: async (code: string): Promise<{ message: string }> => {
        if (USE_MOCK) {
            await delay(300);
            return { message: 'Deleted' };
        }
        const res = await fetch(`/api/finance/tax-rates/${code}`, {
            method: 'DELETE'
        });
        return res.json();
    },
    // Opening Cash Balance
    getOpeningBalance: async (): Promise<any> => {
        if (USE_MOCK) {
            await delay(300);
            return null;
        }
        const res = await fetch('/api/finance/opening-balance');
        return res.json();
    },
    setOpeningBalance: async (balance: { balance_date: string, opening_amount: number, closing_amount?: number }): Promise<any> => {
        if (USE_MOCK) {
            await delay(300);
            return {};
        }
        const res = await fetch('/api/finance/opening-balance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(balance)
        });
        return res.json();
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
        const res = await fetch(`/api/finance/loans?page=${page}&limit=${limit}`);
        return res.json();
    },
    addLoan: async (loan: Omit<LoanTaken, 'loan_id'>): Promise<LoanTaken> => {
        if (USE_MOCK) {
            await delay(300);
            return {} as LoanTaken;
        }
        const res = await fetch('/api/finance/loans', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(loan)
        });
        return res.json();
    },
    getLoanReturns: async (loanId: number): Promise<LoanReturn[]> => {
        if (USE_MOCK) {
            await delay(300);
            return [];
        }
        const res = await fetch(`/api/finance/loans/${loanId}/returns`);
        return res.json();
    },
    addLoanReturn: async (loanReturn: Omit<LoanReturn, 'return_id'>): Promise<LoanReturn> => {
        if (USE_MOCK) {
            await delay(300);
            return {} as LoanReturn;
        }
        const res = await fetch('/api/finance/loan-returns', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(loanReturn)
        });
        return res.json();
    }
};