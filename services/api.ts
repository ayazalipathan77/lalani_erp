
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

// CRITICAL: Set to false to use real backend
const USE_MOCK = false;

// --- MOCK STATE MANAGEMENT (Kept for reference or fallback, but unused when USE_MOCK=false) ---
let _products = [...mockProducts];
let _customers = [...mockCustomers];
let _suppliers = [...mockSuppliers];
let _invoices = [...mockInvoices];
let _expenses = [...mockExpenses];
let _transactions = [...mockCashTransactions];
let _categories = [...mockCategories];
let _users = [...mockUsers];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to get auth headers
const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('authToken');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export const api = {
  // --- AUTHENTICATION ---
  auth: {
    login: async (username: string, password: string): Promise<{ user: User; token: string }> => {
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
          return { user: userWithoutPass as User, token: 'mock-token' };
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
    },
    verify: async (token: string): Promise<{ valid: boolean; userId?: number; username?: string }> => {
      if (USE_MOCK) {
        await delay(300);
        return { valid: true, userId: 1, username: 'admin' };
      }
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      return res.json();
    },
    // WebAuthn biometric authentication
    webauthn: {
      registerStart: async (username: string): Promise<any> => {
        if (USE_MOCK) {
          await delay(300);
          return { challenge: 'mock-challenge', rp: { name: 'Lalani ERP' } };
        }
        const res = await fetch('/api/auth/webauthn/register-start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username })
        });
        if (!res.ok) throw new Error('Failed to start registration');
        return res.json();
      },
      registerFinish: async (username: string, credential: any): Promise<any> => {
        if (USE_MOCK) {
          await delay(300);
          return { success: true, message: 'Biometric registration successful' };
        }
        const res = await fetch('/api/auth/webauthn/register-finish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, credential })
        });
        if (!res.ok) throw new Error('Failed to complete registration');
        return res.json();
      },
      loginStart: async (username: string): Promise<any> => {
        if (USE_MOCK) {
          await delay(300);
          return { challenge: 'mock-challenge', allowCredentials: [] };
        }
        const res = await fetch('/api/auth/webauthn/login-start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username })
        });
        if (!res.ok) throw new Error('Failed to start authentication');
        return res.json();
      },
      loginFinish: async (username: string, credential: any): Promise<{ user: User; token: string }> => {
        if (USE_MOCK) {
          await delay(300);
          const user = _users.find(u => u.username === username);
          if (user) {
            const { password, ...userWithoutPass } = user;
            return { user: userWithoutPass as User, token: 'mock-token' };
          }
          throw new Error('Authentication failed');
        }
        const res = await fetch('/api/auth/webauthn/login-finish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, credential })
        });
        if (!res.ok) throw new Error('Authentication failed');
        return res.json();
      },
      getCredentials: async (): Promise<any[]> => {
        if (USE_MOCK) {
          await delay(300);
          return [];
        }
        const res = await fetch('/api/auth/webauthn/credentials', {
          headers: getAuthHeaders()
        });
        if (!res.ok) throw new Error('Failed to fetch credentials');
        return res.json();
      },
      deleteCredential: async (id: string): Promise<void> => {
        if (USE_MOCK) {
          await delay(300);
          return;
        }
        const res = await fetch(`/api/auth/webauthn/credentials/${id}`, {
          method: 'DELETE',
          headers: getAuthHeaders()
        });
        if (!res.ok) throw new Error('Failed to delete credential');
      }
    }
  },

  // --- USERS MANAGEMENT ---
  users: {
    getAll: async (page: number = 1, limit: number = 8): Promise<{ data: User[], pagination: any }> => {
      if (USE_MOCK) {
        await delay(300);
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedUsers = _users.slice(startIndex, endIndex).map(({ password, ...u }) => u as User);
        return {
          data: paginatedUsers,
          pagination: {
            page,
            limit,
            total: _users.length,
            totalPages: Math.ceil(_users.length / limit)
          }
        };
      }
      const res = await fetch(`/api/users?page=${page}&limit=${limit}`);
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
      if (!res.ok) throw new Error('Failed to create user');
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
        _products.push(newProduct);
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
        const index = _products.findIndex(p => p.prod_id === id);
        if (index !== -1) {
          _products[index] = { ..._products[index], ...product };
          return _products[index];
        }
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
        _products = _products.filter(p => p.prod_id !== id);
        return;
      }
      await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
    }
  },

  // --- PARTNERS (Customers & Suppliers) ---
  customers: {
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
        _customers.push(newCustomer);
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
        const idx = _customers.findIndex(c => c.cust_id === id);
        if (idx !== -1) {
          _customers[idx] = { ..._customers[idx], ...data };
          return _customers[idx];
        }
        throw new Error("Customer not found");
      }
      const res = await fetch(`/api/customers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
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
    getAll: async (page: number = 1, limit: number = 8): Promise<{ data: Supplier[], pagination: any }> => {
      if (USE_MOCK) {
        await delay(300);
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedSuppliers = _suppliers.slice(startIndex, endIndex);
        return {
          data: paginatedSuppliers,
          pagination: {
            page,
            limit,
            total: _suppliers.length,
            totalPages: Math.ceil(_suppliers.length / limit)
          }
        };
      }
      const res = await fetch(`/api/suppliers?page=${page}&limit=${limit}`);
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
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
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
    getAll: async (page: number = 1, limit: number = 8): Promise<{ data: SalesInvoice[], pagination: any }> => {
      if (USE_MOCK) {
        await delay(300);
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedInvoices = _invoices.slice(startIndex, endIndex);
        return {
          data: paginatedInvoices,
          pagination: {
            page,
            limit,
            total: _invoices.length,
            totalPages: Math.ceil(_invoices.length / limit)
          }
        };
      }
      const res = await fetch(`/api/invoices?page=${page}&limit=${limit}`);
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
        // ... updates ...
        return newInvoice;
      }

      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoiceData)
      });
      if (!res.ok) throw new Error("Failed to create invoice");
      return res.json();
    }
  },

  // --- FINANCE ---
  finance: {
    getTransactions: async (page: number = 1, limit: number = 8): Promise<{ data: CashTransaction[], pagination: any }> => {
      if (USE_MOCK) {
        await delay(300);
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedTransactions = _transactions.slice(startIndex, endIndex);
        return {
          data: paginatedTransactions,
          pagination: {
            page,
            limit,
            total: _transactions.length,
            totalPages: Math.ceil(_transactions.length / limit)
          }
        };
      }
      const res = await fetch(`/api/finance/transactions?page=${page}&limit=${limit}`);
      return res.json();
    },
    getExpenses: async (page: number = 1, limit: number = 8): Promise<{ data: Expense[], pagination: any }> => {
      if (USE_MOCK) {
        await delay(300);
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedExpenses = _expenses.slice(startIndex, endIndex);
        return {
          data: paginatedExpenses,
          pagination: {
            page,
            limit,
            total: _expenses.length,
            totalPages: Math.ceil(_expenses.length / limit)
          }
        };
      }
      const res = await fetch(`/api/finance/expenses?page=${page}&limit=${limit}`);
      return res.json();
    },
    addExpense: async (expense: Omit<Expense, 'expense_id'>): Promise<Expense> => {
      if (USE_MOCK) {
        await delay(300);
        // ... mock implementation
        return {} as Expense;
      }
      const res = await fetch('/api/finance/expenses', {
        method: 'POST',
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
        // ... mock implementation
        return {} as CashTransaction;
      }
      const res = await fetch('/api/finance/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return res.json();
    }
  },

  // --- CATEGORIES ---
  categories: {
    getAll: async (): Promise<Category[]> => {
      if (USE_MOCK) return [..._categories];
      const res = await fetch('/api/categories', {
        headers: getAuthHeaders()
      });
      return res.json();
    }
  },

  // --- ANALYTICS ---
  analytics: {
    getDashboardMetrics: async (): Promise<{
      totalRevenue: number;
      pendingReceivables: number;
      lowStockCount: number;
      customerCount: number;
      recentInvoices: any[];
      topProducts: any[];
      salesByCategory: any[];
    }> => {
      if (USE_MOCK) {
        return {
          totalRevenue: 2500000,
          pendingReceivables: 150000,
          lowStockCount: 5,
          customerCount: 25,
          recentInvoices: [],
          topProducts: [],
          salesByCategory: []
        };
      }
      const res = await fetch('/api/analytics/dashboard-metrics', {
        headers: getAuthHeaders()
      });
      return res.json();
    },
    getSalesTrends: async (): Promise<{ name: string; sales: number }[]> => {
      if (USE_MOCK) {
        return [
          { name: 'Jan', sales: 150000 },
          { name: 'Feb', sales: 180000 },
          { name: 'Mar', sales: 220000 },
          { name: 'Apr', sales: 190000 },
          { name: 'May', sales: 250000 },
          { name: 'Jun', sales: 280000 }
        ];
      }
      const res = await fetch('/api/analytics/sales-trends', {
        headers: getAuthHeaders()
      });
      return res.json();
    }
  }
};
