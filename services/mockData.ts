
import { Product, Customer, Supplier, SalesInvoice, Expense, CashTransaction, Category, User } from '../types';

export const mockUsers: User[] = [
  { 
    user_id: 1, 
    username: 'admin', 
    password: '123', 
    full_name: 'System Administrator', 
    role: 'ADMIN', 
    is_active: 'Y',
    permissions: [
        'INVENTORY_VIEW', 'INVENTORY_MANAGE', 
        'SALES_VIEW', 'SALES_MANAGE', 
        'FINANCE_VIEW', 'FINANCE_MANAGE', 
        'PARTNERS_VIEW', 'PARTNERS_MANAGE', 
        'USERS_VIEW', 'USERS_MANAGE',
        'REPORTS_VIEW'
    ]
  },
  { 
    user_id: 2, 
    username: 'user', 
    password: '123', 
    full_name: 'Sales Agent', 
    role: 'USER', 
    is_active: 'Y',
    permissions: ['INVENTORY_VIEW', 'SALES_VIEW', 'SALES_MANAGE', 'PARTNERS_VIEW']
  }
];

export const mockCategories: Category[] = [
  { category_id: 1, category_code: 'TRUCK', category_name: 'Truck Tires', description: 'Heavy duty truck tires' },
  { category_id: 2, category_code: 'CAR', category_name: 'Passenger Car', description: 'Sedan and hatchback tires' },
  { category_id: 3, category_code: 'SUV', category_name: 'SUV & 4x4', description: 'Off-road and highway SUV tires' },
  { category_id: 4, category_code: 'TUBE', category_name: 'Inner Tubes', description: 'All sizes of inner tubes' },
  { category_id: 5, category_code: 'AGRI', category_name: 'Agricultural', description: 'Tractor and farm equipment tires' },
];

export const mockProducts: Product[] = [
  { prod_id: 1, prod_code: 'T-1001', prod_name: 'Radial Truck Tire 295/80R22.5', category_code: 'TRUCK', unit_price: 45000, current_stock: 120, min_stock_level: 20 },
  { prod_id: 2, prod_code: 'T-1002', prod_name: 'Sedan Comfort 195/65R15', category_code: 'CAR', unit_price: 12000, current_stock: 450, min_stock_level: 50 },
  { prod_id: 3, prod_code: 'TB-2001', prod_name: 'Heavy Duty Tube 10.00-20', category_code: 'TUBE', unit_price: 3500, current_stock: 800, min_stock_level: 100 },
  { prod_id: 4, prod_code: 'T-1003', prod_name: 'Off-Road Grip 265/70R17', category_code: 'SUV', unit_price: 32000, current_stock: 45, min_stock_level: 10 },
  { prod_id: 5, prod_code: 'T-1004', prod_name: 'Tractor Rear 18.4-30', category_code: 'AGRI', unit_price: 85000, current_stock: 12, min_stock_level: 5 },
  { prod_id: 6, prod_code: 'T-1005', prod_name: 'City Runner 175/70R13', category_code: 'CAR', unit_price: 9500, current_stock: 200, min_stock_level: 30 },
];

export const mockCustomers: Customer[] = [
  { cust_id: 1, cust_code: 'C-001', cust_name: 'Karachi Auto Parts', city: 'Karachi', phone: '0300-1234567', outstanding_balance: 150000, credit_limit: 500000 },
  { cust_id: 2, cust_code: 'C-002', cust_name: 'Hyderabad Wheels', city: 'Hyderabad', phone: '0300-7654321', outstanding_balance: 0, credit_limit: 300000 },
  { cust_id: 3, cust_code: 'C-003', cust_name: 'Sukkur Transport Spares', city: 'Sukkur', phone: '0301-1122334', outstanding_balance: 75000, credit_limit: 200000 },
  { cust_id: 4, cust_code: 'C-004', cust_name: 'Larkana Tires', city: 'Larkana', phone: '0302-9988776', outstanding_balance: 250000, credit_limit: 250000 },
];

export const mockSuppliers: Supplier[] = [
  { supplier_id: 1, supplier_code: 'S-001', supplier_name: 'General Tyre Pakistan', contact_person: 'Ahmed Khan', city: 'Karachi', phone: '021-34567890', outstanding_balance: 1200000 },
  { supplier_id: 2, supplier_code: 'S-002', supplier_name: 'Panther Tyres Ltd', contact_person: 'Bilal Ahmed', city: 'Lahore', phone: '042-35678901', outstanding_balance: 500000 },
  { supplier_id: 3, supplier_code: 'S-003', supplier_name: 'Global Rubber Corp', contact_person: 'Mr. Smith', city: 'Dubai', phone: '+971-50-1234567', outstanding_balance: 0 },
];

export const mockInvoices: SalesInvoice[] = [
  { 
    inv_id: 101, 
    inv_number: 'INV-2023-001', 
    inv_date: '2023-10-01', 
    cust_code: 'C-001', 
    total_amount: 120000, 
    balance_due: 0, 
    status: 'PAID',
    items: [
      { prod_code: 'T-1002', quantity: 10, unit_price: 12000, line_total: 120000 }
    ]
  },
  { 
    inv_id: 102, 
    inv_number: 'INV-2023-002', 
    inv_date: '2023-10-05', 
    cust_code: 'C-003', 
    total_amount: 45000, 
    balance_due: 45000, 
    status: 'PENDING',
    items: [
        { prod_code: 'T-1005', quantity: 4, unit_price: 9500, line_total: 38000 },
        { prod_code: 'TB-2001', quantity: 2, unit_price: 3500, line_total: 7000 }
    ]
  },
  { 
    inv_id: 103, 
    inv_number: 'INV-2023-003', 
    inv_date: '2023-10-12', 
    cust_code: 'C-004', 
    total_amount: 250000, 
    balance_due: 100000, 
    status: 'OVERDUE',
    items: [
        { prod_code: 'T-1001', quantity: 5, unit_price: 45000, line_total: 225000 },
        { prod_code: 'TB-2001', quantity: 7, unit_price: 3500, line_total: 24500 }
    ]
  },
  { 
    inv_id: 104, 
    inv_number: 'INV-2023-004', 
    inv_date: '2023-10-15', 
    cust_code: 'C-001', 
    total_amount: 60000, 
    balance_due: 60000, 
    status: 'PENDING',
    items: [
        { prod_code: 'T-1002', quantity: 5, unit_price: 12000, line_total: 60000 }
    ]
  },
];

export const mockExpenses: Expense[] = [
  { expense_id: 1, head_code: 'FUEL', amount: 5000, remarks: 'Delivery Van Fuel', expense_date: '2023-10-01' },
  { expense_id: 2, head_code: 'UTIL', amount: 12000, remarks: 'Warehouse Electricity', expense_date: '2023-10-02' },
  { expense_id: 3, head_code: 'MAINT', amount: 3500, remarks: 'Forklift Repair', expense_date: '2023-10-10' },
  { expense_id: 4, head_code: 'ENT', amount: 2000, remarks: 'Client Lunch', expense_date: '2023-10-15' },
];

export const mockCashTransactions: CashTransaction[] = [
  { trans_id: 1, trans_date: '2023-10-01', trans_type: 'RECEIPT', description: 'Payment from Karachi Auto Parts', debit_amount: 120000, credit_amount: 0 },
  { trans_id: 2, trans_date: '2023-10-01', trans_type: 'EXPENSE', description: 'Fuel Expense', debit_amount: 0, credit_amount: 5000 },
  { trans_id: 3, trans_date: '2023-10-02', trans_type: 'EXPENSE', description: 'Electricity Bill', debit_amount: 0, credit_amount: 12000 },
  { trans_id: 4, trans_date: '2023-10-05', trans_type: 'SALES', description: 'Cash Sale - Walk in', debit_amount: 25000, credit_amount: 0 },
  { trans_id: 5, trans_date: '2023-10-08', trans_type: 'PAYMENT', description: 'Payment to General Tyre', debit_amount: 0, credit_amount: 500000 },
];

export const salesData = [
  { name: 'Jan', sales: 400000 },
  { name: 'Feb', sales: 300000 },
  { name: 'Mar', sales: 200000 },
  { name: 'Apr', sales: 278000 },
  { name: 'May', sales: 189000 },
  { name: 'Jun', sales: 239000 },
  { name: 'Jul', sales: 349000 },
];
