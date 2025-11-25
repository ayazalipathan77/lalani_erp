

import { 
  Product, 
  Customer, 
  Supplier, 
  SalesInvoice, 
  Expense, 
  CashTransaction, 
  Category,
  SalesInvoiceItem,
  User
} from '../types';
import { 
  mockProducts, 
  mockCustomers, 
  mockSuppliers, 
  mockInvoices, 
  mockExpenses, 
  mockCashTransactions,
  mockCategories,
  mockUsers
} from './mockData';

const USE_MOCK = false; // Set to false to connect to Render Backend

// --- MOCK STATE MANAGEMENT ---
// We initialize local state from mockData to allow mutations during the session
let _products = [...mockProducts];
let _customers = [...mockCustomers];
let _suppliers = [...mockSuppliers];
let _invoices = [...mockInvoices];
let _expenses = [...mockExpenses];
let _transactions = [...mockCashTransactions];
let _categories = [...mockCategories];
let _users = [...mockUsers];

// Helper to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
  // --- AUTHENTICATION ---
  auth: {
    login: async (username: string, password: string): Promise<User> => {
      if (USE_MOCK) {
        await delay(500);
        const cleanUsername = username.trim().toLowerCase();
        const user = _users.find(u => 
          u.username.toLowerCase() === cleanUsername && 
          u.password === password && 
          u.is_active === 'Y'
        );
        if (user) {
          const { password, ...userWithoutPass } = user;
          return userWithoutPass as User;
        }
        throw new Error('Invalid credentials');
      }
      const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
      });
      if (!res.ok) throw new Error('Login failed');
      return res.json();
    }
  },

  // --- USERS MANAGEMENT ---
  users: {
      getAll: async (): Promise<User[]> => {
          if (USE_MOCK) {
              await delay(300);
              return _users.map(({password, ...u}) => u as User);
          }
          const res = await fetch('/api/users');
          return res.json();
      },
      create: async (user: Omit<User, 'user_id'>): Promise<User> => {
          if (USE_MOCK) {
              await delay(300);
              if (_users.some(u => u.username.toLowerCase() === user.username.toLowerCase())) {
                  throw new Error("Username already exists");
              }
              const newUser = { ...user, user_id: Math.max(0, ..._users.map(u => u.user_id)) + 1 };
              _users.push(newUser);
              const { password, ...safeUser } = newUser;
              return safeUser as User;
          }
          const res = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user)
          });
          if(!res.ok) throw new Error('Failed to create user');
          return res.json();
      },
      update: async (id: number, data: Partial<User>): Promise<User> => {
          if (USE_MOCK) {
              await delay(300);
              const idx = _users.findIndex(u => u.user_id === id);
              if (idx !== -1) {
                  _users[idx] = { ..._users[idx], ...data };
                   const { password, ...safeUser } = _users[idx];
                  return safeUser as User;
              }
              throw new Error("User not found");
          }
          const res = await fetch(`/api/users/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });
          return res.json();
      },
      delete: async (id: number): Promise<void> => {
          if (USE_MOCK) {
              await delay(300);
              _users = _users.filter(u => u.user_id !== id);
              return;
          }
          await fetch(`/api/users/${id}`, { method: 'DELETE' });
      }
  },

  // --- INVENTORY ---
  products: {
    getAll: async (): Promise<Product[]> => {
      if (USE_MOCK) {
        await delay(300);
        return [..._products];
      }
      const res = await fetch('/api/products');
      return res.json();
    },
    create: async (product: Omit<Product, 'prod_id'>): Promise<Product> => {
      if (USE_MOCK) {
        await delay(300);
        const newProduct = { ...product, prod_id: Math.max(0, ..._products.map(p => p.prod_id)) + 1 };
        _products.push(newProduct);
        return newProduct;
      }
      const res = await fetch('/api/products', {
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
      const res = await fetch(`/api/products/${id}`, {
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
      await fetch(`/api/products/${id}`, { method: 'DELETE' });
    }
  },

  // --- PARTNERS (Customers & Suppliers) ---
  customers: {
    getAll: async (): Promise<Customer[]> => {
      if (USE_MOCK) {
        await delay(300);
        return [..._customers];
      }
      const res = await fetch('/api/customers');
      return res.json();
    },
    create: async (customer: Omit<Customer, 'cust_id'>): Promise<Customer> => {
        if (USE_MOCK) {
            await delay(300);
            const newCustomer = { ...customer, cust_id: Math.max(0, ..._customers.map(c => c.cust_id)) + 1 };
            _customers.push(newCustomer);
            return newCustomer;
        }
        const res = await fetch('/api/customers', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(customer)
        });
        return res.json();
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
        const res = await fetch(`/api/customers/${id}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
        return res.json();
    },
    delete: async (id: number): Promise<void> => {
        if (USE_MOCK) {
            await delay(300);
            _customers = _customers.filter(c => c.cust_id !== id);
            return;
        }
        await fetch(`/api/customers/${id}`, { method: 'DELETE' });
    }
  },
  suppliers: {
    getAll: async (): Promise<Supplier[]> => {
      if (USE_MOCK) {
        await delay(300);
        return [..._suppliers];
      }
      const res = await fetch('/api/suppliers');
      return res.json();
    },
    create: async (supplier: Omit<Supplier, 'supplier_id'>): Promise<Supplier> => {
        if (USE_MOCK) {
            await delay(300);
            const newSupplier = { ...supplier, supplier_id: Math.max(0, ..._suppliers.map(s => s.supplier_id)) + 1 };
            _suppliers.push(newSupplier);
            return newSupplier;
        }
        const res = await fetch('/api/suppliers', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(supplier)
        });
        return res.json();
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
        const res = await fetch(`/api/suppliers/${id}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
        return res.json();
    },
    delete: async (id: number): Promise<void> => {
        if (USE_MOCK) {
            await delay(300);
            _suppliers = _suppliers.filter(s => s.supplier_id !== id);
            return;
        }
        await fetch(`/api/suppliers/${id}`, { method: 'DELETE' });
    }
  },

  // --- SALES & INVOICES ---
  invoices: {
    getAll: async (): Promise<SalesInvoice[]> => {
      if (USE_MOCK) {
        await delay(300);
        return [..._invoices];
      }
      const res = await fetch('/api/invoices');
      return res.json();
    },
    create: async (invoiceData: { 
      cust_code: string; 
      items: SalesInvoiceItem[]; 
      date: string; 
      status: 'PAID' | 'PENDING' 
    }): Promise<SalesInvoice> => {
      if (USE_MOCK) {
        await delay(500);
        
        const subtotal = invoiceData.items.reduce((acc, item) => acc + item.line_total, 0);
        const tax = subtotal * 0.05;
        const total = subtotal + tax;
        const balance = invoiceData.status === 'PAID' ? 0 : total;

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

        invoiceData.items.forEach(item => {
            const prodIdx = _products.findIndex(p => p.prod_code === item.prod_code);
            if (prodIdx !== -1) {
                _products[prodIdx].current_stock -= item.quantity;
            }
        });

        if (invoiceData.status === 'PENDING') {
            const custIdx = _customers.findIndex(c => c.cust_code === invoiceData.cust_code);
            if (custIdx !== -1) {
                _customers[custIdx].outstanding_balance += total;
            }
        }

        if (invoiceData.status === 'PAID') {
            const trans: CashTransaction = {
                trans_id: Math.max(0, ..._transactions.map(t => t.trans_id)) + 1,
                trans_date: invoiceData.date,
                trans_type: 'SALES',
                description: `Cash Sale - ${newInvoice.inv_number} - ${invoiceData.cust_code}`,
                debit_amount: total, 
                credit_amount: 0
            };
            _transactions.unshift(trans);
        }

        return newInvoice;
      }
      
      const res = await fetch('/api/invoices', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(invoiceData)
      });
      if (!res.ok) throw new Error("Failed to create invoice");
      return res.json();
    }
  },

  // --- FINANCE ---
  finance: {
    getTransactions: async (): Promise<CashTransaction[]> => {
      if (USE_MOCK) {
        await delay(300);
        return [..._transactions];
      }
      const res = await fetch('/api/finance/transactions');
      return res.json();
    },
    getExpenses: async (): Promise<Expense[]> => {
      if (USE_MOCK) {
        await delay(300);
        return [..._expenses];
      }
      const res = await fetch('/api/finance/expenses');
      return res.json();
    },
    addExpense: async (expense: Omit<Expense, 'expense_id'>): Promise<Expense> => {
        if (USE_MOCK) {
            await delay(300);
            const newExpense: Expense = {
                ...expense,
                expense_id: Math.max(0, ..._expenses.map(e => e.expense_id)) + 1
            };
            _expenses.unshift(newExpense);

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
        const res = await fetch('/api/finance/expenses', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
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
            
            const trans: CashTransaction = {
                trans_id: Math.max(0, ..._transactions.map(t => t.trans_id)) + 1,
                trans_date: data.date,
                trans_type: data.type,
                description: `${data.type}: ${data.party_code} - ${data.remarks}`,
                debit_amount: data.type === 'RECEIPT' ? data.amount : 0,
                credit_amount: data.type === 'PAYMENT' ? data.amount : 0
            };
            _transactions.unshift(trans);

            if (data.type === 'RECEIPT') {
                const custIdx = _customers.findIndex(c => c.cust_code === data.party_code);
                if (custIdx !== -1) {
                    _customers[custIdx].outstanding_balance -= data.amount;
                }
            } else {
                const supIdx = _suppliers.findIndex(s => s.supplier_code === data.party_code);
                if (supIdx !== -1) {
                    _suppliers[supIdx].outstanding_balance -= data.amount;
                }
            }
            return trans;
        }
        const res = await fetch('/api/finance/payment', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
        return res.json();
    }
  },

  // --- CATEGORIES ---
  categories: {
      getAll: async (): Promise<Category[]> => {
          if(USE_MOCK) return [..._categories];
          const res = await fetch('/api/categories');
          return res.json();
      }
  }
};