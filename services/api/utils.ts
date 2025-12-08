import { mockProducts, mockCustomers, mockSuppliers, mockInvoices, mockExpenses, mockCashTransactions, mockCategories, mockUsers } from '../mockData';

// CRITICAL: Set to false to use real backend
export const USE_MOCK = false;

// --- MOCK STATE MANAGEMENT (Kept for reference or fallback, but unused when USE_MOCK=false) ---
export const _products = [...mockProducts];
export const _customers = [...mockCustomers];
export const _suppliers = [...mockSuppliers];
export const _invoices = [...mockInvoices];
export const _expenses = [...mockExpenses];
export const _transactions = [...mockCashTransactions];
export const _categories = [...mockCategories];
export const _users = [...mockUsers];

// Helper functions to mutate mock data
export const addUser = (user: any) => _users.push(user);
export const removeUser = (id: number) => {
    const index = _users.findIndex(u => u.user_id === id);
    if (index !== -1) _users.splice(index, 1);
};
export const updateUser = (id: number, data: any) => {
    const index = _users.findIndex(u => u.user_id === id);
    if (index !== -1) Object.assign(_users[index], data);
};

export const addProduct = (product: any) => _products.push(product);
export const removeProduct = (id: number) => {
    const index = _products.findIndex(p => p.prod_id === id);
    if (index !== -1) _products.splice(index, 1);
};
export const updateProduct = (id: number, data: any) => {
    const index = _products.findIndex(p => p.prod_id === id);
    if (index !== -1) Object.assign(_products[index], data);
};

export const addCustomer = (customer: any) => _customers.push(customer);
export const removeCustomer = (id: number) => {
    const index = _customers.findIndex(c => c.cust_id === id);
    if (index !== -1) _customers.splice(index, 1);
};
export const updateCustomer = (id: number, data: any) => {
    const index = _customers.findIndex(c => c.cust_id === id);
    if (index !== -1) Object.assign(_customers[index], data);
};

export const addSupplier = (supplier: any) => _suppliers.push(supplier);
export const removeSupplier = (id: number) => {
    const index = _suppliers.findIndex(s => s.supplier_id === id);
    if (index !== -1) _suppliers.splice(index, 1);
};
export const updateSupplier = (id: number, data: any) => {
    const index = _suppliers.findIndex(s => s.supplier_id === id);
    if (index !== -1) Object.assign(_suppliers[index], data);
};

export const addInvoice = (invoice: any) => _invoices.push(invoice);
export const removeInvoice = (id: number) => {
    const index = _invoices.findIndex(i => i.inv_id === id);
    if (index !== -1) _invoices.splice(index, 1);
};
export const updateInvoice = (id: number, data: any) => {
    const index = _invoices.findIndex(i => i.inv_id === id);
    if (index !== -1) Object.assign(_invoices[index], data);
};

export const addExpense = (expense: any) => _expenses.push(expense);
export const removeExpense = (id: number) => {
    const index = _expenses.findIndex(e => e.expense_id === id);
    if (index !== -1) _expenses.splice(index, 1);
};
export const updateExpense = (id: number, data: any) => {
    const index = _expenses.findIndex(e => e.expense_id === id);
    if (index !== -1) Object.assign(_expenses[index], data);
};

export const addTransaction = (transaction: any) => _transactions.push(transaction);
export const removeTransaction = (id: number) => {
    const index = _transactions.findIndex(t => t.trans_id === id);
    if (index !== -1) _transactions.splice(index, 1);
};
export const updateTransaction = (id: number, data: any) => {
    const index = _transactions.findIndex(t => t.trans_id === id);
    if (index !== -1) Object.assign(_transactions[index], data);
};

export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to get auth headers
export const getAuthHeaders = (): Record<string, string> => {
    const token = localStorage.getItem('authToken');
    const selectedCompany = localStorage.getItem('selectedCompany') || 'CMP01';
    const headers: Record<string, string> = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    headers['X-Company-Code'] = selectedCompany;
    return headers;
};