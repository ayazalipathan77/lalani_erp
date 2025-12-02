# Tax Rate Management & Multi-Company Support Implementation Guide

## Overview

This document provides a comprehensive implementation plan for integrating tax rate management and enabling true multi-company support in the Lalani ERP system.

## Current State Analysis

### Tax Rate Management
- **Database**: `tax_rates` table exists with GST rates (5%, 12%, 18%, 0%)
- **API**: `/api/finance/tax-rates` endpoints implemented
- **UI**: Tax Rates management page exists (`/dashboard/tax-rates`)
- **Issue**: Tax rates are NOT applied in invoice calculations (hardcoded 5% rate used)

### Multi-Company Support
- **Database**: All tables have `comp_code` foreign keys to `companies` table
- **API**: `/api/companies` CRUD endpoints implemented
- **UI**: Company management page exists (`/dashboard/companies`)
- **Issue**: All backend operations hardcoded to use `'CMP01'` (single company)

## Implementation Plan

## Phase 1: Tax Rate Integration

### 1.1 Database Schema Updates

**File**: `database/schema.sql`

Add tax rate reference to products table:
```sql
-- Add tax_code reference to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS tax_code VARCHAR(20) REFERENCES tax_rates(tax_code);

-- Set default tax rate for existing products
UPDATE products SET tax_code = 'GST5' WHERE tax_code IS NULL;
```

### 1.2 Backend API Updates

**File**: `server.js`

#### Update Product APIs to include tax_code:
```javascript
// GET /api/products - Include tax_code in response
// POST /api/products - Accept tax_code in request body
// PUT /api/products/:id - Allow tax_code updates
```

#### Update Invoice Calculation Logic:
```javascript
// Replace hardcoded tax calculation in invoice creation
app.post('/api/invoices', async (req, res) => {
    // ... existing code ...

    // Calculate tax based on product tax rates
    let totalTaxAmount = 0;
    for (const item of items) {
        const productResult = await client.query(
            'SELECT p.*, tr.tax_rate FROM products p JOIN tax_rates tr ON p.tax_code = tr.tax_code WHERE p.prod_code = $1',
            [item.prod_code]
        );
        const product = productResult.rows[0];
        const itemTax = item.line_total * (product.tax_rate / 100);
        totalTaxAmount += itemTax;
    }

    const total_amount = sub_total + totalTaxAmount;

    // ... rest of invoice creation ...
});
```

### 1.3 Frontend Updates

**File**: `pages/dashboard/Sales.tsx`

Update invoice creation form to show tax breakdown:
```typescript
// Display tax rate for each product
// Show total tax amount calculation
// Allow tax rate selection per product if needed
```

## Phase 2: Multi-Company Support

### 2.1 User Session Context

**File**: `server.js`

Add company context to user authentication:
```javascript
// Extend JWT token to include selected company
const token = jwt.sign({
    userId: user.user_id,
    username: user.username,
    selectedCompany: user.default_company || 'CMP01'  // Add to users table
}, process.env.JWT_SECRET, { expiresIn: '24h' });
```

**Database**: Add default company to users table:
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS default_company VARCHAR(10) REFERENCES companies(comp_code) DEFAULT 'CMP01';
```

### 2.2 Company Context Middleware

**File**: `server.js`

Create middleware to extract company from request:
```javascript
const getCompanyContext = (req) => {
    // Priority: 1. Request header, 2. User session, 3. Default
    return req.headers['x-company-code'] ||
           req.user?.selectedCompany ||
           'CMP01';
};
```

### 2.3 Update All API Endpoints

Replace hardcoded `'CMP01'` with dynamic company context:

```javascript
// Example: Update product creation
app.post('/api/products', async (req, res) => {
    const companyCode = getCompanyContext(req);
    // ... use companyCode instead of 'CMP01'
});
```

### 2.4 API Filtering by Company

Update all GET endpoints to filter by company:
```javascript
app.get('/api/products', async (req, res) => {
    const companyCode = getCompanyContext(req);

    const result = await pool.query(
        'SELECT * FROM products WHERE comp_code = $1 ORDER BY prod_name',
        [companyCode]
    );
    // ...
});
```

### 2.5 Frontend Company Selector

**File**: `components/CompanySelector.tsx` (New)

```typescript
const CompanySelector: React.FC = () => {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [selectedCompany, setSelectedCompany] = useState<string>('');

    // Fetch available companies for user
    // Allow company switching
    // Update API calls with selected company
};
```

**File**: `App.tsx`

Add company context provider:
```typescript
const CompanyProvider: React.FC = ({ children }) => {
    const [selectedCompany, setSelectedCompany] = useState<string>('CMP01');

    return (
        <CompanyContext.Provider value={{ selectedCompany, setSelectedCompany }}>
            {children}
        </CompanyContext.Provider>
    );
};
```

## Phase 3: Integration & Testing

### 3.1 Update API Service

**File**: `services/api.ts`

Add company header to all API calls:
```typescript
const api = {
    // Add company header to all requests
    _getHeaders: () => ({
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'X-Company-Code': selectedCompany,  // From context
        'Content-Type': 'application/json'
    }),

    // Update all API methods to use dynamic headers
};
```

### 3.2 Permission System Updates

**File**: `server.js`

Add company-level permissions:
```javascript
// Check if user has access to the requested company
const hasCompanyAccess = async (userId, companyCode) => {
    // Query user_company_access table or check user permissions
};
```

### 3.3 Data Migration

Create migration scripts for existing data:
```sql
-- Assign all existing data to default company
UPDATE products SET comp_code = 'CMP01' WHERE comp_code IS NULL;
UPDATE customers SET comp_code = 'CMP01' WHERE comp_code IS NULL;
-- ... update all tables
```

## Phase 4: Advanced Features

### 4.1 Tax Rate Categories

**Database**: Extend tax_rates table:
```sql
ALTER TABLE tax_rates ADD COLUMN IF NOT EXISTS category VARCHAR(50); -- 'GST', 'VAT', 'EXCISE'
ALTER TABLE tax_rates ADD COLUMN IF NOT EXISTS effective_from DATE;
ALTER TABLE tax_rates ADD COLUMN IF NOT EXISTS effective_to DATE;
```

### 4.2 Company-Specific Tax Rates

Allow different tax rates per company:
```sql
-- Tax rates already have comp_code, so they're company-specific
-- Ensure tax_codes are unique per company
ALTER TABLE tax_rates DROP CONSTRAINT tax_rates_tax_code_key;
ALTER TABLE tax_rates ADD CONSTRAINT tax_rates_company_code_unique UNIQUE(comp_code, tax_code);
```

### 4.3 Tax Reports

**New API**: `/api/reports/tax-summary`
```javascript
// Generate tax reports by period, company, tax type
// Include input tax credit calculations
// GST return preparation data
```

## Implementation Checklist

### Database Changes
- [ ] Add tax_code to products table
- [ ] Add default_company to users table
- [ ] Add company access control table
- [ ] Create indexes for performance

### Backend Changes
- [ ] Update all API endpoints to use company context
- [ ] Implement tax calculation logic
- [ ] Add company validation middleware
- [ ] Update authentication to include company context

### Frontend Changes
- [ ] Create CompanySelector component
- [ ] Update all API calls to include company headers
- [ ] Modify invoice forms to show tax breakdowns
- [ ] Add company switching functionality

### Testing
- [ ] Test single company operations
- [ ] Test company switching
- [ ] Test tax calculations
- [ ] Test data isolation between companies
- [ ] Test permission controls

## Migration Strategy

### Phase 1: Parallel Operation
1. Deploy new code alongside existing system
2. Run data migration scripts
3. Test with sample data

### Phase 2: Gradual Rollout
1. Enable multi-company for select users
2. Monitor performance and data integrity
3. Train users on company switching

### Phase 3: Full Migration
1. Update all users to use company context
2. Remove hardcoded company references
3. Enable full multi-company features

## Risk Mitigation

### Data Integrity
- Implement database constraints
- Add validation at API level
- Create audit trails for company changes

### Performance
- Add database indexes for company filtering
- Implement query result caching
- Monitor database performance

### User Experience
- Provide clear company indicators in UI
- Implement smooth company switching
- Add confirmation dialogs for company changes

## Success Metrics

1. **Data Isolation**: Zero cross-company data leakage
2. **Tax Accuracy**: 100% correct tax calculations
3. **Performance**: <2 second response times for all operations
4. **User Adoption**: >95% user completion rate for company switching
5. **Error Rate**: <0.1% error rate in multi-company operations

## Rollback Plan

If issues arise:
1. Switch back to single company mode via feature flag
2. Restore database from backup
3. Revert code to previous version
4. Communicate with users about temporary issues

## Conclusion

This implementation will transform the Lalani ERP from a single-company system to a robust multi-company ERP with proper tax management. The phased approach ensures minimal disruption while providing comprehensive functionality.