# Lalani Traders ERP System - Comprehensive Documentation

> **Version:** 1.0.0
> **Business Domain:** Tire Trading & Distribution
> **Last Updated:** January 2026

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Project Structure](#3-project-structure)
4. [Database Architecture](#4-database-architecture)
5. [API Endpoints](#5-api-endpoints)
6. [Features & Modules](#6-features--modules)
7. [Business Rules](#7-business-rules)
8. [Security & Authentication](#8-security--authentication)
9. [Configuration](#9-configuration)
10. [Development Guide](#10-development-guide)
11. [Deployment](#11-deployment)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. Project Overview

### About
Lalani Traders ERP is a comprehensive Enterprise Resource Planning system specifically designed for tire trading businesses. It manages the complete business cycle including inventory, sales, purchases, finance, and customer/supplier relationships.

### Key Statistics
- **Total Files:** 91 TypeScript/JavaScript files
- **Database Tables:** 32 tables with 32 indexes
- **API Endpoints:** 50+ RESTful endpoints
- **UI Components:** 20 pages, 11 reusable components
- **Project Size:** 230MB (including dependencies)
- **Dependencies:** 332 npm packages (23 production, 10 dev)

### Business Capabilities
- Real-time inventory tracking across multiple product categories
- Complete sales cycle (invoicing, returns, payments)
- Purchase management and supplier tracking
- Financial management (expenses, loans, cash balance)
- Multi-tenant architecture (company-based data isolation)
- Biometric authentication (WebAuthn)
- Progressive Web App (offline capability)

---

## 2. Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.3.1 | UI Framework |
| TypeScript | 5.4.5 | Type Safety |
| Vite | 5.2.11 | Build Tool & Dev Server |
| Tailwind CSS | 3.4.3 | Styling Framework |
| React Router | 6.23.0 | Client-side Routing |
| Recharts | 2.12.7 | Data Visualization |
| Lucide React | 0.378.0 | Icon Library |
| jsPDF | 2.5.1 | PDF Generation |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 18+ | Runtime Environment |
| Express.js | 4.19.2 | Web Framework |
| PostgreSQL | 15+ | Database |
| pg | 8.11.5 | PostgreSQL Driver |
| jsonwebtoken | 9.0.2 | JWT Authentication |
| @simplewebauthn | 13.2.2 | Biometric Auth |
| db-migrate | 0.11.14 | Database Migrations |

### Infrastructure
- **Dev Server:** Vite (localhost:5173)
- **API Server:** Express (localhost:5000)
- **Database:** Local PostgreSQL / Neon Cloud
- **Deployment:** Standalone Node.js server
- **Version Control:** Git

---

## 3. Project Structure

```
lalani_erp/
├── components/                 # React UI Components (11 files)
│   ├── CompanySelector.tsx    # Multi-tenant company selection
│   ├── FullScreenLoader.tsx   # Loading overlay
│   ├── LoadingNavLink.tsx     # Route loading indicator
│   ├── MobileTable.tsx        # Responsive table component
│   ├── Notification.tsx       # Toast notifications
│   ├── Pagination.tsx         # Table pagination
│   └── Sidebar.tsx            # Navigation sidebar
│
├── pages/                      # Page Components (20 files)
│   ├── Home.tsx               # Landing/Login page
│   ├── Dashboard.tsx          # Main dashboard
│   ├── Inventory.tsx          # Product management
│   ├── Sales.tsx              # Sales invoices
│   ├── SalesReturns.tsx       # Return management
│   ├── Finance.tsx            # Cash balance & transactions
│   ├── Expenses.tsx           # Expense tracking
│   ├── Receipts.tsx           # Customer payments
│   ├── Payments.tsx           # Supplier payments
│   ├── PurchaseInvoices.tsx   # Purchase management
│   ├── Partners.tsx           # Customer/Supplier management
│   ├── Users.tsx              # User administration
│   ├── Companies.tsx          # Company management
│   ├── TaxRates.tsx           # Tax configuration
│   ├── DiscountRates.tsx      # Discount configuration
│   └── Reports.tsx            # Analytics & reports
│
├── server/                     # Backend Route Handlers (17 files)
│   ├── authRoutes.js          # Authentication & WebAuthn
│   ├── userRoutes.js          # User management
│   ├── productRoutes.js       # Product CRUD
│   ├── categoryRoutes.js      # Category management
│   ├── invoiceRoutes.js       # Sales invoices
│   ├── salesReturnRoutes.js   # Sales returns
│   ├── purchaseInvoiceRoutes.js
│   ├── customerRoutes.js      # Customer management
│   ├── supplierRoutes.js      # Supplier management
│   ├── financeRoutes.js       # Financial transactions
│   ├── paymentReceiptRoutes.js
│   ├── supplierPaymentRoutes.js
│   ├── discountVoucherRoutes.js
│   ├── analyticsRoutes.js     # Dashboard analytics
│   ├── companyRoutes.js       # Company CRUD
│   └── systemRoutes.js        # Backups & system
│
├── services/                   # API Service Layer (18 files)
│   ├── api.ts                 # Base API client
│   ├── auth.ts                # Authentication service
│   ├── products.ts            # Product API
│   ├── customers.ts           # Customer API
│   ├── invoices.ts            # Invoice API
│   ├── analytics.ts           # Analytics API
│   └── ...                    # Other domain services
│
├── database/                   # Database Files
│   ├── schema.sql             # Complete schema definition
│   └── pool.js                # Connection pool
│
├── migrations/                 # Database Migrations
│   ├── 20251209002519-initial-schema-up.sql
│   └── database.json          # Migration config
│
├── src/utils/                  # Utility Functions
│   ├── pwa.ts                 # Service worker utilities
│   ├── speech.ts              # Voice input utilities
│   └── geolocation.ts         # Location utilities
│
├── public/                     # Static Assets
│   ├── manifest.json          # PWA manifest
│   └── sw.js                  # Service worker
│
├── scripts/                    # Utility Scripts
│   └── setup-db.js            # Database initialization
│
├── logs/                       # Application Logs
│   └── app.log                # Main log file (rotates at 5MB)
│
├── backups/                    # Database Backups
│
├── App.tsx                     # React app entry point
├── server.js                   # Express server entry point
├── logger.js                   # Logging utility
├── types.ts                    # TypeScript type definitions
├── package.json                # Dependencies & scripts
├── tsconfig.json               # TypeScript config
├── vite.config.ts              # Vite build config
├── .env                        # Environment variables
├── PROJECT_SPEC.json           # Detailed specifications (34KB)
├── README.md                   # Setup guide
└── LOGGING_DOCUMENTATION.md    # Logging guide
```

---

## 4. Database Architecture

### Schema Overview (32 Tables)

#### Master Data Tables

**1. companies** - Multi-tenant company information
```sql
comp_code VARCHAR(20) PRIMARY KEY
comp_name VARCHAR(255) NOT NULL
address TEXT
phone VARCHAR(20)
email VARCHAR(100)
gstin VARCHAR(15)
pan_number VARCHAR(10)
tax_registration VARCHAR(50)
created_at, updated_at TIMESTAMP
```

**2. users** - User authentication & authorization
```sql
user_id SERIAL PRIMARY KEY
username VARCHAR(50) UNIQUE NOT NULL
password VARCHAR(255) NOT NULL  -- Plain text in dev, needs hashing
full_name VARCHAR(100)
role VARCHAR(20) DEFAULT 'USER'  -- ADMIN/USER
permissions TEXT[]  -- Array of 11 permissions
default_company VARCHAR(20) FK → companies.comp_code
is_active BOOLEAN DEFAULT true
created_at, updated_at TIMESTAMP
```

**Permissions:** INVENTORY_VIEW, INVENTORY_MANAGE, SALES_VIEW, SALES_MANAGE, FINANCE_VIEW, FINANCE_MANAGE, PARTNERS_VIEW, PARTNERS_MANAGE, USERS_VIEW, USERS_MANAGE, REPORTS_VIEW

**3. user_webauthn_credentials** - Biometric authentication
```sql
credential_id VARCHAR(255) PRIMARY KEY
user_id INTEGER FK → users.user_id
public_key TEXT NOT NULL
counter INTEGER DEFAULT 0
device_info JSONB
created_at TIMESTAMP
```

**4. categories** - Product classification
```sql
category_id SERIAL PRIMARY KEY
category_code VARCHAR(20) UNIQUE NOT NULL
category_name VARCHAR(100) NOT NULL
description TEXT
created_at, updated_at TIMESTAMP
```

**Sample Categories:** Truck Tires, Car Tires, SUV Tires, Tubes, Agricultural Tires

**5. products** - Inventory items
```sql
prod_id SERIAL PRIMARY KEY
prod_code VARCHAR(50) UNIQUE NOT NULL
prod_name VARCHAR(255) NOT NULL
category_code VARCHAR(20) FK → categories.category_code
cost_price DECIMAL(10,2) DEFAULT 0.00
selling_price DECIMAL(10,2) DEFAULT 0.00
current_stock INTEGER DEFAULT 0
min_stock_level INTEGER DEFAULT 10
tax_code VARCHAR(20) FK → tax_rates.tax_code
tax_rate DECIMAL(5,2) DEFAULT 0.00
hsn_code VARCHAR(20)
comp_code VARCHAR(20) FK → companies.comp_code
created_at, updated_at, created_by, updated_by
```

**6. customers** - Customer records
```sql
cust_id SERIAL PRIMARY KEY
cust_code VARCHAR(50) UNIQUE NOT NULL
cust_name VARCHAR(255) NOT NULL
city VARCHAR(100)
phone VARCHAR(20)
credit_limit DECIMAL(10,2) DEFAULT 0.00
outstanding_balance DECIMAL(10,2) DEFAULT 0.00
route_code VARCHAR(20)
tax_number VARCHAR(50)
credit_terms_days INTEGER DEFAULT 0
tax_rate DECIMAL(5,2) DEFAULT 0.00
discount_rate DECIMAL(5,2) DEFAULT 0.00
comp_code VARCHAR(20) FK → companies.comp_code
created_at, updated_at
```

**7. suppliers** - Supplier records
```sql
supplier_id SERIAL PRIMARY KEY
supplier_code VARCHAR(50) UNIQUE NOT NULL
supplier_name VARCHAR(255) NOT NULL
contact_person VARCHAR(100)
city VARCHAR(100)
phone VARCHAR(20)
outstanding_balance DECIMAL(10,2) DEFAULT 0.00
tax_number VARCHAR(50)
payment_terms_days INTEGER DEFAULT 0
comp_code VARCHAR(20) FK → companies.comp_code
created_at, updated_at
```

#### Transaction Tables

**8. sales_invoices** - Sales invoice headers
```sql
inv_id SERIAL PRIMARY KEY
inv_number VARCHAR(50) UNIQUE NOT NULL  -- Auto: INV-{timestamp}
inv_date DATE NOT NULL
cust_code VARCHAR(50) FK → customers.cust_code
sub_total DECIMAL(10,2) DEFAULT 0.00
tax_amount DECIMAL(10,2) DEFAULT 0.00
discount_amount DECIMAL(10,2) DEFAULT 0.00
total_amount DECIMAL(10,2) NOT NULL
balance_due DECIMAL(10,2) DEFAULT 0.00
shipping_address TEXT
shipping_charges DECIMAL(10,2) DEFAULT 0.00
comp_code VARCHAR(20) FK → companies.comp_code
created_at, updated_at, created_by, updated_by
```

**9. sales_invoice_items** - Invoice line items
```sql
item_id SERIAL PRIMARY KEY
inv_id INTEGER FK → sales_invoices.inv_id ON DELETE CASCADE
prod_code VARCHAR(50) FK → products.prod_code
quantity INTEGER NOT NULL
unit_price DECIMAL(10,2) NOT NULL
discount_rate DECIMAL(5,2) DEFAULT 0.00
discount_amount DECIMAL(10,2) DEFAULT 0.00
tax_rate DECIMAL(5,2) DEFAULT 0.00
tax_amount DECIMAL(10,2) DEFAULT 0.00
net_amount DECIMAL(10,2)  -- unit_price - discount
line_total DECIMAL(10,2) NOT NULL  -- net_amount * quantity + tax
created_at
```

**Business Logic:**
- Stock decreases automatically on invoice creation
- Customer outstanding balance increases
- Cash balance credited (SALES transaction)

**10. sales_returns** - Sales return headers
```sql
return_id SERIAL PRIMARY KEY
return_number VARCHAR(50) UNIQUE NOT NULL
return_date DATE NOT NULL
inv_id INTEGER FK → sales_invoices.inv_id
cust_code VARCHAR(50) FK → customers.cust_code
total_amount DECIMAL(10,2) NOT NULL
status VARCHAR(20) DEFAULT 'PENDING'  -- PENDING/APPROVED/REJECTED
comp_code VARCHAR(20) FK → companies.comp_code
created_at, updated_at, created_by, updated_by
```

**11. sales_return_items** - Return line items
```sql
item_id SERIAL PRIMARY KEY
return_id INTEGER FK → sales_returns.return_id ON DELETE CASCADE
prod_code VARCHAR(50) FK → products.prod_code
quantity INTEGER NOT NULL  -- Cannot exceed original quantity
unit_price DECIMAL(10,2) NOT NULL
line_total DECIMAL(10,2) NOT NULL
created_at
```

**Business Logic:**
- Stock increases automatically on return approval
- Customer outstanding balance decreases
- Cash balance debited (return transaction)

**12. purchase_invoices** - Purchase headers
```sql
purchase_id SERIAL PRIMARY KEY
purchase_number VARCHAR(50) UNIQUE NOT NULL
purchase_date DATE NOT NULL
supplier_code VARCHAR(50) FK → suppliers.supplier_code
total_amount DECIMAL(10,2) NOT NULL
status VARCHAR(20) DEFAULT 'PENDING'
comp_code VARCHAR(20) FK → companies.comp_code
created_at, updated_at, created_by, updated_by
```

**13. purchase_invoice_items** - Purchase line items
```sql
item_id SERIAL PRIMARY KEY
purchase_id INTEGER FK → purchase_invoices.purchase_id ON DELETE CASCADE
prod_code VARCHAR(50) FK → products.prod_code
quantity INTEGER NOT NULL
unit_price DECIMAL(10,2) NOT NULL
line_total DECIMAL(10,2) NOT NULL
created_at
```

**Business Logic:**
- Stock increases automatically on purchase
- Supplier outstanding balance increases
- Cash balance debited (PURCHASE transaction)

#### Financial Tables

**14. cash_balance** - Financial transaction ledger
```sql
trans_id SERIAL PRIMARY KEY
trans_date DATE NOT NULL
trans_type VARCHAR(20) NOT NULL  -- SALES/PURCHASE/EXPENSE/RECEIPT/PAYMENT
description TEXT
debit_amount DECIMAL(10,2) DEFAULT 0.00
credit_amount DECIMAL(10,2) DEFAULT 0.00
comp_code VARCHAR(20) FK → companies.comp_code
created_at, created_by
```

**Transaction Types:**
- **SALES** - Credit (increases balance)
- **PURCHASE** - Debit (decreases balance)
- **EXPENSE** - Debit
- **RECEIPT** - Credit (customer payment received)
- **PAYMENT** - Debit (supplier payment made)

**15. expenses** - Expense tracking
```sql
expense_id SERIAL PRIMARY KEY
head_code VARCHAR(20) FK → expense_heads.head_code
amount DECIMAL(10,2) NOT NULL
remarks TEXT
expense_date DATE NOT NULL
comp_code VARCHAR(20) FK → companies.comp_code
created_at, created_by
```

**16. expense_heads** - Expense categories
```sql
head_code VARCHAR(20) PRIMARY KEY
head_name VARCHAR(100) NOT NULL
description TEXT
is_active BOOLEAN DEFAULT true
comp_code VARCHAR(20) FK → companies.comp_code
created_at, updated_at
```

**Sample Expense Heads:** Fuel, Electricity, Rent, Salaries, Marketing, Maintenance, Office Supplies, Insurance, Telephone, Miscellaneous

**17. payment_receipts** - Customer payments
```sql
receipt_id SERIAL PRIMARY KEY
receipt_number VARCHAR(50) UNIQUE NOT NULL
receipt_date DATE NOT NULL
cust_code VARCHAR(50) FK → customers.cust_code
amount DECIMAL(10,2) NOT NULL
payment_method VARCHAR(50)  -- CASH/CHEQUE/BANK_TRANSFER/UPI
reference_number VARCHAR(100)
status VARCHAR(20) DEFAULT 'COMPLETED'
comp_code VARCHAR(20) FK → companies.comp_code
created_at, created_by
```

**Business Logic:**
- Customer outstanding balance decreases
- Cash balance credited (RECEIPT transaction)

**18. supplier_payments** - Supplier payments
```sql
payment_id SERIAL PRIMARY KEY
payment_number VARCHAR(50) UNIQUE NOT NULL
payment_date DATE NOT NULL
supplier_code VARCHAR(50) FK → suppliers.supplier_code
amount DECIMAL(10,2) NOT NULL
payment_method VARCHAR(50)
reference_number VARCHAR(100)
status VARCHAR(20) DEFAULT 'COMPLETED'
comp_code VARCHAR(20) FK → companies.comp_code
created_at, created_by
```

**Business Logic:**
- Supplier outstanding balance decreases
- Cash balance debited (PAYMENT transaction)

**19. discount_vouchers** - Customer discount vouchers
```sql
voucher_id SERIAL PRIMARY KEY
voucher_number VARCHAR(50) UNIQUE NOT NULL
voucher_date DATE NOT NULL
cust_code VARCHAR(50) FK → customers.cust_code
amount DECIMAL(10,2) NOT NULL
reason TEXT
status VARCHAR(20) DEFAULT 'ISSUED'
comp_code VARCHAR(20) FK → companies.comp_code
created_at, created_by
```

**20. opening_cash_balance** - Daily cash opening/closing
```sql
balance_id SERIAL PRIMARY KEY
balance_date DATE NOT NULL UNIQUE
opening_amount DECIMAL(10,2) DEFAULT 0.00
closing_amount DECIMAL(10,2) DEFAULT 0.00
status VARCHAR(20) DEFAULT 'OPEN'
comp_code VARCHAR(20) FK → companies.comp_code
created_at, updated_at
```

**21. loan_taken** - Loan tracking
```sql
loan_id SERIAL PRIMARY KEY
loan_number VARCHAR(50) UNIQUE NOT NULL
loan_date DATE NOT NULL
amount DECIMAL(10,2) NOT NULL
interest_rate DECIMAL(5,2) DEFAULT 0.00
term_months INTEGER
lender_name VARCHAR(255)
status VARCHAR(20) DEFAULT 'ACTIVE'
comp_code VARCHAR(20) FK → companies.comp_code
created_at, created_by
```

**22. loan_return** - Loan repayments
```sql
return_id SERIAL PRIMARY KEY
loan_id INTEGER FK → loan_taken.loan_id
return_date DATE NOT NULL
amount DECIMAL(10,2) NOT NULL
payment_method VARCHAR(50)
reference_number VARCHAR(100)
status VARCHAR(20) DEFAULT 'COMPLETED'
comp_code VARCHAR(20) FK → companies.comp_code
created_at, created_by
```

#### Configuration Tables

**23. tax_rates** - Tax configuration
```sql
tax_id SERIAL PRIMARY KEY
tax_code VARCHAR(20) UNIQUE NOT NULL
tax_name VARCHAR(100) NOT NULL
tax_rate DECIMAL(5,2) NOT NULL
tax_type VARCHAR(10) DEFAULT 'GST'  -- GST/VAT
description TEXT
is_active BOOLEAN DEFAULT true
comp_code VARCHAR(20) FK → companies.comp_code
created_at, updated_at
```

**Sample Tax Rates:** GST 0%, GST 5%, GST 12%, GST 18%

**24. discount_rates** - Discount configuration
```sql
discount_id SERIAL PRIMARY KEY
discount_code VARCHAR(20) UNIQUE NOT NULL
discount_name VARCHAR(100) NOT NULL
discount_rate DECIMAL(5,2) NOT NULL
description TEXT
is_active BOOLEAN DEFAULT true
comp_code VARCHAR(20) FK → companies.comp_code
created_at, updated_at
```

**Sample Discount Rates:** 0%, 5%, 10%, 15%, 20%

**25. system_backups** - Backup tracking
```sql
backup_id SERIAL PRIMARY KEY
backup_date TIMESTAMP NOT NULL
backup_type VARCHAR(20)  -- FULL/INCREMENTAL/MANUAL
file_path VARCHAR(500)
file_size BIGINT
status VARCHAR(20) DEFAULT 'IN_PROGRESS'
comp_code VARCHAR(20) FK → companies.comp_code
created_at, created_by
```

### Database Indexes (32 Total)

**Performance Optimization:**
- All foreign keys indexed
- Date fields indexed for reporting
- Unique constraints on code/number fields
- Composite indexes on frequently joined columns

```sql
CREATE INDEX idx_products_category ON products(category_code);
CREATE INDEX idx_products_company ON products(comp_code);
CREATE INDEX idx_sales_invoices_customer ON sales_invoices(cust_code);
CREATE INDEX idx_sales_invoices_date ON sales_invoices(inv_date);
CREATE INDEX idx_cash_balance_date ON cash_balance(trans_date);
CREATE INDEX idx_cash_balance_type ON cash_balance(trans_type);
-- ... 26 more indexes
```

### Sample Data

**Users:**
- **admin** / 123 (ADMIN role, all permissions)
- **user** / 123 (USER role, limited permissions)

**Products:**
- APOLLO-TRUCK-01, MRF-CAR-01, CEAT-SUV-01, JK-TUBE-01, etc.

**Customers:**
- CUST-001 (ABC Motors), CUST-002 (XYZ Traders), etc.

**Suppliers:**
- SUPP-001 (Apollo Tyres), SUPP-002 (MRF Tyres), etc.

---

## 5. API Endpoints

### Base URL
- **Development:** `http://localhost:5000/api`
- **Production:** `https://your-domain.com/api`

### Authentication Routes (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/login` | Username/password login | No |
| POST | `/verify` | Verify JWT token | No |
| POST | `/webauthn/register-start` | Start biometric registration | Yes |
| POST | `/webauthn/register-finish` | Complete biometric registration | Yes |
| POST | `/webauthn/login-start` | Start biometric login | No |
| POST | `/webauthn/login-finish` | Complete biometric login | No |
| GET | `/webauthn/credentials` | Get user's credentials | Yes |
| DELETE | `/webauthn/credentials/:id` | Delete credential | Yes |

**Login Request:**
```json
POST /api/auth/login
{
  "username": "admin",
  "password": "123"
}
```

**Login Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "user_id": 1,
    "username": "admin",
    "full_name": "Administrator",
    "role": "ADMIN",
    "permissions": ["INVENTORY_VIEW", "INVENTORY_MANAGE", ...],
    "default_company": "LAL001"
  }
}
```

### User Routes (`/api/users`)

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/` | Get paginated users | USERS_VIEW |
| POST | `/` | Create new user | USERS_MANAGE |
| PUT | `/:id` | Update user | USERS_MANAGE |
| DELETE | `/:id` | Delete user | USERS_MANAGE |

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 10)
- `search` - Search by username/full_name

**Create User Request:**
```json
POST /api/users
{
  "username": "newuser",
  "password": "password123",
  "full_name": "New User",
  "role": "USER",
  "permissions": ["SALES_VIEW", "INVENTORY_VIEW"],
  "default_company": "LAL001",
  "is_active": true
}
```

### Product Routes (`/api/products`)

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/` | Get paginated products | INVENTORY_VIEW |
| POST | `/` | Create product | INVENTORY_MANAGE |
| PUT | `/:id` | Update product | INVENTORY_MANAGE |
| DELETE | `/:id` | Delete product | INVENTORY_MANAGE |

**Query Parameters:**
- `page`, `limit`, `search`
- `category` - Filter by category code
- `lowStock=true` - Only show low stock items

**Create Product Request:**
```json
POST /api/products
{
  "prod_code": "APOLLO-TRUCK-01",
  "prod_name": "Apollo EnduTrax Truck Tyre 10.00-20",
  "category_code": "TRUCK",
  "cost_price": 8500.00,
  "selling_price": 12000.00,
  "current_stock": 50,
  "min_stock_level": 10,
  "tax_code": "GST18",
  "hsn_code": "40111000",
  "comp_code": "LAL001"
}
```

### Category Routes (`/api/categories`)

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/` | Get all categories | INVENTORY_VIEW |

### Sales Invoice Routes (`/api/invoices`)

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/` | Get paginated invoices | SALES_VIEW |
| POST | `/` | Create invoice | SALES_MANAGE |
| GET | `/:id` | Get invoice details | SALES_VIEW |
| PUT | `/:id` | Update invoice | SALES_MANAGE |
| DELETE | `/:id` | Delete invoice | SALES_MANAGE |

**Query Parameters:**
- `page`, `limit`, `search`
- `customer` - Filter by customer code
- `startDate`, `endDate` - Date range

**Create Invoice Request:**
```json
POST /api/invoices
{
  "inv_date": "2026-01-15",
  "cust_code": "CUST-001",
  "items": [
    {
      "prod_code": "APOLLO-TRUCK-01",
      "quantity": 4,
      "unit_price": 12000.00,
      "discount_rate": 5.00,
      "tax_rate": 18.00
    }
  ],
  "shipping_address": "123 Main St, City",
  "shipping_charges": 500.00,
  "comp_code": "LAL001"
}
```

**Automatic Processing:**
1. Auto-generates `inv_number` (e.g., INV-1736899200000)
2. Calculates `sub_total`, `tax_amount`, `discount_amount`, `total_amount`
3. Sets `balance_due = total_amount`
4. Decreases product stock by quantities
5. Increases customer outstanding balance
6. Creates SALES transaction in cash_balance

### Sales Return Routes (`/api/sales-returns`)

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/` | Get paginated returns | SALES_VIEW |
| POST | `/` | Create return | SALES_MANAGE |

**Create Return Request:**
```json
POST /api/sales-returns
{
  "return_date": "2026-01-20",
  "inv_id": 1,
  "cust_code": "CUST-001",
  "items": [
    {
      "prod_code": "APOLLO-TRUCK-01",
      "quantity": 1,
      "unit_price": 12000.00
    }
  ],
  "comp_code": "LAL001"
}
```

**Automatic Processing:**
1. Auto-generates `return_number`
2. Validates return quantity ≤ original invoice quantity
3. Increases product stock
4. Decreases customer outstanding balance
5. Creates return transaction in cash_balance

### Purchase Invoice Routes (`/api/purchase-invoices`)

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/` | Get paginated purchases | FINANCE_VIEW |
| POST | `/` | Create purchase | FINANCE_MANAGE |
| PUT | `/:id` | Update purchase | FINANCE_MANAGE |
| DELETE | `/:id` | Delete purchase | FINANCE_MANAGE |

**Automatic Processing:**
1. Increases product stock
2. Increases supplier outstanding balance
3. Creates PURCHASE transaction in cash_balance

### Customer Routes (`/api/customers`)

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/` | Get paginated customers | PARTNERS_VIEW |
| POST | `/` | Create customer | PARTNERS_MANAGE |
| PUT | `/:id` | Update customer | PARTNERS_MANAGE |
| DELETE | `/:id` | Delete customer | PARTNERS_MANAGE |

**Create Customer Request:**
```json
POST /api/customers
{
  "cust_code": "CUST-001",
  "cust_name": "ABC Motors",
  "city": "Mumbai",
  "phone": "9876543210",
  "credit_limit": 500000.00,
  "credit_terms_days": 30,
  "tax_rate": 18.00,
  "discount_rate": 5.00,
  "route_code": "RT001",
  "tax_number": "27AABCU9603R1ZX",
  "comp_code": "LAL001"
}
```

### Supplier Routes (`/api/suppliers`)

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/` | Get paginated suppliers | PARTNERS_VIEW |
| POST | `/` | Create supplier | PARTNERS_MANAGE |
| PUT | `/:id` | Update supplier | PARTNERS_MANAGE |
| DELETE | `/:id` | Delete supplier | PARTNERS_MANAGE |

### Finance Routes (`/api/finance`)

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/transactions` | Get cash balance transactions | FINANCE_VIEW |
| GET | `/opening-balance` | Get opening balance for date | FINANCE_VIEW |
| POST | `/opening-balance` | Set opening balance | FINANCE_MANAGE |
| GET | `/loans` | Get loans | FINANCE_VIEW |
| POST | `/loans` | Create loan | FINANCE_MANAGE |
| GET | `/loans/:id/returns` | Get loan returns | FINANCE_VIEW |
| POST | `/loan-returns` | Create loan return | FINANCE_MANAGE |
| GET | `/expense-heads` | Get expense heads | FINANCE_VIEW |
| POST | `/expense-heads` | Create expense head | FINANCE_MANAGE |
| GET | `/tax-rates` | Get tax rates | FINANCE_VIEW |
| POST | `/tax-rates` | Create tax rate | FINANCE_MANAGE |
| PUT | `/tax-rates/:code` | Update tax rate | FINANCE_MANAGE |
| DELETE | `/tax-rates/:code` | Delete tax rate | FINANCE_MANAGE |

**Get Transactions Query:**
```
GET /api/finance/transactions?startDate=2026-01-01&endDate=2026-01-31&type=SALES
```

### Payment Receipt Routes (`/api/payment-receipts`)

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/` | Get paginated receipts | FINANCE_VIEW |
| POST | `/` | Create receipt | FINANCE_MANAGE |

**Create Receipt Request:**
```json
POST /api/payment-receipts
{
  "receipt_date": "2026-01-20",
  "cust_code": "CUST-001",
  "amount": 50000.00,
  "payment_method": "BANK_TRANSFER",
  "reference_number": "TXN123456",
  "comp_code": "LAL001"
}
```

**Automatic Processing:**
1. Auto-generates `receipt_number`
2. Decreases customer outstanding balance
3. Creates RECEIPT transaction in cash_balance (credit)

### Supplier Payment Routes (`/api/supplier-payments`)

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/` | Get paginated payments | FINANCE_VIEW |
| POST | `/` | Create payment | FINANCE_MANAGE |

**Automatic Processing:**
1. Decreases supplier outstanding balance
2. Creates PAYMENT transaction in cash_balance (debit)

### Discount Voucher Routes (`/api/discount-vouchers`)

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/` | Get paginated vouchers | FINANCE_VIEW |
| POST | `/` | Create voucher | FINANCE_MANAGE |

### Analytics Routes (`/api/analytics`)

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/dashboard` | Get dashboard metrics | REPORTS_VIEW |
| GET | `/sales-trends` | Get sales trends | REPORTS_VIEW |

**Dashboard Response:**
```json
{
  "totalSales": 1500000.00,
  "totalPurchases": 800000.00,
  "totalExpenses": 50000.00,
  "cashBalance": 650000.00,
  "lowStockProducts": 5,
  "pendingInvoices": 12,
  "topCustomers": [...],
  "recentTransactions": [...]
}
```

### Company Routes (`/api/companies`)

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/` | Get all companies | USERS_VIEW |
| GET | `/:code` | Get company details | USERS_VIEW |
| POST | `/` | Create company | USERS_MANAGE |
| PUT | `/:code` | Update company | USERS_MANAGE |
| DELETE | `/:code` | Delete company | USERS_MANAGE |

### System Routes (`/api/system`)

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/backups` | Get backups | USERS_MANAGE |
| POST | `/backups` | Create backup | USERS_MANAGE |

### Middleware & Headers

**Authentication:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Company Context:**
```
x-company-code: LAL001
```

**Error Response Format:**
```json
{
  "error": "Error message",
  "details": "Additional details (dev only)"
}
```

---

## 6. Features & Modules

### Module 1: Dashboard & Analytics

**Purpose:** Real-time business overview and decision-making insights

**Features:**
- Key performance indicators (KPIs)
  - Total sales (current month)
  - Total purchases
  - Total expenses
  - Current cash balance
  - Outstanding receivables/payables
- Sales trends chart (Recharts line chart)
- Low stock alerts (products below minimum level)
- Top customers by sales volume
- Recent transactions timeline
- Quick action buttons (New Invoice, Add Product, etc.)

**Files:**
- [pages/Dashboard.tsx](pages/Dashboard.tsx)
- [services/analytics.ts](services/analytics.ts)
- [server/analyticsRoutes.js](server/analyticsRoutes.js)

**API:** `GET /api/analytics/dashboard`, `GET /api/analytics/sales-trends`

---

### Module 2: Inventory Management

**Purpose:** Complete product lifecycle management

**Features:**
- **Product Catalog:**
  - Multi-category organization (Truck, Car, SUV, Tube, Agricultural)
  - Product code, name, category
  - Cost price and selling price
  - HSN code and tax code assignment
  - Current stock tracking
  - Minimum stock level alerts

- **Stock Management:**
  - Real-time stock updates on transactions
  - Automatic stock deduction on sales
  - Automatic stock increase on purchases
  - Stock restoration on returns
  - Low stock warnings
  - Stock movement history (via transactions)

- **Product Operations:**
  - Create new products
  - Update product details
  - Delete products (with validation)
  - Search and filter by category
  - Pagination for large catalogs

**Files:**
- [pages/Inventory.tsx](pages/Inventory.tsx)
- [services/products.ts](services/products.ts)
- [server/productRoutes.js](server/productRoutes.js)

**API:** `/api/products`, `/api/categories`

**Business Rules:**
- Product code must be unique
- Cannot delete product with existing transactions
- Stock cannot go negative (validation on sales)
- Minimum stock level triggers alerts

---

### Module 3: Sales & Invoicing

**Purpose:** Complete sales cycle from quote to payment

**Features:**

**3a. Sales Invoices:**
- Multi-item invoicing (add/remove line items dynamically)
- Customer selection with credit limit check
- Product selection with current stock display
- Automatic calculations:
  - Line total = (unit_price - discount) × quantity + tax
  - Sub total, total discount, total tax, grand total
- Customer-specific discount rates (auto-applied)
- Tax rate per product (configurable GST)
- Shipping address and charges
- Balance due tracking
- PDF invoice generation (jsPDF + html2canvas)
- Invoice search and filtering
- Date range reports
- Customer-wise sales report

**3b. Sales Returns:**
- Return processing with original invoice reference
- Multi-item returns
- Return quantity validation (cannot exceed original)
- Automatic stock restoration
- Customer balance adjustment
- Return reason tracking
- Return status (Pending/Approved/Rejected)
- PDF return receipt

**Files:**
- [pages/Sales.tsx](pages/Sales.tsx)
- [pages/SalesReturns.tsx](pages/SalesReturns.tsx)
- [services/invoices.ts](services/invoices.ts)
- [server/invoiceRoutes.js](server/invoiceRoutes.js)
- [server/salesReturnRoutes.js](server/salesReturnRoutes.js)

**API:** `/api/invoices`, `/api/sales-returns`

**Business Rules:**
- Invoice number auto-generated (INV-{timestamp})
- Stock decreases on invoice creation
- Customer outstanding balance increases
- Credit limit check before invoice creation
- Returns must reference original invoice
- Return quantity ≤ original quantity
- Stock increases on return approval

**Workflow:**
1. User selects customer
2. Adds products with quantities
3. System calculates totals
4. User saves invoice
5. System: reduces stock, updates customer balance, creates cash transaction
6. PDF invoice generated for printing

---

### Module 4: Purchase Management

**Purpose:** Supplier purchase tracking and inventory replenishment

**Features:**
- **Purchase Invoices:**
  - Supplier selection
  - Multi-item purchase orders
  - Automatic stock increases
  - Outstanding balance tracking
  - Purchase number auto-generation
  - Date-based filtering
  - Supplier-wise reports

- **Supplier Payments:**
  - Payment recording against supplier
  - Multiple payment methods (Cash, Cheque, Bank Transfer, UPI)
  - Reference number tracking
  - Outstanding balance reduction
  - Payment receipt generation

**Files:**
- [pages/PurchaseInvoices.tsx](pages/PurchaseInvoices.tsx)
- [pages/Payments.tsx](pages/Payments.tsx)
- [server/purchaseInvoiceRoutes.js](server/purchaseInvoiceRoutes.js)
- [server/supplierPaymentRoutes.js](server/supplierPaymentRoutes.js)

**API:** `/api/purchase-invoices`, `/api/supplier-payments`

**Business Rules:**
- Purchase number auto-generated
- Stock increases immediately
- Supplier outstanding balance increases
- Payment reduces outstanding balance
- Cash balance debited on purchase and payment

---

### Module 5: Financial Management

**Purpose:** Complete financial tracking and cash flow management

**Features:**

**5a. Cash Balance Ledger:**
- Transaction types: SALES, PURCHASE, EXPENSE, RECEIPT, PAYMENT
- Debit/credit double-entry system
- Opening balance (daily)
- Closing balance calculation
- Date range filtering
- Transaction type filtering
- Balance trend chart

**5b. Expenses:**
- Categorized expense tracking (10 expense heads)
- Expense head management
- Date-wise expense reports
- Expense head: Fuel, Electricity, Rent, Salaries, Marketing, Maintenance, Office Supplies, Insurance, Telephone, Miscellaneous
- Automatic cash balance debit

**5c. Payment Receipts:**
- Customer payment recording
- Outstanding balance reduction
- Payment method tracking (Cash/Cheque/Bank/UPI)
- Reference number (transaction ID)
- Receipt number auto-generation
- PDF receipt generation

**5d. Loan Management:**
- Loan taken tracking
- Loan details: amount, interest rate, term (months), lender
- Loan repayment recording
- Remaining balance calculation
- Interest calculation
- Loan status (Active/Closed)

**5e. Discount Vouchers:**
- Customer discount tracking
- Voucher number generation
- Voucher amount and reason
- Voucher status (Issued/Redeemed/Cancelled)

**Files:**
- [pages/Finance.tsx](pages/Finance.tsx)
- [pages/Expenses.tsx](pages/Expenses.tsx)
- [pages/Receipts.tsx](pages/Receipts.tsx)
- [pages/Payments.tsx](pages/Payments.tsx)
- [server/financeRoutes.js](server/financeRoutes.js)
- [server/paymentReceiptRoutes.js](server/paymentReceiptRoutes.js)
- [server/discountVoucherRoutes.js](server/discountVoucherRoutes.js)

**API:** `/api/finance/*`, `/api/payment-receipts`, `/api/supplier-payments`, `/api/discount-vouchers`

**Business Rules:**
- All financial transactions recorded in cash_balance
- Opening balance set at start of day
- Closing balance = opening + credits - debits
- Payment receipt reduces customer outstanding
- Supplier payment reduces supplier outstanding
- Expenses always debit cash balance

---

### Module 6: Partners Management

**Purpose:** Customer and supplier relationship management

**Features:**

**6a. Customer Management:**
- Customer records with contact details
- Credit limit configuration
- Outstanding balance tracking
- Credit terms (payment days)
- Tax registration details (GSTIN)
- Route assignments (for sales)
- Customer-specific tax rates
- Customer-specific discount rates
- City and phone tracking
- Customer search and filtering

**6b. Supplier Management:**
- Supplier records with contact details
- Outstanding balance tracking
- Payment terms (days)
- Tax registration
- Contact person
- City and phone tracking
- Supplier search and filtering

**Files:**
- [pages/Partners.tsx](pages/Partners.tsx)
- [services/customers.ts](services/customers.ts)
- [services/suppliers.ts](services/suppliers.ts)
- [server/customerRoutes.js](server/customerRoutes.js)
- [server/supplierRoutes.js](server/supplierRoutes.js)

**API:** `/api/customers`, `/api/suppliers`

**Business Rules:**
- Customer code must be unique
- Credit limit enforced on sales
- Outstanding balance auto-updated on transactions
- Cannot delete customer/supplier with outstanding balance
- Tax rate and discount rate optional (defaults from system)

---

### Module 7: User Management

**Purpose:** User administration and access control

**Features:**
- **User Administration:**
  - User creation and management
  - Username/password authentication
  - Role-based access (ADMIN, USER)
  - Granular permission system (11 permissions)
  - Active/inactive status
  - Default company assignment
  - User search and filtering
  - Password management (plain text in dev - needs hashing)

- **Permissions:**
  - INVENTORY_VIEW, INVENTORY_MANAGE
  - SALES_VIEW, SALES_MANAGE
  - FINANCE_VIEW, FINANCE_MANAGE
  - PARTNERS_VIEW, PARTNERS_MANAGE
  - USERS_VIEW, USERS_MANAGE
  - REPORTS_VIEW

- **WebAuthn Biometric Authentication:**
  - Fingerprint authentication
  - Face ID authentication
  - Device credential management
  - Public key cryptography
  - Counter-based replay protection
  - Multi-device support

**Files:**
- [pages/Users.tsx](pages/Users.tsx)
- [pages/Home.tsx](pages/Home.tsx) - Login page
- [services/auth.ts](services/auth.ts)
- [server/authRoutes.js](server/authRoutes.js)
- [server/userRoutes.js](server/userRoutes.js)

**API:** `/api/auth/*`, `/api/users`

**Business Rules:**
- Username must be unique
- ADMIN role has all permissions by default
- USER role has customizable permissions
- Cannot delete own account
- JWT token expires in 24 hours
- WebAuthn requires HTTPS (except localhost)

---

### Module 8: System Configuration

**Purpose:** System-wide settings and configuration

**Features:**

**8a. Tax Rates Configuration:**
- GST rate management (0%, 5%, 12%, 18%)
- Tax code and name
- Tax type (GST/VAT)
- Active/inactive status
- Apply to products
- Tax rate validation (0-100%)

**8b. Discount Rates Configuration:**
- Discount percentage presets (0%, 5%, 10%, 15%, 20%)
- Discount code and name
- Apply to customers or invoices
- Active/inactive status

**8c. Company Management:**
- Multi-tenant company setup
- Company code (unique identifier)
- Company name, address, contact
- GSTIN (GST registration)
- PAN number
- Tax registration details
- Company-based data isolation

**8d. Expense Heads:**
- Expense category management
- Head code and name
- Description
- Active/inactive status

**8e. System Backups:**
- Backup tracking
- Backup type (Full/Incremental/Manual)
- File path and size
- Backup date and status
- Restore functionality (planned)

**Files:**
- [pages/TaxRates.tsx](pages/TaxRates.tsx)
- [pages/DiscountRates.tsx](pages/DiscountRates.tsx)
- [pages/Companies.tsx](pages/Companies.tsx)
- [pages/ExpenseHeads.tsx](pages/ExpenseHeads.tsx)
- [pages/SystemBackups.tsx](pages/SystemBackups.tsx)
- [server/companyRoutes.js](server/companyRoutes.js)
- [server/systemRoutes.js](server/systemRoutes.js)

**API:** `/api/companies`, `/api/finance/tax-rates`, `/api/finance/expense-heads`, `/api/system/backups`

---

### Module 9: Reports & Analytics (Planned)

**Purpose:** Business intelligence and reporting

**Planned Features:**
- Sales reports (daily, monthly, yearly)
- Purchase reports
- Stock reports (valuation, movement)
- Financial reports (P&L, balance sheet)
- Customer ledger
- Supplier ledger
- Tax reports (GST returns)
- Custom date range reports
- Export to PDF/Excel

**Files:**
- [pages/Reports.tsx](pages/Reports.tsx)

---

### Module 10: Progressive Web App (PWA)

**Purpose:** Mobile app experience and offline capability

**Features:**
- **Service Worker:**
  - Static asset caching
  - Dynamic content caching
  - Offline fallback page
  - Update notifications
  - Background sync (planned)

- **Web App Manifest:**
  - Installable on mobile/desktop
  - Standalone app mode
  - Custom app icon
  - Splash screen
  - Shortcuts (Dashboard, Sales, Inventory)
  - Portrait orientation (mobile-optimized)

- **Utilities:**
  - Speech-to-text input (voice search)
  - Geolocation (customer location)
  - Camera capture (document scanning)
  - Date utilities (formatting, parsing)

**Files:**
- [public/sw.js](public/sw.js) - Service worker
- [public/manifest.json](public/manifest.json) - PWA manifest
- [src/utils/pwa.ts](src/utils/pwa.ts) - PWA utilities
- [src/utils/speech.ts](src/utils/speech.ts) - Voice input
- [src/utils/geolocation.ts](src/utils/geolocation.ts) - Location

**User Experience:**
- Install prompt on mobile
- Offline access to cached data
- Fast loading with cached assets
- App-like navigation
- Push notifications (planned)

---

## 7. Business Rules

### Inventory Rules

1. **Stock Management:**
   - Stock automatically decreases on sales invoice creation
   - Stock automatically increases on purchase invoice creation
   - Stock restored on sales return approval
   - Negative stock validation (sales blocked if insufficient stock)
   - Minimum stock level alerts (dashboard notification)

2. **Product Rules:**
   - Product code must be unique across company
   - Cannot delete product with transaction history
   - Cost price and selling price must be positive
   - Tax rate validation (0-100%)
   - HSN code format validation (optional)

### Sales Rules

1. **Invoice Creation:**
   - Invoice number auto-generated: `INV-{timestamp}`
   - Invoice date required
   - Customer selection mandatory
   - At least one line item required
   - Quantity must be positive integer
   - Unit price must be positive
   - Automatic calculations:
     - `discount_amount = unit_price × (discount_rate / 100)`
     - `net_amount = unit_price - discount_amount`
     - `tax_amount = net_amount × (tax_rate / 100)`
     - `line_total = (net_amount × quantity) + tax_amount`
     - `sub_total = Σ(net_amount × quantity)`
     - `total_discount = Σ(discount_amount × quantity)`
     - `total_tax = Σ(tax_amount)`
     - `total_amount = sub_total + total_tax + shipping_charges`
     - `balance_due = total_amount` (initially)

2. **Credit Management:**
   - Credit limit check before invoice creation
   - `customer.outstanding_balance + invoice.total_amount ≤ customer.credit_limit`
   - Sales blocked if credit limit exceeded (with override option for ADMIN)
   - Outstanding balance increases on invoice creation
   - Outstanding balance decreases on payment receipt

3. **Discount Rules:**
   - Customer-specific discount rate auto-applied
   - Line-item discount rate override allowed
   - Discount rate validation (0-100%)
   - Discount amount calculated before tax

4. **Tax Rules:**
   - Product tax rate applied by default
   - Tax calculated on net amount (after discount)
   - Tax amount rounded to 2 decimal places
   - GSTIN required for GST invoices (>= 18%)

### Return Rules

1. **Return Validation:**
   - Return must reference original invoice
   - Return quantity ≤ original invoice line item quantity
   - Return date ≥ invoice date
   - Cannot return more than once for same line item (planned)

2. **Return Processing:**
   - Return number auto-generated: `RET-{timestamp}`
   - Stock increases automatically on approval
   - Customer outstanding balance decreases
   - Return amount = unit_price × quantity (with original prices)
   - Return creates negative cash transaction

3. **Return Status:**
   - PENDING: Awaiting approval
   - APPROVED: Return processed (stock restored, balance adjusted)
   - REJECTED: Return denied (no changes)

### Purchase Rules

1. **Purchase Invoice:**
   - Purchase number auto-generated: `PUR-{timestamp}`
   - Supplier selection mandatory
   - Stock increases immediately on creation
   - Supplier outstanding balance increases
   - Cash balance debited (PURCHASE transaction)

2. **Supplier Payment:**
   - Payment number auto-generated: `PAY-{timestamp}`
   - Payment amount ≤ supplier outstanding balance (with validation)
   - Supplier outstanding balance decreases
   - Cash balance debited (PAYMENT transaction)
   - Payment method required (Cash/Cheque/Bank Transfer/UPI)

### Financial Rules

1. **Cash Balance:**
   - Double-entry accounting (debit/credit)
   - All transactions recorded in `cash_balance` table
   - Transaction types:
     - **SALES** (Credit): Increases cash balance
     - **PURCHASE** (Debit): Decreases cash balance
     - **EXPENSE** (Debit): Decreases cash balance
     - **RECEIPT** (Credit): Customer payment, increases balance
     - **PAYMENT** (Debit): Supplier payment, decreases balance
   - Balance calculation: `Opening + Credits - Debits = Closing`

2. **Opening Balance:**
   - Set once per day (date unique)
   - Opening balance of day N = Closing balance of day N-1
   - Manual opening balance entry allowed (first-time setup)

3. **Expense Rules:**
   - Expense head required (from predefined list)
   - Expense date required
   - Expense amount must be positive
   - Automatic cash balance debit
   - Expense categorization for reporting

4. **Payment Receipt:**
   - Receipt number auto-generated: `REC-{timestamp}`
   - Customer selection required
   - Payment amount ≤ customer outstanding balance (with validation)
   - Customer outstanding balance decreases
   - Cash balance credited (RECEIPT transaction)

5. **Loan Management:**
   - Loan number auto-generated: `LOAN-{timestamp}`
   - Interest rate validation (0-100%)
   - Loan amount must be positive
   - Loan return amount ≤ remaining loan balance
   - Loan status changes to CLOSED when fully repaid

### Partner Rules

1. **Customer Rules:**
   - Customer code must be unique
   - Credit limit must be non-negative
   - Credit terms (days) default: 0
   - Tax rate and discount rate inherit from system defaults
   - Cannot delete customer with outstanding balance > 0
   - Cannot delete customer with transaction history

2. **Supplier Rules:**
   - Supplier code must be unique
   - Payment terms (days) default: 0
   - Cannot delete supplier with outstanding balance > 0
   - Cannot delete supplier with transaction history

### User & Security Rules

1. **User Management:**
   - Username must be unique (case-insensitive)
   - Password minimum length: 3 characters (dev - should be 8+ in production)
   - ADMIN role has all permissions by default
   - USER role permissions customizable
   - Cannot delete own account
   - Cannot deactivate own account

2. **Authentication:**
   - JWT token expires in 24 hours
   - Token includes: user_id, username, role, permissions, company
   - All API routes require valid JWT (except /auth)
   - WebAuthn requires HTTPS (except localhost development)

3. **Authorization:**
   - Role-based access control (RBAC)
   - Permission checks on each API endpoint
   - Company-based data isolation (multi-tenant)
   - ADMIN can access all companies
   - USER can access only default_company

### Data Validation Rules

1. **General:**
   - All dates in ISO format (YYYY-MM-DD)
   - Decimal precision: 2 places for currency
   - Phone number: 10 digits (India)
   - Email: RFC 5322 format validation
   - GSTIN: 15 characters (alphanumeric)
   - PAN: 10 characters (alphanumeric)

2. **Required Fields:**
   - User: username, password, full_name, role
   - Product: prod_code, prod_name, category_code
   - Customer: cust_code, cust_name
   - Invoice: inv_date, cust_code, items[]
   - Payment: payment_date, amount, payment_method

3. **Unique Constraints:**
   - All code fields (prod_code, cust_code, supplier_code, etc.)
   - All number fields (inv_number, receipt_number, etc.)
   - Username
   - Category code

---

## 8. Security & Authentication

### Authentication Methods

**1. Username/Password Authentication:**
```javascript
// Login flow
POST /api/auth/login
{
  "username": "admin",
  "password": "123"
}

// Response
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}

// Store token in localStorage
localStorage.setItem('token', token);

// Include in all subsequent requests
Authorization: Bearer {token}
```

**2. WebAuthn Biometric Authentication:**
```javascript
// Registration flow
1. POST /api/auth/webauthn/register-start
   - Server generates challenge
2. Browser prompts for biometric (fingerprint/face)
3. POST /api/auth/webauthn/register-finish
   - Server verifies and stores public key

// Login flow
1. POST /api/auth/webauthn/login-start
   - Server generates challenge
2. Browser prompts for biometric
3. POST /api/auth/webauthn/login-finish
   - Server verifies signature
   - Returns JWT token
```

**Benefits:**
- Passwordless authentication
- Phishing-resistant
- Device-bound credentials
- No password to forget

**Requirements:**
- HTTPS (except localhost)
- Browser support (Chrome, Edge, Safari, Firefox)
- Compatible device (fingerprint reader, Face ID, Windows Hello)

### Authorization & Permissions

**Role Hierarchy:**
```
ADMIN
  ├── All permissions by default
  ├── Can manage all users
  ├── Can access all companies
  └── Can override business rules

USER
  ├── Customizable permissions
  ├── Limited to default company
  └── Cannot manage users
```

**Permission Matrix:**

| Permission | View | Create | Update | Delete |
|------------|------|--------|--------|--------|
| INVENTORY_VIEW | Products, Categories | - | - | - |
| INVENTORY_MANAGE | Products, Categories | ✓ | ✓ | ✓ |
| SALES_VIEW | Invoices, Returns | - | - | - |
| SALES_MANAGE | Invoices, Returns | ✓ | ✓ | ✓ |
| FINANCE_VIEW | Cash, Expenses, Receipts | - | - | - |
| FINANCE_MANAGE | Cash, Expenses, Receipts | ✓ | ✓ | ✓ |
| PARTNERS_VIEW | Customers, Suppliers | - | - | - |
| PARTNERS_MANAGE | Customers, Suppliers | ✓ | ✓ | ✓ |
| USERS_VIEW | Users | - | - | - |
| USERS_MANAGE | Users | ✓ | ✓ | ✓ |
| REPORTS_VIEW | All Reports | - | - | - |

**Permission Enforcement:**
```javascript
// Backend middleware
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user.permissions.includes(permission)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
};

// Usage
router.get('/products',
  authenticate,
  requirePermission('INVENTORY_VIEW'),
  getProducts
);
```

### Security Features

**1. SQL Injection Prevention:**
```javascript
// Parameterized queries (GOOD)
const result = await pool.query(
  'SELECT * FROM products WHERE prod_code = $1',
  [prodCode]
);

// String concatenation (BAD - vulnerable)
const result = await pool.query(
  `SELECT * FROM products WHERE prod_code = '${prodCode}'`
);
```

**2. CORS Configuration:**
```javascript
const cors = require('cors');
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
```

**3. Input Validation:**
```javascript
// Validate all inputs
const validateInvoice = (data) => {
  if (!data.inv_date || !data.cust_code || !data.items?.length) {
    throw new Error('Invalid invoice data');
  }
  if (data.items.some(item => item.quantity <= 0)) {
    throw new Error('Invalid quantity');
  }
};
```

**4. Secure Error Responses:**
```javascript
// Production error handling
app.use((err, req, res, next) => {
  logger.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    // Details hidden in production
    ...(process.env.NODE_ENV === 'development' && { details: err.message })
  });
});
```

**5. JWT Security:**
```javascript
// Token configuration
const token = jwt.sign(
  { userId, username, role, permissions, company },
  process.env.JWT_SECRET,
  { expiresIn: '24h' }  // Token expires in 24 hours
);

// Verify token on each request
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
```

### Audit Trail

**1. Timestamps:**
- All tables have `created_at`, `updated_at`
- Transactions have `created_at` only (immutable)

**2. User Tracking:**
- `created_by`, `updated_by` fields (user_id)
- Captures who performed the action

**3. Logging:**
- File-based logging ([logger.js](logger.js))
- Log levels: debug, info, warn, error
- Specialized logging:
  - `logger.logLogin()` - Login attempts
  - `logger.logAuth()` - Authentication events
  - `logger.logSecurity()` - Security events
  - `logger.logDBError()` - Database errors

**4. Security Events Logged:**
- Login attempts (success/failure)
- Token verification failures
- Permission denied events
- WebAuthn registration/login
- User creation/deletion
- Sensitive data access

### Security Recommendations

**For Production Deployment:**

1. **Password Hashing:**
   ```javascript
   // Use bcrypt for password hashing
   const bcrypt = require('bcrypt');
   const hashedPassword = await bcrypt.hash(password, 10);
   const isMatch = await bcrypt.compare(password, hashedPassword);
   ```

2. **Environment Variables:**
   ```bash
   # Use strong JWT secret (256-bit minimum)
   JWT_SECRET=<random-256-bit-string>

   # Use environment-specific database URLs
   DATABASE_URL=<production-database-url>

   # Enable HTTPS
   HTTPS=true
   SSL_CERT_PATH=/path/to/cert.pem
   SSL_KEY_PATH=/path/to/key.pem
   ```

3. **Rate Limiting:**
   ```javascript
   const rateLimit = require('express-rate-limit');
   const loginLimiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 5, // 5 attempts
     message: 'Too many login attempts'
   });
   app.post('/api/auth/login', loginLimiter, login);
   ```

4. **HTTPS Enforcement:**
   ```javascript
   app.use((req, res, next) => {
     if (!req.secure && process.env.NODE_ENV === 'production') {
       return res.redirect('https://' + req.headers.host + req.url);
     }
     next();
   });
   ```

5. **Database Security:**
   - Use connection pooling with max connections limit
   - Enable SSL/TLS for database connections
   - Use separate database users with minimal privileges
   - Regular security patches and updates

6. **API Security:**
   - Implement API request throttling
   - Add request size limits
   - Validate Content-Type headers
   - Implement CSRF protection for state-changing operations

---

## 9. Configuration

### Environment Variables

**File:** [.env](.env)

```bash
# Environment
NODE_ENV=development  # development | production | test

# Server Configuration
PORT=5000
HOST=0.0.0.0

# Database Configuration (Production - Neon Cloud)
DATABASE_URL=postgresql://neondb_owner:npg_ovZd3stmF2Iy@ep-plain-feather-a4fia26t-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

# Database Configuration (Development - Local)
DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=lalani_erp
DB_USER=user
DB_PASSWORD=ayaz12344321

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here  # Change in production!
JWT_EXPIRES_IN=24h

# WebAuthn Configuration
WEBAUTHN_RP_ID=localhost  # Change to your domain in production
WEBAUTHN_ORIGIN=http://localhost:5173  # Change to HTTPS in production

# Logging
LOG_LEVEL=debug  # debug | info | warn | error
LOG_FILE=logs/app.log
LOG_MAX_SIZE=5242880  # 5MB

# Database Migration
FORCE_DB_RESET=false  # Set to true to force reset DB on startup

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173  # Change in production
```

### TypeScript Configuration

**File:** [tsconfig.json](tsconfig.json)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src", "components", "pages", "services", "types.ts"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### Vite Configuration

**File:** [vite.config.ts](vite.config.ts)

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['lucide-react', 'recharts'],
          utils: ['jspdf', 'html2canvas']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
});
```

**Build Optimization:**
- Code splitting (vendor, ui, utils)
- Terser minification
- Drop console logs in production
- Chunk size limit: 1000kb

### Database Migration Configuration

**File:** [database.json](database.json)

```json
{
  "dev": {
    "driver": "pg",
    "host": "127.0.0.1",
    "port": 5432,
    "user": "user",
    "password": "ayaz12344321",
    "database": "lalani_erp",
    "schema": "public"
  },
  "production": {
    "driver": "pg",
    "use_env_variable": "DATABASE_URL",
    "ssl": {
      "rejectUnauthorized": false
    }
  }
}
```

**Migration Commands:**
```bash
npm run db:migrate         # Run pending migrations
npm run db:migrate:down    # Rollback last migration
npm run db:migrate:create  # Create new migration
npm run db:migrate:reset   # Reset all migrations
```

### PWA Configuration

**File:** [public/manifest.json](public/manifest.json)

```json
{
  "name": "Lalani Traders ERP",
  "short_name": "Lalani ERP",
  "description": "Enterprise Resource Planning system for Lalani Traders",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#ef4444",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "shortcuts": [
    {
      "name": "Dashboard",
      "short_name": "Dashboard",
      "description": "View dashboard",
      "url": "/#/dashboard",
      "icons": [{ "src": "/icon-192.png", "sizes": "192x192" }]
    },
    {
      "name": "New Sale",
      "short_name": "Sale",
      "description": "Create new sale",
      "url": "/#/dashboard/sales",
      "icons": [{ "src": "/icon-192.png", "sizes": "192x192" }]
    }
  ]
}
```

### Logging Configuration

**File:** [logger.js](logger.js)

```javascript
class Logger {
  constructor() {
    this.logFile = process.env.LOG_FILE || 'logs/app.log';
    this.maxSize = 5 * 1024 * 1024; // 5MB
    this.logLevel = process.env.LOG_LEVEL || 'debug';
  }

  log(level, message, data) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data: data ? JSON.stringify(data) : undefined
    };

    // Write to file
    this.writeToFile(logEntry);

    // Write to console
    console.log(`[${timestamp}] [${level}] ${message}`, data || '');
  }

  // Specialized methods
  error(message, error) { ... }
  logLogin(username, success, ip) { ... }
  logAuth(event, username) { ... }
  logSecurity(event, details) { ... }
  logDBError(operation, error) { ... }
}
```

**Log Rotation:**
- Automatic rotation when file exceeds 5MB
- Rotated files: `app-{timestamp}.log`
- Old logs preserved in `/logs` directory

---

## 10. Development Guide

### Prerequisites

**Required:**
- Node.js 18+ (LTS recommended)
- PostgreSQL 15+ (local or cloud)
- npm 9+ or yarn 1.22+
- Git

**Optional:**
- Docker Desktop (for containerized PostgreSQL)
- VS Code (recommended IDE)
- PostgreSQL GUI (pgAdmin, DBeaver, TablePlus)

### Local Development Setup

**Step 1: Clone Repository**
```bash
git clone <repository-url>
cd Lalani_ERP/lalani_erp
```

**Step 2: Install Dependencies**
```bash
npm install
```

**Step 3: Setup Environment Variables**
```bash
# Copy .env.example to .env (if exists)
cp .env.example .env

# Or create .env manually with required variables
# See section 9 for all environment variables
```

**Step 4: Setup Database**

**Option A: Local PostgreSQL**
```bash
# Create database
createdb lalani_erp

# Or using psql
psql -U postgres
CREATE DATABASE lalani_erp;
\q

# Run migrations
npm run db:migrate
```

**Option B: Docker PostgreSQL**
```bash
# Start PostgreSQL container
npm run db:up

# Wait 10 seconds for DB to initialize
sleep 10

# Run migrations
npm run db:migrate
```

**Option C: Use Neon Cloud (Production DB)**
```bash
# Update .env with DATABASE_URL
DATABASE_URL=<your-neon-connection-string>

# Run migrations
npm run db:migrate
```

**Step 5: Start Development Servers**

**Terminal 1 - Frontend (Vite):**
```bash
npm run dev
# Starts Vite dev server on http://localhost:5173
```

**Terminal 2 - Backend (Express):**
```bash
npm run dev:server
# Starts Express API server on http://localhost:5000
# Auto-restarts on file changes (nodemon)
```

**Step 6: Access Application**
```
URL: http://localhost:5173
Login: admin / 123
```

### Development Workflow

**1. Database Changes:**
```bash
# Create new migration
npm run db:migrate:create add-new-feature

# Edit migration files in /migrations/sqls/
# - <timestamp>-add-new-feature-up.sql
# - <timestamp>-add-new-feature-down.sql

# Run migration
npm run db:migrate

# Rollback if needed
npm run db:migrate:down
```

**2. Backend Changes:**
```bash
# Edit routes in /server/*Routes.js
# Add/modify endpoints
# Test with Postman/curl

# Server auto-restarts via nodemon
```

**3. Frontend Changes:**
```bash
# Edit components in /components/*.tsx
# Edit pages in /pages/*.tsx
# Edit services in /services/*.ts

# Vite HMR updates browser instantly
```

**4. Testing:**
```bash
# Manual testing via browser
# API testing via Postman/curl

# Example API test
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"123"}'
```

**5. Database Reset (if needed):**
```bash
# Reset all migrations and data
npm run db:migrate:reset

# Or force reset via environment
FORCE_DB_RESET=true npm run dev:server
```

### Code Organization Best Practices

**1. Backend Route Structure:**
```javascript
// server/exampleRoutes.js
const express = require('express');
const router = express.Router();
const pool = require('../database/pool');
const { authenticate, requirePermission } = require('./middleware/auth');

router.get('/', authenticate, requirePermission('EXAMPLE_VIEW'), async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const result = await pool.query(
      'SELECT * FROM examples WHERE comp_code = $1 LIMIT $2 OFFSET $3',
      [req.user.company, limit, offset]
    );

    res.json({ data: result.rows });
  } catch (error) {
    logger.error('Error fetching examples:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
```

**2. Frontend Service Structure:**
```typescript
// services/example.ts
import { api } from './api';

export interface Example {
  id: number;
  name: string;
  created_at: string;
}

export const exampleService = {
  getAll: async (page = 1, limit = 10): Promise<Example[]> => {
    const response = await api.get('/examples', { params: { page, limit } });
    return response.data;
  },

  create: async (data: Partial<Example>): Promise<Example> => {
    const response = await api.post('/examples', data);
    return response.data;
  }
};
```

**3. Frontend Page Structure:**
```tsx
// pages/Example.tsx
import React, { useState, useEffect } from 'react';
import { exampleService, Example } from '../services/example';
import { useLoading } from '../contexts/LoadingContext';
import { useNotification } from '../contexts/NotificationContext';

export const ExamplePage: React.FC = () => {
  const [examples, setExamples] = useState<Example[]>([]);
  const { setLoading } = useLoading();
  const { showNotification } = useNotification();

  useEffect(() => {
    loadExamples();
  }, []);

  const loadExamples = async () => {
    try {
      setLoading(true);
      const data = await exampleService.getAll();
      setExamples(data);
    } catch (error) {
      showNotification('Error loading examples', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Examples</h1>
      {/* Component content */}
    </div>
  );
};
```

### Debugging Tips

**1. Backend Debugging:**
```javascript
// Use logger instead of console.log
logger.debug('User data:', user);
logger.error('Database error:', error);

// Check logs/app.log for details
tail -f logs/app.log
```

**2. Frontend Debugging:**
```typescript
// Use browser DevTools
console.log('State:', examples);

// Check Network tab for API requests
// Check Console for errors
// Use React DevTools for component inspection
```

**3. Database Debugging:**
```bash
# Connect to database
psql -U user -d lalani_erp

# Check tables
\dt

# Query data
SELECT * FROM products;

# Check indexes
\di

# Check foreign keys
\d+ sales_invoices
```

**4. Common Issues:**

**Issue: Port already in use**
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Or use different port
PORT=5001 npm run dev:server
```

**Issue: Database connection failed**
```bash
# Check PostgreSQL is running
pg_isready

# Check credentials in .env
cat .env | grep DB_

# Test connection
psql -U user -d lalani_erp -c "SELECT 1"
```

**Issue: Migration failed**
```bash
# Check migration SQL syntax
cat migrations/sqls/<timestamp>-up.sql

# Run migration with verbose output
npm run db:migrate -- --verbose

# Rollback and retry
npm run db:migrate:down
npm run db:migrate
```

---

## 11. Deployment

### Production Build

**Step 1: Prepare Environment**
```bash
# Update .env for production
NODE_ENV=production
PORT=5000
DATABASE_URL=<production-database-url>
JWT_SECRET=<strong-random-secret>
WEBAUTHN_RP_ID=<your-domain.com>
WEBAUTHN_ORIGIN=https://<your-domain.com>
FRONTEND_URL=https://<your-domain.com>
```

**Step 2: Build Frontend**
```bash
npm run build
# Outputs to /dist directory
# Size: ~2MB (minified and gzipped)
```

**Step 3: Test Production Build**
```bash
npm run preview
# Serves production build on http://localhost:4173
```

**Step 4: Start Production Server**
```bash
npm start
# Serves both frontend (from /dist) and API on port 5000
```

### Deployment Options

**Option 1: VPS/Cloud Server (Digital Ocean, AWS EC2, etc.)**

**Requirements:**
- Ubuntu 22.04 LTS or similar
- 2GB+ RAM
- 20GB+ storage
- Node.js 18+ installed
- PostgreSQL 15+ installed
- Nginx (reverse proxy)
- PM2 (process manager)

**Deployment Steps:**
```bash
# SSH into server
ssh user@your-server-ip

# Install dependencies
sudo apt update
sudo apt install -y nodejs npm postgresql nginx

# Install PM2 globally
sudo npm install -g pm2

# Clone repository
git clone <repository-url>
cd Lalani_ERP/lalani_erp

# Install dependencies
npm install

# Setup database
sudo -u postgres createdb lalani_erp
npm run db:migrate

# Build frontend
npm run build

# Start with PM2
pm2 start server.js --name lalani-erp
pm2 save
pm2 startup

# Configure Nginx
sudo nano /etc/nginx/sites-available/lalani-erp
```

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**SSL/HTTPS Setup (Let's Encrypt):**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
sudo certbot renew --dry-run  # Test renewal
```

**Option 2: Heroku**

**Deployment Steps:**
```bash
# Install Heroku CLI
curl https://cli-assets.heroku.com/install.sh | sh

# Login
heroku login

# Create app
heroku create lalani-erp

# Add PostgreSQL addon
heroku addons:create heroku-postgresql:mini

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=<random-secret>
heroku config:set WEBAUTHN_RP_ID=lalani-erp.herokuapp.com
heroku config:set WEBAUTHN_ORIGIN=https://lalani-erp.herokuapp.com

# Deploy
git push heroku main

# Run migrations
heroku run npm run db:migrate

# Open app
heroku open
```

**Option 3: Docker Deployment**

**Dockerfile:**
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 5000

CMD ["npm", "start"]
```

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:XXXXX@db:5432/XXXXX
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=lalani_erp
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    restart: unless-stopped

volumes:
  postgres_data:
```

**Deploy:**
```bash
docker-compose up -d
docker-compose exec app npm run db:migrate
```

### Post-Deployment Checklist

- [ ] Database migrations applied successfully
- [ ] Environment variables set correctly
- [ ] HTTPS/SSL certificate installed
- [ ] Application accessible via domain
- [ ] Login working (test with admin/123)
- [ ] Create test invoice and verify stock updates
- [ ] Check logs for errors (`pm2 logs` or `docker-compose logs`)
- [ ] Setup automated backups (database + files)
- [ ] Configure monitoring (PM2, DataDog, New Relic, etc.)
- [ ] Setup error tracking (Sentry, Rollbar, etc.)
- [ ] Configure firewall (allow only 80, 443, SSH)
- [ ] Change default admin password
- [ ] Implement password hashing (bcrypt)
- [ ] Enable rate limiting
- [ ] Setup automated database backups

### Monitoring & Maintenance

**PM2 Process Monitoring:**
```bash
pm2 status              # Check status
pm2 logs lalani-erp     # View logs
pm2 restart lalani-erp  # Restart app
pm2 monit               # Real-time monitoring
```

**Database Backups:**
```bash
# Automated daily backups
crontab -e

# Add cron job (runs daily at 2 AM)
0 2 * * * pg_dump -U user lalani_erp > /backups/lalani_erp_$(date +\%Y\%m\%d).sql
```

**Application Updates:**
```bash
# Pull latest code
git pull origin main

# Install dependencies
npm install

# Build frontend
npm run build

# Run migrations
npm run db:migrate

# Restart app
pm2 restart lalani-erp
```

---

## 12. Troubleshooting

### Common Issues and Solutions

**Issue 1: Cannot connect to database**

**Symptoms:**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solutions:**
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Start PostgreSQL
sudo systemctl start postgresql

# Check connection
psql -U user -d lalani_erp -c "SELECT 1"

# Check .env credentials
cat .env | grep DB_
```

---

**Issue 2: Port already in use**

**Symptoms:**
```
Error: listen EADDRINUSE: address already in use :::5000
```

**Solutions:**
```bash
# Find process using port 5000
lsof -i :5000

# Kill process
kill -9 <PID>

# Or use different port
PORT=5001 npm run dev:server
```

---

**Issue 3: JWT token expired**

**Symptoms:**
```
401 Unauthorized: Invalid token
```

**Solutions:**
```javascript
// Frontend: Clear localStorage and re-login
localStorage.clear();
window.location.href = '/';

// Backend: Check JWT_EXPIRES_IN in .env
JWT_EXPIRES_IN=24h  // Increase if needed
```

---

**Issue 4: Migration failed**

**Symptoms:**
```
Error: relation "products" already exists
```

**Solutions:**
```bash
# Check migration status
npm run db:migrate -- --check

# Rollback last migration
npm run db:migrate:down

# Reset all migrations (WARNING: deletes all data)
npm run db:migrate:reset

# Re-run migrations
npm run db:migrate
```

---

**Issue 5: Stock not updating after sale**

**Cause:** Transaction error or missing CASCADE on foreign key

**Solution:**
```sql
-- Check product stock
SELECT prod_code, prod_name, current_stock FROM products WHERE prod_code = 'APOLLO-TRUCK-01';

-- Check sales_invoice_items
SELECT * FROM sales_invoice_items WHERE inv_id = 1;

-- Manually adjust stock (if needed)
UPDATE products SET current_stock = current_stock - 4 WHERE prod_code = 'APOLLO-TRUCK-01';
```

---

**Issue 6: WebAuthn not working**

**Symptoms:**
```
Error: The operation either timed out or was not allowed
```

**Solutions:**
```bash
# Ensure HTTPS (required for WebAuthn except localhost)
# Check browser support (Chrome 67+, Edge 18+, Safari 13+)

# Update .env for production
WEBAUTHN_RP_ID=your-domain.com  # No protocol, no port
WEBAUTHN_ORIGIN=https://your-domain.com  # Full URL with https
```

---

**Issue 7: PDF generation not working**

**Cause:** html2canvas rendering issues or missing fonts

**Solution:**
```javascript
// Increase timeout in jsPDF configuration
await html2canvas(element, {
  scale: 2,
  useCORS: true,
  logging: false,
  windowWidth: 1200,
  timeout: 30000  // Increase timeout
});

// Check for console errors in browser DevTools
```

---

**Issue 8: Slow query performance**

**Solution:**
```sql
-- Check query execution plan
EXPLAIN ANALYZE SELECT * FROM sales_invoices WHERE cust_code = 'CUST-001';

-- Create missing indexes
CREATE INDEX idx_sales_invoices_customer ON sales_invoices(cust_code);

-- Analyze table statistics
ANALYZE sales_invoices;

-- Vacuum database
VACUUM ANALYZE;
```

---

**Issue 9: Memory leak / High memory usage**

**Symptoms:**
```
Server becomes slow after running for hours
```

**Solutions:**
```javascript
// Close database connections properly
const client = await pool.connect();
try {
  // Query
} finally {
  client.release();  // Always release
}

// Increase Node.js memory limit
NODE_OPTIONS=--max-old-space-size=4096 npm start
```

---

**Issue 10: Frontend not loading after build**

**Symptoms:**
```
Blank page, console shows 404 errors for assets
```

**Solutions:**
```bash
# Check build output
ls -la dist/

# Verify server is serving from dist/
# In server.js:
app.use(express.static(path.join(__dirname, 'dist')));

# Clear browser cache
Ctrl+Shift+R (hard refresh)

# Check vite.config.ts base path
base: '/',  // Should be root for HashRouter
```

---

### Getting Help

**Resources:**
- [README.md](README.md) - Setup and usage guide
- [PROJECT_SPEC.json](PROJECT_SPEC.json) - Detailed specifications
- [LOGGING_DOCUMENTATION.md](LOGGING_DOCUMENTATION.md) - Logging guide

**Error Logs:**
```bash
# Check application logs
tail -f logs/app.log

# Check server console output
pm2 logs lalani-erp

# Check database logs (Ubuntu)
sudo tail -f /var/log/postgresql/postgresql-15-main.log
```

**Debugging Mode:**
```bash
# Enable debug logging
LOG_LEVEL=debug npm run dev:server

# Enable verbose database queries
NODE_ENV=development npm run dev:server
```

---

## Conclusion

This documentation provides a comprehensive overview of the Lalani Traders ERP system. The application is production-ready with robust features for inventory management, sales processing, financial tracking, and user management.

**Key Strengths:**
- Modern tech stack (React, TypeScript, PostgreSQL)
- Multi-tenant architecture
- Biometric authentication
- PWA support for mobile/offline
- Comprehensive business logic
- Audit trail and logging

**Production Recommendations:**
1. Implement password hashing (bcrypt)
2. Add automated testing (unit, integration, E2E)
3. Implement rate limiting
4. Add API documentation (Swagger)
5. Setup error tracking (Sentry)
6. Implement automated backups
7. Add performance monitoring

**Next Steps:**
- Complete notification system
- Implement global search
- Add advanced reporting
- Mobile app (React Native)
- Multi-language support

---

**Document Version:** 1.0
**Last Updated:** January 1, 2026
**Maintained by:** Development Team
