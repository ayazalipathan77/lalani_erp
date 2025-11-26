# Lalani Traders ERP System

A comprehensive Enterprise Resource Planning (ERP) system built for tire trading businesses. Features inventory management, sales invoicing, finance tracking, customer/supplier management, and user administration.

## 🚀 Features

- **Inventory Management**: Track products, categories, and stock levels
- **Sales & Invoicing**: Create and manage customer invoices with automatic stock updates
- **Customer Management**: Maintain customer records and credit limits
- **Supplier Management**: Track suppliers and outstanding balances
- **Financial Tracking**: Monitor cash flow, expenses, and transactions
- **User Management**: Role-based access control with granular permissions
- **Reports & Analytics**: Dashboard with key metrics and charts

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
- **Backend**: Node.js, Express.js, PostgreSQL
- **Charts**: Recharts
- **Icons**: Lucide React
- **PDF Generation**: jsPDF, html2canvas

## 📋 Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v15 or higher)
- npm or yarn

## 🔧 Local Development Setup

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd lalani-erp
npm install
```

### 2. Database Setup

The project is configured to work with your local PostgreSQL instance. Make sure PostgreSQL is running and update the `.env` file with your database credentials:

```bash
# Copy the environment template
cp .env.example .env

# Edit .env with your database details (already configured for your setup)
# DATABASE_URL=postgresql://user:ayaz12344321@127.0.0.1:5432/lalani_erp
```

### 3. Initialize Database

Run the database setup script to create the `lalani_erp` database and populate it with sample data:

```bash
npm run db:setup
```

This will:
- Create the `lalani_erp` database
- Run the complete schema with all tables, indexes, and relationships
- Insert sample data for testing

### 4. Start the Application

```bash
# Start the server
npm start

# Or for development with auto-restart
npm run dev:server
```

The application will be available at:
- **Frontend**: http://localhost:3000 (Vite dev server)
- **Backend API**: http://localhost:5000

### 5. Access the Application

Open your browser and navigate to http://localhost:3000

**Default Login Credentials:**
- **Username**: admin
- **Password**: 123

## 📁 Project Structure

```
lalani-erp/
├── components/          # Reusable React components
├── database/           # Database schema and migrations
├── pages/              # Page components and routing
├── scripts/            # Utility scripts (database setup)
├── server/             # Express.js backend
├── services/           # API services and mock data
├── public/             # Static assets
├── .env                # Environment variables (local)
├── .env.example        # Environment template
├── docker-compose.yml  # Docker setup for PostgreSQL
├── package.json        # Dependencies and scripts
└── README.md          # This file
```

## 🐳 Docker Setup (Alternative)

If you prefer using Docker for PostgreSQL:

```bash
# Start PostgreSQL with Docker
npm run db:up

# Stop PostgreSQL
npm run db:down

# Reset database (removes all data)
npm run db:reset
```

## 📊 Database Schema

The system uses PostgreSQL with the following main tables:

- `companies` - Company information
- `users` - User accounts and permissions
- `categories` - Product categories
- `products` - Inventory items
- `customers` - Customer records
- `suppliers` - Supplier records
- `sales_invoices` - Invoice headers
- `sales_invoice_items` - Invoice line items
- `cash_balance` - Financial transactions
- `expenses` - Expense tracking

## 🔐 User Roles & Permissions

- **ADMIN**: Full system access
- **USER**: Limited access based on assigned permissions

Available permissions:
- `INVENTORY_VIEW`, `INVENTORY_MANAGE`
- `SALES_VIEW`, `SALES_MANAGE`
- `FINANCE_VIEW`, `FINANCE_MANAGE`
- `PARTNERS_VIEW`, `PARTNERS_MANAGE`
- `USERS_VIEW`, `USERS_MANAGE`
- `REPORTS_VIEW`

## 🚀 Production Deployment

### Environment Variables

For production deployment, set these environment variables:

```bash
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://username:password@host:port/database?ssl=true
JWT_SECRET=your-production-jwt-secret
```

### Build Commands

```bash
# Build for production
npm run build

# Start production server
npm start
```

## 🐛 Troubleshooting

### Database Connection Issues

1. Ensure PostgreSQL is running: `sudo systemctl status postgresql`
2. Check database credentials in `.env` file
3. Verify user has database creation privileges

### Port Conflicts

If port 5000 is in use, change the PORT in `.env`:
```bash
PORT=5001
```

### Permission Issues

Make sure your PostgreSQL user has the necessary privileges:
```sql
ALTER USER your_user CREATEDB;
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is proprietary software for Lalani Traders.

## 📞 Support

For support or questions, contact the development team.
