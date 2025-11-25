import { 
  Product, 
  Customer, 
  Supplier, 
  SalesInvoice, 
  Expense, 
  CashTransaction, 
  Category,
  SalesInvoiceItem
} from '../types';
import { 
  mockProducts, 
  mockCustomers, 
  mockSuppliers, 
  mockInvoices, 
  mockExpenses, 
  mockCashTransactions,
  mockCategories 
} from './mockData';

const USE_MOCK = true; // Toggle this to false when connecting to real backend

// --- MOCK STATE MANAGEMENT ---
// We initialize local state from mockData to allow mutations during the session
let _products = [...mockProducts];
let _customers = [...mockCustomers];
let _suppliers = [...mockSuppliers];
let _invoices = [...mockInvoices];
let _expenses = [...mockExpenses];
let _transactions = [...mockCashTransactions];
let _categories = [...mockCategories];

// Helper to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
  // --- INVENTORY ---
  products: {
    getAll: async (): Promise<Product[]> => {
      if (USE_MOCK) {
        await delay(300);
        return [..._products];
      }
      const res = await fetch('http://localhost:5000/api/products');
      return res.json();
    },
    create: async (product: Omit<Product, 'prod_id'>): Promise<Product> => {
      if (USE_MOCK) {
        await delay(300);
        const newProduct = { ...product, prod_id: Math.max(0, ..._products.map(p => p.prod_id)) + 1 };
        _products.push(newProduct);
        return newProduct;
      }
      const res = await fetch('http://localhost:5000/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      });
      return res.json();
    },
    update: async (id: number, product: Partial<Product>): Promise<Product> => {
      if (USE_MOCK) {
        await delay(300);
        const index = _products.findIndex(p => p.prod_id === id);
        if (index !== -1) {
          _products[index] = { ..._products[index], ...product };
          return _products[index];
        }
        throw new Error('Product not found');
      }
      const res = await fetch(`http://localhost:5000/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      });
      return res.json();
    },
    delete: async (id: number): Promise<void> => {
      if (USE_MOCK) {
        await delay(300);
        _products = _products.filter(p => p.prod_id !== id);
        return;
      }
      await fetch(`http://localhost:5000/api/products/${id}`, { method: 'DELETE' });
    }
  },

  // --- PARTNERS (Customers & Suppliers) ---
  customers: {
    getAll: async (): Promise<Customer[]> => {
      if (USE_MOCK) {
        await delay(300);
        return [..._customers];
      }
      const res = await fetch('http://localhost:5000/api/customers');
      return res.json();
    },
    create: async (customer: Omit<Customer, 'cust_id'>): Promise<Customer> => {
        if (USE_MOCK) {
            await delay(300);
            const newCustomer = { ...customer, cust_id: Math.max(0, ..._customers.map(c => c.cust_id)) + 1 };
            _customers.push(newCustomer);
            return newCustomer;
        }
        // Real API call would go here
        return {} as Customer;
    },
    update: async (id: number, data: Partial<Customer>): Promise<Customer> => {
        if (USE_MOCK) {
            await delay(300);
            const idx = _customers.findIndex(c => c.cust_id === id);
            if (idx !== -1) {
                _customers[idx] = { ..._customers[idx], ...data };
                return _customers[idx];
            }
            throw new Error("Customer not found");
        }
        return {} as Customer;
    },
    delete: async (id: number): Promise<void> => {
        if (USE_MOCK) {
            await delay(300);
            _customers = _customers.filter(c => c.cust_id !== id);
            return;
        }
    }
  },
  suppliers: {
    getAll: async (): Promise<Supplier[]> => {
      if (USE_MOCK) {
        await delay(300);
        return [..._suppliers];
      }
      const res = await fetch('http://localhost:5000/api/suppliers');
      return res.json();
    },
    create: async (supplier: Omit<Supplier, 'supplier_id'>): Promise<Supplier> => {
        if (USE_MOCK) {
            await delay(300);
            const newSupplier = { ...supplier, supplier_id: Math.max(0, ..._suppliers.map(s => s.supplier_id)) + 1 };
            _suppliers.push(newSupplier);
            return newSupplier;
        }
        return {} as Supplier;
    },
    update: async (id: number, data: Partial<Supplier>): Promise<Supplier> => {
        if (USE_MOCK) {
            await delay(300);
            const idx = _suppliers.findIndex(s => s.supplier_id === id);
            if (idx !== -1) {
                _suppliers[idx] = { ..._suppliers[idx], ...data };
                return _suppliers[idx];
            }
            throw new Error("Supplier not found");
        }
        return {} as Supplier;
    },
    delete: async (id: number): Promise<void> => {
        if (USE_MOCK) {
            await delay(300);
            _suppliers = _suppliers.filter(s => s.supplier_id !== id);
            return;
        }
    }
  },

  // --- SALES & INVOICES ---
  invoices: {
    getAll: async (): Promise<SalesInvoice[]> => {
      if (USE_MOCK) {
        await delay(300);
        return [..._invoices];
      }
      const res = await fetch('http://localhost:5000/api/invoices');
      return res.json();
    },
    create: async (invoiceData: { 
      cust_code: string; 
      items: SalesInvoiceItem[]; 
      date: string; 
      status: 'PAID' | 'PENDING' 
    }): Promise<SalesInvoice> => {
      if (USE_MOCK) {
        await delay(500); // Simulate processing
        
        // 1. Calculate Totals
        const subtotal = invoiceData.items.reduce((acc, item) => acc + item.line_total, 0);
        const tax = subtotal * 0.05; // 5% tax
        const total = subtotal + tax;
        const balance = invoiceData.status === 'PAID' ? 0 : total;

        // 2. Create Invoice
        const newInvoice: SalesInvoice = {
            inv_id: Math.max(0, ..._invoices.map(i => i.inv_id)) + 1,
            inv_number: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
            inv_date: invoiceData.date,
            cust_code: invoiceData.cust_code,
            total_amount: total,
            balance_due: balance,
            status: invoiceData.status,
            items: invoiceData.items
        };
        _invoices.unshift(newInvoice);

        // 3. Update Inventory (Reduce Stock)
        invoiceData.items.forEach(item => {
            const prodIdx = _products.findIndex(p => p.prod_code === item.prod_code);
            if (prodIdx !== -1) {
                _products[prodIdx].current_stock -= item.quantity;
            }
        });

        // 4. Update Customer Balance (if Pending)
        if (invoiceData.status === 'PENDING') {
            const custIdx = _customers.findIndex(c => c.cust_code === invoiceData.cust_code);
            if (custIdx !== -1) {
                _customers[custIdx].outstanding_balance += total;
            }
        }

        // 5. Update Ledger (if Paid)
        if (invoiceData.status === 'PAID') {
            const trans: CashTransaction = {
                trans_id: Math.max(0, ..._transactions.map(t => t.trans_id)) + 1,
                trans_date: invoiceData.date,
                trans_type: 'SALES',
                description: `Cash Sale - ${newInvoice.inv_number} - ${invoiceData.cust_code}`,
                debit_amount: total, // Money In
                credit_amount: 0
            };
            _transactions.unshift(trans);
        }

        return newInvoice;
      }
      // Real API implementation omitted
      return {} as SalesInvoice;
    }
  },

  // --- FINANCE ---
  finance: {
    getTransactions: async (): Promise<CashTransaction[]> => {
      if (USE_MOCK) {
        await delay(300);
        return [..._transactions];
      }
      return [];
    },
    getExpenses: async (): Promise<Expense[]> => {
      if (USE_MOCK) {
        await delay(300);
        return [..._expenses];
      }
      return [];
    },
    addExpense: async (expense: Omit<Expense, 'expense_id'>): Promise<Expense> => {
        if (USE_MOCK) {
            await delay(300);
            const newExpense: Expense = {
                ...expense,
                expense_id: Math.max(0, ..._expenses.map(e => e.expense_id)) + 1
            };
            _expenses.unshift(newExpense);

            // Add to Ledger
            const trans: CashTransaction = {
                trans_id: Math.max(0, ..._transactions.map(t => t.trans_id)) + 1,
                trans_date: expense.expense_date,
                trans_type: 'EXPENSE',
                description: `EXP: ${expense.head_code} - ${expense.remarks}`,
                debit_amount: 0,
                credit_amount: expense.amount
            };
            _transactions.unshift(trans);
            return newExpense;
        }
        return {} as Expense;
    },
    // Handles Money In (Receipts) and Money Out (Supplier Payments)
    addPayment: async (data: { 
        type: 'RECEIPT' | 'PAYMENT', 
        party_code: string, 
        amount: number, 
        date: string, 
        remarks: string 
    }): Promise<CashTransaction> => {
        if (USE_MOCK) {
            await delay(300);
            
            // 1. Create Ledger Entry
            const trans: CashTransaction = {
                trans_id: Math.max(0, ..._transactions.map(t => t.trans_id)) + 1,
                trans_date: data.date,
                trans_type: data.type,
                description: `${data.type}: ${data.party_code} - ${data.remarks}`,
                debit_amount: data.type === 'RECEIPT' ? data.amount : 0,
                credit_amount: data.type === 'PAYMENT' ? data.amount : 0
            };
            _transactions.unshift(trans);

            // 2. Update Party Balance
            if (data.type === 'RECEIPT') {
                // Customer paying us, balance decreases
                const custIdx = _customers.findIndex(c => c.cust_code === data.party_code);
                if (custIdx !== -1) {
                    _customers[custIdx].outstanding_balance -= data.amount;
                }
            } else {
                // We paying Supplier, balance decreases
                const supIdx = _suppliers.findIndex(s => s.supplier_code === data.party_code);
                if (supIdx !== -1) {
                    _suppliers[supIdx].outstanding_balance -= data.amount;
                }
            }
            return trans;
        }
        return {} as CashTransaction;
    }
  },

  // --- CATEGORIES ---
  categories: {
      getAll: async (): Promise<Category[]> => {
          if(USE_MOCK) return [..._categories];
          return [];
      }
  }
};
