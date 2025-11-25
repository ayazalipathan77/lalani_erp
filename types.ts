export interface Company {
  comp_code: string;
  comp_name: string;
  address: string;
  phone: string;
  email: string;
}

export interface User {
  user_id: number;
  username: string;
  password?: string; // For mock/creation purposes
  full_name: string;
  role: 'ADMIN' | 'USER';
  is_active: 'Y' | 'N';
}

export interface Customer {
  cust_id: number;
  cust_code: string;
  cust_name: string;
  city: string;
  phone?: string;
  outstanding_balance: number;
  credit_limit: number;
}

export interface Supplier {
  supplier_id: number;
  supplier_code: string;
  supplier_name: string;
  contact_person: string;
  city: string;
  phone: string;
  outstanding_balance: number;
}

export interface Category {
  category_id: number;
  category_code: string;
  category_name: string;
  description: string;
}

export interface Product {
  prod_id: number;
  prod_code: string;
  prod_name: string;
  category_code: string;
  unit_price: number;
  current_stock: number;
  min_stock_level: number;
}

export interface SalesInvoice {
  inv_id: number;
  inv_number: string;
  inv_date: string; // ISO Date string
  cust_code: string;
  total_amount: number;
  balance_due: number;
  status: 'PAID' | 'PENDING' | 'OVERDUE';
  items?: SalesInvoiceItem[];
}

export interface SalesInvoiceItem {
  item_id?: number;
  inv_id?: number;
  prod_code: string;
  prod_name?: string; // For display convenience
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface Expense {
  expense_id: number;
  head_code: string;
  amount: number;
  remarks: string;
  expense_date: string;
}

export interface CashTransaction {
  trans_id: number;
  trans_date: string;
  trans_type: 'SALES' | 'PURCHASE' | 'EXPENSE' | 'RECEIPT' | 'PAYMENT';
  description: string;
  debit_amount: number; // Money In
  credit_amount: number; // Money Out
}

export interface DashboardMetrics {
  totalSales: number;
  totalRevenue: number;
  pendingInvoices: number;
  lowStockItems: number;
}