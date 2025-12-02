

export interface Company {
  comp_code: string;
  comp_name: string;
  address: string;
  phone: string;
  email: string;
  gstin?: string;
  pan_number?: string;
  tax_registration?: string;
}

export interface User {
  user_id: number;
  username: string;
  password?: string; // For mock/creation purposes
  full_name: string;
  role: 'ADMIN' | 'USER';
  is_active: 'Y' | 'N';
  permissions: string[]; // List of granular permissions (e.g., 'INVENTORY_VIEW', 'SALES_MANAGE')
}

export interface Customer {
  cust_id: number;
  cust_code: string;
  cust_name: string;
  city: string;
  phone?: string;
  outstanding_balance: number;
  credit_limit: number;
  route_code?: string;
  tax_number?: string;
  credit_terms_days?: number;
}

export interface Supplier {
  supplier_id: number;
  supplier_code: string;
  supplier_name: string;
  contact_person: string;
  city: string;
  phone: string;
  outstanding_balance: number;
  tax_number?: string;
  payment_terms_days?: number;
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
  tax_code?: string;
  tax_rate?: number;
  hsn_code?: string;
  purchase_price?: number;
}

export interface SalesInvoice {
  inv_id: number;
  inv_number: string;
  inv_date: string; // ISO Date string
  cust_code: string;
  total_amount: number;
  balance_due: number;
  status: 'PAID' | 'PENDING' | 'OVERDUE';
  tax_amount?: number;
  discount_amount?: number;
  shipping_address?: string;
  shipping_charges?: number;
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

// New interfaces for Phase 2 - Type Definitions Expansion
export interface SalesReturn {
  return_id: number;
  return_number: string;
  return_date: string;
  inv_id: number;
  cust_code: string;
  total_amount: number;
  status: 'COMPLETED' | 'PENDING' | 'CANCELLED';
  items?: SalesReturnItem[];
}

export interface SalesReturnItem {
  item_id?: number;
  return_id?: number;
  prod_code: string;
  prod_name?: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface PurchaseInvoice {
  purchase_id: number;
  purchase_number: string;
  purchase_date: string;
  supplier_code: string;
  total_amount: number;
  status: 'RECEIVED' | 'PENDING' | 'CANCELLED';
  items?: PurchaseInvoiceItem[];
}

export interface PurchaseInvoiceItem {
  item_id?: number;
  purchase_id?: number;
  prod_code: string;
  prod_name?: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface PaymentReceipt {
  receipt_id: number;
  receipt_number: string;
  receipt_date: string;
  cust_code: string;
  amount: number;
  payment_method: string;
  reference_number: string;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
}

export interface SupplierPayment {
  payment_id: number;
  payment_number: string;
  payment_date: string;
  supplier_code: string;
  amount: number;
  payment_method: string;
  reference_number: string;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
}

export interface DiscountVoucher {
  voucher_id: number;
  voucher_number: string;
  voucher_date: string;
  cust_code: string;
  amount: number;
  reason: string;
  status: 'ACTIVE' | 'USED' | 'EXPIRED';
}

export interface OpeningCashBalance {
  balance_id: number;
  balance_date: string;
  opening_amount: number;
  closing_amount: number;
  status: 'OPEN' | 'CLOSED';
}

export interface LoanTaken {
  loan_id: number;
  loan_number: string;
  loan_date: string;
  amount: number;
  interest_rate: number;
  term_months: number;
  lender_name: string;
  status: 'ACTIVE' | 'CLOSED' | 'DEFAULTED';
}

export interface LoanReturn {
  return_id: number;
  loan_id: number;
  return_date: string;
  amount: number;
  payment_method: string;
  reference_number: string;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
}

export interface ExpenseHead {
  head_code: string;
  head_name: string;
  description: string;
  is_active: boolean;
}

export interface TaxRate {
  tax_id: number;
  tax_code: string;
  tax_name: string;
  tax_rate: number;
  tax_type: string;
  description: string;
  is_active: boolean;
}

export interface SystemBackup {
  backup_id: number;
  backup_date: string;
  backup_type: string;
  file_path: string;
  file_size: number;
  status: string;
}
