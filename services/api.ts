
import {
  Product,
  Customer,
  Supplier,
  SalesInvoice,
  Expense,
  CashTransaction,
  Category,
  SalesInvoiceItem,
  User,
  SalesReturn,
  SalesReturnItem,
  PurchaseInvoice,
  PurchaseInvoiceItem,
  PaymentReceipt,
  SupplierPayment,
  DiscountVoucher,
  OpeningCashBalance,
  LoanTaken,
  LoanReturn,
  ExpenseHead,
  SystemBackup,
  Company,
  TaxRate
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
    },
    update: async (id: number, invoiceData: {
      cust_code: string;
      items: SalesInvoiceItem[];
      inv_date: string;
      status: 'PAID' | 'PENDING'
    }): Promise<SalesInvoice> => {
      if (USE_MOCK) {
        await delay(500);
        // Mock implementation would be complex, skipping for now
        throw new Error("Mock update not implemented");
      }

      const res = await fetch(`/api/invoices/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoiceData)
      });
      if (!res.ok) throw new Error("Failed to update invoice");
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
    updateExpense: async (id: number, expense: Partial<Expense>): Promise<Expense> => {
      if (USE_MOCK) {
        await delay(300);
        // Mock implementation would be complex, skipping for now
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
        // ... mock implementation
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
        // Mock implementation would be complex, skipping for now
        throw new Error("Mock update not implemented");
      }
      const res = await fetch(`/api/finance/transactions/${id}`, {
        method: 'PUT',
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
  },

  // --- NEW API ENDPOINTS FOR PHASE 3 ---
  salesReturns: {
    getAll: async (page: number = 1, limit: number = 8): Promise<{ data: SalesReturn[], pagination: any }> => {
      if (USE_MOCK) {
        await delay(300);
        return { data: [], pagination: { page, limit, total: 0, totalPages: 0 } };
      }
      const res = await fetch(`/api/sales-returns?page=${page}&limit=${limit}`);
      return res.json();
    },
    create: async (returnData: {
      inv_id: number;
      items: SalesReturnItem[];
      return_date: string;
    }): Promise<SalesReturn> => {
      if (USE_MOCK) {
        await delay(500);
        return {} as SalesReturn;
      }
      const res = await fetch('/api/sales-returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(returnData)
      });
      return res.json();
    }
  },

  purchaseInvoices: {
    getAll: async (page: number = 1, limit: number = 8): Promise<{ data: PurchaseInvoice[], pagination: any }> => {
      if (USE_MOCK) {
        await delay(300);
        return { data: [], pagination: { page, limit, total: 0, totalPages: 0 } };
      }
      const res = await fetch(`/api/purchase-invoices?page=${page}&limit=${limit}`);
      return res.json();
    },
    create: async (purchaseData: {
      supplier_code: string;
      items: PurchaseInvoiceItem[];
      purchase_date: string;
    }): Promise<PurchaseInvoice> => {
      if (USE_MOCK) {
        await delay(500);
        return {} as PurchaseInvoice;
      }
      const res = await fetch('/api/purchase-invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(purchaseData)
      });
      return res.json();
    }
  },

  paymentReceipts: {
    getAll: async (page: number = 1, limit: number = 8): Promise<{ data: PaymentReceipt[], pagination: any }> => {
      if (USE_MOCK) {
        await delay(300);
        return { data: [], pagination: { page, limit, total: 0, totalPages: 0 } };
      }
      const res = await fetch(`/api/payment-receipts?page=${page}&limit=${limit}`);
      return res.json();
    },
    create: async (receiptData: {
      cust_code: string;
      amount: number;
      payment_method: string;
      reference_number: string;
      receipt_date: string;
    }): Promise<PaymentReceipt> => {
      if (USE_MOCK) {
        await delay(500);
        return {} as PaymentReceipt;
      }
      const res = await fetch('/api/payment-receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(receiptData)
      });
      return res.json();
    }
  },

  supplierPayments: {
    getAll: async (page: number = 1, limit: number = 8): Promise<{ data: SupplierPayment[], pagination: any }> => {
      if (USE_MOCK) {
        await delay(300);
        return { data: [], pagination: { page, limit, total: 0, totalPages: 0 } };
      }
      const res = await fetch(`/api/supplier-payments?page=${page}&limit=${limit}`);
      return res.json();
    },
    create: async (paymentData: {
      supplier_code: string;
      amount: number;
      payment_method: string;
      reference_number: string;
      payment_date: string;
    }): Promise<SupplierPayment> => {
      if (USE_MOCK) {
        await delay(500);
        return {} as SupplierPayment;
      }
      const res = await fetch('/api/supplier-payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData)
      });
      return res.json();
    }
  },

  discountVouchers: {
    getAll: async (page: number = 1, limit: number = 8): Promise<{ data: DiscountVoucher[], pagination: any }> => {
      if (USE_MOCK) {
        await delay(300);
        return { data: [], pagination: { page, limit, total: 0, totalPages: 0 } };
      }
      const res = await fetch(`/api/discount-vouchers?page=${page}&limit=${limit}`);
      return res.json();
    },
    create: async (voucherData: {
      cust_code: string;
      amount: number;
      reason: string;
      voucher_date: string;
    }): Promise<DiscountVoucher> => {
      if (USE_MOCK) {
        await delay(500);
        return {} as DiscountVoucher;
      }
      const res = await fetch('/api/discount-vouchers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(voucherData)
      });
      return res.json();
    }
  },

  openingCashBalance: {
    getCurrent: async (): Promise<OpeningCashBalance | null> => {
      if (USE_MOCK) {
        await delay(300);
        return {
          balance_id: 1,
          balance_date: new Date().toISOString().split('T')[0],
          opening_amount: 500000,
          closing_amount: 450000,
          status: 'OPEN'
        };
      }
      const res = await fetch('/api/finance/opening-balance');
      return res.json();
    },
    create: async (balanceData: {
      balance_date: string;
      opening_amount: number;
      closing_amount?: number;
    }): Promise<OpeningCashBalance> => {
      if (USE_MOCK) {
        await delay(500);
        return {
          balance_id: 1,
          balance_date: balanceData.balance_date,
          opening_amount: balanceData.opening_amount,
          closing_amount: balanceData.closing_amount || 0,
          status: 'OPEN'
        };
      }
      const res = await fetch('/api/finance/opening-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(balanceData)
      });
      return res.json();
    }
  },

  loanManagement: {
    getAll: async (page: number = 1, limit: number = 8): Promise<{ data: LoanTaken[], pagination: any }> => {
      if (USE_MOCK) {
        await delay(300);
        return { data: [], pagination: { page, limit, total: 0, totalPages: 0 } };
      }
      const res = await fetch(`/api/finance/loans?page=${page}&limit=${limit}`);
      return res.json();
    },
    create: async (loanData: {
      loan_number: string;
      loan_date: string;
      amount: number;
      interest_rate?: number;
      term_months?: number;
      lender_name: string;
    }): Promise<LoanTaken> => {
      if (USE_MOCK) {
        await delay(500);
        return {
          loan_id: 1,
          loan_number: loanData.loan_number,
          loan_date: loanData.loan_date,
          amount: loanData.amount,
          interest_rate: loanData.interest_rate || 0,
          term_months: loanData.term_months || 0,
          lender_name: loanData.lender_name,
          status: 'ACTIVE'
        };
      }
      const res = await fetch('/api/finance/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loanData)
      });
      return res.json();
    }
  },

  loanReturns: {
    getByLoan: async (loanId: number): Promise<LoanReturn[]> => {
      if (USE_MOCK) {
        await delay(300);
        return [];
      }
      const res = await fetch(`/api/finance/loans/${loanId}/returns`);
      return res.json();
    },
    create: async (returnData: {
      loan_id: number;
      return_date: string;
      amount: number;
      payment_method: string;
      reference_number: string;
    }): Promise<LoanReturn> => {
      if (USE_MOCK) {
        await delay(500);
        return {
          return_id: 1,
          loan_id: returnData.loan_id,
          return_date: returnData.return_date,
          amount: returnData.amount,
          payment_method: returnData.payment_method,
          reference_number: returnData.reference_number,
          status: 'COMPLETED'
        };
      }
      const res = await fetch('/api/finance/loan-returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(returnData)
      });
      return res.json();
    }
  },

  expenseHeads: {
    getAll: async (): Promise<ExpenseHead[]> => {
      if (USE_MOCK) {
        await delay(300);
        return [
          { head_code: 'FUEL', head_name: 'Fuel Expenses', description: 'Vehicle and equipment fuel costs', is_active: true },
          { head_code: 'UTIL', head_name: 'Utilities', description: 'Electricity, water, and gas bills', is_active: true },
          { head_code: 'RENT', head_name: 'Rent', description: 'Office and warehouse rental expenses', is_active: true }
        ];
      }
      const res = await fetch('/api/finance/expense-heads');
      return res.json();
    },
    create: async (headData: {
      head_code: string;
      head_name: string;
      description: string;
    }): Promise<ExpenseHead> => {
      if (USE_MOCK) {
        await delay(500);
        return {
          head_code: headData.head_code,
          head_name: headData.head_name,
          description: headData.description,
          is_active: true
        };
      }
      const res = await fetch('/api/finance/expense-heads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(headData)
      });
      return res.json();
    }
  },

  taxRates: {
    getAll: async (): Promise<TaxRate[]> => {
      if (USE_MOCK) {
        await delay(300);
        return [
          { tax_id: 1, tax_code: 'GST5', tax_name: 'GST 5%', tax_rate: 5.00, tax_type: 'GST', description: 'Standard GST rate', is_active: true },
          { tax_id: 2, tax_code: 'GST12', tax_name: 'GST 12%', tax_rate: 12.00, tax_type: 'GST', description: 'Higher GST rate', is_active: true },
          { tax_id: 3, tax_code: 'GST18', tax_name: 'GST 18%', tax_rate: 18.00, tax_type: 'GST', description: 'Highest GST rate', is_active: true },
          { tax_id: 4, tax_code: 'GST0', tax_name: 'GST Exempt', tax_rate: 0.00, tax_type: 'GST', description: 'GST exempted items', is_active: true }
        ];
      }
      const res = await fetch('/api/finance/tax-rates');
      return res.json();
    },
    getByCode: async (code: string): Promise<TaxRate> => {
      if (USE_MOCK) {
        await delay(300);
        return { tax_id: 1, tax_code: code, tax_name: 'GST 5%', tax_rate: 5.00, tax_type: 'GST', description: 'Standard GST rate', is_active: true };
      }
      const res = await fetch(`/api/finance/tax-rates/${code}`);
      return res.json();
    },
    create: async (taxData: {
      tax_code: string;
      tax_name: string;
      tax_rate: number;
      tax_type?: string;
      description?: string;
    }): Promise<TaxRate> => {
      if (USE_MOCK) {
        await delay(500);
        return {
          tax_id: Math.floor(Math.random() * 1000),
          tax_code: taxData.tax_code,
          tax_name: taxData.tax_name,
          tax_rate: taxData.tax_rate,
          tax_type: taxData.tax_type || 'GST',
          description: taxData.description || '',
          is_active: true
        };
      }
      const res = await fetch('/api/finance/tax-rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taxData)
      });
      return res.json();
    },
    update: async (code: string, taxData: Partial<TaxRate>): Promise<TaxRate> => {
      if (USE_MOCK) {
        await delay(500);
        return {
          tax_id: 1,
          tax_code: code,
          tax_name: taxData.tax_name || 'Updated Tax',
          tax_rate: taxData.tax_rate || 5.00,
          tax_type: taxData.tax_type || 'GST',
          description: taxData.description || '',
          is_active: taxData.is_active !== undefined ? taxData.is_active : true
        };
      }
      const res = await fetch(`/api/finance/tax-rates/${code}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taxData)
      });
      return res.json();
    },
    delete: async (code: string): Promise<void> => {
      if (USE_MOCK) {
        await delay(300);
        return;
      }
      await fetch(`/api/finance/tax-rates/${code}`, { method: 'DELETE' });
    }
  },

  companies: {
    getAll: async (): Promise<Company[]> => {
      if (USE_MOCK) {
        await delay(300);
        return [
          {
            comp_code: 'CMP01',
            comp_name: 'Lalani Traders',
            address: 'Karachi, Pakistan',
            phone: '+92-21-1234567',
            email: 'info@lalanitraders.com',
            gstin: '27AAAAA0000A1Z5',
            pan_number: 'AAAAA0000A',
            tax_registration: 'TR001'
          }
        ];
      }
      const res = await fetch('/api/companies');
      return res.json();
    },
    getByCode: async (code: string): Promise<Company> => {
      if (USE_MOCK) {
        await delay(300);
        return {
          comp_code: code,
          comp_name: 'Lalani Traders',
          address: 'Karachi, Pakistan',
          phone: '+92-21-1234567',
          email: 'info@lalanitraders.com',
          gstin: '27AAAAA0000A1Z5',
          pan_number: 'AAAAA0000A',
          tax_registration: 'TR001'
        };
      }
      const res = await fetch(`/api/companies/${code}`);
      return res.json();
    },
    create: async (companyData: Omit<Company, 'created_at'>): Promise<Company> => {
      if (USE_MOCK) {
        await delay(500);
        return {
          ...companyData,
          created_at: new Date().toISOString()
        } as Company;
      }
      const res = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(companyData)
      });
      return res.json();
    },
    update: async (code: string, companyData: Partial<Company>): Promise<Company> => {
      if (USE_MOCK) {
        await delay(500);
        return {
          comp_code: code,
          comp_name: 'Updated Company',
          address: 'Updated Address',
          phone: '1234567890',
          email: 'test@example.com',
          ...companyData
        } as Company;
      }
      const res = await fetch(`/api/companies/${code}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(companyData)
      });
      return res.json();
    },
    delete: async (code: string): Promise<void> => {
      if (USE_MOCK) {
        await delay(300);
        return;
      }
      await fetch(`/api/companies/${code}`, { method: 'DELETE' });
    }
  },

  systemBackups: {
    getAll: async (): Promise<SystemBackup[]> => {
      if (USE_MOCK) {
        await delay(300);
        return [];
      }
      const res = await fetch('/api/system/backups');
      return res.json();
    },
    create: async (backupData: {
      backup_type: string;
      file_path: string;
      file_size: number;
    }): Promise<SystemBackup> => {
      if (USE_MOCK) {
        await delay(500);
        return {
          backup_id: 1,
          backup_date: new Date().toISOString(),
          backup_type: backupData.backup_type,
          file_path: backupData.file_path,
          file_size: backupData.file_size,
          status: 'COMPLETED'
        };
      }
      const res = await fetch('/api/system/backups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backupData)
      });
      return res.json();
    }
  }
};
