# Future Features & Implementation Plans

This file contains detailed implementation plans for future features in the Lalani ERP system. Each feature includes comprehensive task breakdowns, technical specifications, and implementation guidance.

## How to Use This File

- **Priority Levels**: 🔴 High, 🟡 Medium, 🟢 Low
- **Status**: 📋 Planned, 🚧 In Progress, ✅ Completed, ❌ Cancelled
- **Estimated Time**: Rough development time estimates
- **Dependencies**: Prerequisites or related features

---

## 🔴 1. Notification System (High Priority)

**Status**: 📋 Planned | **Estimated Time**: 16-22 hours | **Priority**: High

**Overview**: Implement a comprehensive notification system for the dashboard bell icon, providing real-time alerts for business events, system notifications, and user-specific messages.

### Database Schema
```sql
CREATE TABLE notifications (
    notification_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info', -- info, warning, success, error
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    related_entity_type VARCHAR(50), -- 'invoice', 'customer', 'product', etc.
    related_entity_id INTEGER,
    action_url VARCHAR(255) -- Optional URL to navigate to when clicked
);
```

### Implementation Phases

#### Phase 1: Database & Backend Foundation
- [ ] Create notifications table in database schema
- [ ] Create migration script to add notifications table
- [ ] Add notification API endpoints:
  - `GET /api/notifications` - Get user's notifications with pagination
  - `GET /api/notifications/unread-count` - Get unread count for badge
  - `PUT /api/notifications/:id/read` - Mark notification as read
  - `PUT /api/notifications/mark-all-read` - Mark all as read
  - `DELETE /api/notifications/:id` - Delete notification
  - `POST /api/notifications` - Create notification (internal/admin use)

#### Phase 2: Frontend Components
- [ ] Create NotificationDropdown component with:
  - List of notifications with icons and timestamps
  - Mark as read functionality
  - Delete notification option
  - Empty state when no notifications
  - Load more pagination
- [ ] Update Dashboard header bell icon to:
  - Show unread count badge
  - Toggle notification dropdown
  - Animate when new notifications arrive
- [ ] Add notification context/state management

#### Phase 3: Notification Triggers & Logic
- [ ] Implement notification service functions:
  - `createNotification(userId, title, message, type, entityType, entityId)`
  - `notifyLowStock(product)` - Trigger when stock < min_level
  - `notifyOverdueInvoice(invoice)` - Trigger for overdue payments
  - `notifyNewInvoice(invoice)` - Notify relevant users of new sales
  - `notifyUserCreated(user)` - Notify admins of new user accounts
  - `notifyLargeTransaction(transaction)` - Alert for large financial transactions
- [ ] Integrate triggers into existing CRUD operations:
  - Product updates (low stock alerts)
  - Invoice creation (new sales notifications)
  - Payment processing (financial alerts)
  - User management (account changes)

#### Phase 4: Real-time Updates
- [ ] Implement polling mechanism:
  - Poll `/api/notifications/unread-count` every 30 seconds
  - Update badge count in real-time
- [ ] Optional: WebSocket integration for instant notifications
- [ ] Add notification sound/vibration options

#### Phase 5: Advanced Features
- [ ] Email notifications for critical alerts
- [ ] Notification preferences per user
- [ ] Notification history and archiving
- [ ] Bulk notification management for admins
- [ ] Notification templates for common messages

#### Phase 6: Testing & Polish
- [ ] Test all notification triggers
- [ ] Test real-time updates
- [ ] Test notification dropdown interactions
- [ ] Performance testing with large notification volumes
- [ ] Mobile responsiveness for notifications

### Notification Types & Business Logic

**Inventory Alerts:**
- Low stock warnings when `current_stock <= min_stock_level`
- Out of stock alerts when `current_stock = 0`
- Stock level recovery notifications

**Financial Alerts:**
- Overdue invoice alerts (7 days past due)
- Large transaction alerts (> PKR 100,000)
- Payment received confirmations
- Budget threshold warnings

**Sales & Customer Alerts:**
- New invoice creation notifications
- Customer credit limit exceeded
- High-value order alerts
- Customer account changes

**System & Security Alerts:**
- New user account creation (admin notification)
- Failed login attempts
- Permission changes
- System maintenance notifications

**User-Specific Alerts:**
- Task assignments
- Report generation completion
- Export job status
- Password expiry warnings

### Technical Considerations
- **Performance**: Index on `user_id` and `is_read` for fast queries
- **Scalability**: Implement pagination for notification lists
- **Security**: Ensure users only see their own notifications
- **Storage**: Implement auto-cleanup of old read notifications (90+ days)
- **UI/UX**: Follow existing design patterns, use consistent icons and colors

### Dependencies
- Database migration script
- New API routes in server.js
- Frontend components and state management
- Integration with existing business logic

---

## 🟡 2. Global Search System (Medium Priority)

**Status**: 📋 Planned | **Estimated Time**: 12-16 hours | **Priority**: Medium

**Overview**: Implement a functional global search system that allows users to search across all ERP data from the dashboard header, providing quick access to products, customers, invoices, and other business entities.

### Requirements
- [ ] Search input should accept user queries and provide real-time results
- [ ] Search across multiple entity types (products, customers, suppliers, invoices, users)
- [ ] Display categorized results with quick navigation
- [ ] Debounced search to avoid excessive API calls
- [ ] Highlight search terms in results
- [ ] Keyboard navigation support
- [ ] Mobile-responsive design

### Technical Specifications

**Database Changes**: No schema changes required - uses existing tables and indexes

**API Endpoints**:
- `GET /api/search?q={query}&limit={limit}&offset={offset}` - Main search endpoint
- Returns categorized results with entity type, ID, title, subtitle, and URL

**Frontend Components**:
- Update existing search input in Dashboard.tsx
- Create SearchResultsDropdown component
- Add search state management
- Implement debounced search hook

**Business Logic**:
- Search priority: Products > Customers > Invoices > Suppliers > Users
- Result limit: 50 total results, max 10 per category
- Search fields by entity:
  - Products: prod_code, prod_name, category_name
  - Customers: cust_code, cust_name, city, phone
  - Suppliers: supplier_code, supplier_name, city, phone
  - Invoices: inv_number, cust_name
  - Users: username, full_name

### Implementation Tasks

#### Phase 1: Backend Search API
- [ ] Create search service function with full-text search capabilities
- [ ] Implement search query builder for multiple tables
- [ ] Add search result formatting and categorization
- [ ] Create `/api/search` endpoint with query parameters
- [ ] Add proper error handling and validation
- [ ] Implement search result pagination

#### Phase 2: Frontend Search Logic
- [ ] Create custom useDebounce hook for search input
- [ ] Add search state management (query, results, loading, error)
- [ ] Implement search API integration
- [ ] Add keyboard navigation (arrow keys, enter, escape)
- [ ] Create search results dropdown component

#### Phase 3: Search Results UI
- [ ] Design search results layout with categories
- [ ] Add result item components with icons and metadata
- [ ] Implement search term highlighting
- [ ] Add "View All Results" links for each category
- [ ] Style for different screen sizes

#### Phase 4: Advanced Features
- [ ] Add search history/suggestions
- [ ] Implement search filters (by entity type, date range)
- [ ] Add search analytics (popular searches, no results)
- [ ] Implement search result caching
- [ ] Add voice search capability (future)

#### Phase 5: Performance & Testing
- [ ] Optimize database queries with proper indexing
- [ ] Implement search result caching
- [ ] Add loading states and error handling
- [ ] Test search accuracy and relevance
- [ ] Performance testing with large datasets

### Search Result Categories

**Products**:
- Icon: Package/Box
- Primary: Product Name
- Secondary: Product Code + Category
- URL: `/inventory?highlight={prod_id}`

**Customers**:
- Icon: Users
- Primary: Customer Name
- Secondary: Customer Code + City
- URL: `/partners/customers/{cust_id}`

**Invoices**:
- Icon: FileText/Receipt
- Primary: Invoice Number
- Secondary: Customer Name + Amount
- URL: `/sales/invoices/{inv_id}`

**Suppliers**:
- Icon: Truck
- Primary: Supplier Name
- Secondary: Supplier Code + City
- URL: `/partners/suppliers/{supplier_id}`

**Users**:
- Icon: User
- Primary: Full Name
- Secondary: Username + Role
- URL: `/users/{user_id}` (admin only)

### Technical Considerations
- **Performance**: Use database indexes on searchable fields
- **Relevance**: Implement weighted scoring for search results
- **Security**: Filter results based on user permissions
- **Scalability**: Support pagination and result limits
- **UX**: Fast response time (< 300ms), intuitive navigation

### Dependencies
- Existing database tables and relationships
- User authentication and permissions
- Dashboard layout and routing system

### Testing Criteria
- [ ] Search returns relevant results across all entity types
- [ ] Search is fast and responsive
- [ ] Results are properly categorized and formatted
- [ ] Keyboard navigation works correctly
- [ ] Mobile layout is functional
- [ ] Permission-based filtering works
- [ ] Error states are handled gracefully

---




## Template for New Features

### Feature Name

**Status**: 📋 Planned | **Estimated Time**: X hours | **Priority**: 🔴 High/🟡 Medium/🟢 Low

**Overview**: Brief description of the feature and its purpose.

### Requirements
- [ ] Requirement 1
- [ ] Requirement 2
- [ ] Requirement 3

### Technical Specifications
- **Database Changes**: Any schema modifications needed
- **API Endpoints**: New or modified endpoints
- **Frontend Components**: New components or modifications
- **Business Logic**: Rules and workflows

### Implementation Tasks
- [ ] Task 1
- [ ] Task 2
- [ ] Task 3

### Dependencies
- List any prerequisites or related features

### Testing Criteria
- [ ] Test case 1
- [ ] Test case 2
- [ ] Test case 3

---

## Feature Backlog

Use this section to quickly note new feature ideas before creating detailed plans:

### Quick Ideas
- [ ] Feature idea 1
- [ ] Feature idea 2
- [ ] Feature idea 3

---

## Implementation Guidelines

### Code Standards
- Follow existing TypeScript and React patterns
- Use consistent naming conventions
- Include proper error handling
- Add JSDoc comments for complex functions

### Database Standards
- Use appropriate data types
- Add proper indexes for performance
- Include foreign key constraints
- Document schema changes

### Testing Standards
- Unit tests for business logic
- Integration tests for API endpoints
- E2E tests for critical user flows
- Performance testing for data-heavy operations

### Documentation
- Update this file with implementation details
- Update API documentation
- Add inline code comments
- Update user guides if applicable

---

*Last Updated: November 26, 2025*
*Next Review: Monthly*
*Features Added: Notification System, Global Search System*