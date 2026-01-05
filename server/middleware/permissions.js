/**
 * Permission Enforcement Middleware
 *
 * Provides backend permission enforcement to prevent unauthorized access.
 * This is a CRITICAL security layer - frontend permission checks alone are not sufficient.
 *
 * Usage:
 * import { requirePermission, requireAdmin } from '../middleware/permissions.js';
 *
 * app.get('/api/products', requirePermission('INVENTORY_VIEW'), async (req, res) => {
 *     // ... route handler
 * });
 */

/**
 * Require one or more permissions
 * User must have at least ONE of the specified permissions
 * Admins automatically pass all permission checks
 *
 * @param {...string} permissions - One or more permission IDs
 * @returns {Function} Express middleware function
 */
export const requirePermission = (...permissions) => {
    return (req, res, next) => {
        const user = req.user;

        console.log('[DEBUG PERMISSIONS] Checking permissions. Required:', permissions);
        console.log('[DEBUG PERMISSIONS] User:', user ? `${user.username} (${user.role})` : 'null');

        // Must be authenticated
        if (!user) {
            console.log('[DEBUG PERMISSIONS] No user found - returning 401');
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Authentication required'
            });
        }

        // Admins bypass all permission checks
        if (user.role === 'ADMIN') {
            console.log('[DEBUG PERMISSIONS] User is ADMIN - bypassing permission check');
            return next();
        }

        // Check if user has any of the required permissions
        const userPermissions = user.permissions || [];
        console.log('[DEBUG PERMISSIONS] User permissions:', userPermissions);

        const hasPermission = permissions.some(perm =>
            userPermissions.includes(perm)
        );
        console.log('[DEBUG PERMISSIONS] Has required permission:', hasPermission);

        if (!hasPermission) {
            console.log('[DEBUG PERMISSIONS] Permission denied - returning 403');
            return res.status(403).json({
                error: 'Forbidden',
                message: 'Insufficient permissions',
                required: permissions,
                userHas: userPermissions
            });
        }

        console.log('[DEBUG PERMISSIONS] Permission check passed');
        next();
    };
};

/**
 * Require ALL specified permissions
 * User must have ALL of the specified permissions
 *
 * @param {...string} permissions - One or more permission IDs (all required)
 * @returns {Function} Express middleware function
 */
export const requireAllPermissions = (...permissions) => {
    return (req, res, next) => {
        const user = req.user;

        if (!user) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Authentication required'
            });
        }

        // Admins bypass all permission checks
        if (user.role === 'ADMIN') {
            return next();
        }

        // Check if user has ALL of the required permissions
        const userPermissions = user.permissions || [];
        const hasAllPermissions = permissions.every(perm =>
            userPermissions.includes(perm)
        );

        if (!hasAllPermissions) {
            const missingPermissions = permissions.filter(perm =>
                !userPermissions.includes(perm)
            );

            return res.status(403).json({
                error: 'Forbidden',
                message: 'Insufficient permissions - all required permissions must be granted',
                required: permissions,
                missing: missingPermissions,
                userHas: userPermissions
            });
        }

        next();
    };
};

/**
 * Require admin role
 * Only users with ADMIN role can access
 *
 * @returns {Function} Express middleware function
 */
export const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'ADMIN') {
        return res.status(403).json({
            error: 'Forbidden',
            message: 'Admin access required'
        });
    }
    next();
};

/**
 * Require ownership or admin
 * User must either own the resource or be an admin
 *
 * @param {Function} getUserIdFromRequest - Function to extract resource owner ID from request
 * @returns {Function} Express middleware function
 *
 * @example
 * app.get('/api/users/:id', requireOwnerOrAdmin((req) => parseInt(req.params.id)), handler);
 */
export const requireOwnerOrAdmin = (getUserIdFromRequest) => {
    return (req, res, next) => {
        const user = req.user;

        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Admins can access any resource
        if (user.role === 'ADMIN') {
            return next();
        }

        // Check if user owns the resource
        const resourceUserId = getUserIdFromRequest(req);
        if (user.id === resourceUserId) {
            return next();
        }

        return res.status(403).json({
            error: 'Forbidden',
            message: 'Can only access your own resources'
        });
    };
};

/**
 * Optional permission check
 * If user is authenticated and has permission, adds flag to request
 * Does NOT block access if permission is missing
 *
 * @param {string} permission - Permission ID to check
 * @param {string} flagName - Name of flag to set on req object (default: 'hasPermission')
 * @returns {Function} Express middleware function
 *
 * @example
 * app.get('/api/products', optionalPermission('INVENTORY_MANAGE', 'canManage'), (req, res) => {
 *     if (req.canManage) {
 *         // Show management UI
 *     }
 * });
 */
export const optionalPermission = (permission, flagName = 'hasPermission') => {
    return (req, res, next) => {
        const user = req.user;

        if (user && (user.role === 'ADMIN' || user.permissions?.includes(permission))) {
            req[flagName] = true;
        } else {
            req[flagName] = false;
        }

        next();
    };
};

/**
 * Permission constants for reference
 * These match the permissions defined in Users.tsx
 */
export const PERMISSIONS = {
    // Inventory
    INVENTORY_VIEW: 'INVENTORY_VIEW',
    INVENTORY_MANAGE: 'INVENTORY_MANAGE',

    // Sales
    SALES_VIEW: 'SALES_VIEW',
    SALES_MANAGE: 'SALES_MANAGE',
    SALES_RETURNS_VIEW: 'SALES_RETURNS_VIEW',
    SALES_RETURNS_MANAGE: 'SALES_RETURNS_MANAGE',

    // Purchases
    PURCHASE_VIEW: 'PURCHASE_VIEW',
    PURCHASE_MANAGE: 'PURCHASE_MANAGE',

    // Finance
    FINANCE_VIEW: 'FINANCE_VIEW',
    FINANCE_MANAGE: 'FINANCE_MANAGE',
    FINANCE_VOUCHER: 'FINANCE_VOUCHER',
    FINANCE_CONFIG: 'FINANCE_CONFIG',

    // Partners
    PARTNERS_VIEW: 'PARTNERS_VIEW',
    PARTNERS_MANAGE: 'PARTNERS_MANAGE',

    // Reports
    REPORTS_VIEW: 'REPORTS_VIEW',
    REPORTS_EXPORT: 'REPORTS_EXPORT',

    // Admin
    USERS_VIEW: 'USERS_VIEW',
    USERS_MANAGE: 'USERS_MANAGE',
    COMPANIES_VIEW: 'COMPANIES_VIEW',
    COMPANIES_MANAGE: 'COMPANIES_MANAGE',
    SYSTEM_BACKUP: 'SYSTEM_BACKUP',

    // Marketing
    MARKETING_VIEW: 'MARKETING_VIEW',
    MARKETING_MANAGE: 'MARKETING_MANAGE'
};
