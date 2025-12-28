const Enum = require('../config/Enum');
const { ForbiddenError } = require('./Error');

/**
 * Role-based access control middleware
 * @param {...string} allowedRoles - Roles that are allowed to access the route
 * @example requireRole(Enum.USER_ROLES.ADMIN)
 * @example requireRole(Enum.USER_ROLES.ADMIN, Enum.USER_ROLES.PRODUCT_MANAGER)
 */
const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        // Force log to console immediately
        console.error('[Middleware] ===== ROLE CHECK START =====');
        console.error('[Middleware] User exists:', !!req.user);
        
        if (!req.user) {
            console.error('[Middleware] No user found in request');
            return next(new ForbiddenError('Authentication required'));
        }

        console.error(`[Middleware] User email: ${req.user.email || 'N/A'}`);
        console.error(`[Middleware] User role: "${req.user.role}" (type: ${typeof req.user.role})`);
        console.error(`[Middleware] Allowed roles: [${allowedRoles.map(r => `"${r}"`).join(', ')}]`);
        console.error(`[Middleware] Role match check: ${allowedRoles.includes(req.user.role)}`);

        if (!allowedRoles.includes(req.user.role)) {
            console.error(`[Middleware] ❌ ACCESS DENIED - User role "${req.user.role}" not in allowed roles`);
            return next(new ForbiddenError('Insufficient permissions'));
        }

        console.error(`[Middleware] ✅ ACCESS GRANTED for role: ${req.user.role}`);
        console.error('[Middleware] ===== ROLE CHECK END =====');
        next();
    };
};

/**
 * Middleware to require admin role
 */
const requireAdmin = requireRole(Enum.USER_ROLES.ADMIN);

/**
 * Middleware to require admin or product manager role
 */
const requireAdminOrProductManager = requireRole(
    Enum.USER_ROLES.ADMIN,
    Enum.USER_ROLES.PRODUCT_MANAGER
);

/**
 * Middleware to require admin or sales manager role
 */
const requireAdminOrSalesManager = requireRole(
    Enum.USER_ROLES.ADMIN,
    Enum.USER_ROLES.SALES_MANAGER
);

/**
 * Middleware to require support agent role
 */
const requireSupportAgent = requireRole(Enum.USER_ROLES.SUPPORT_AGENT);

/**
 * Middleware to require admin or support agent role
 */
const requireAdminOrSupportAgent = requireRole(
    Enum.USER_ROLES.ADMIN,
    Enum.USER_ROLES.SUPPORT_AGENT
);

/**
 * Middleware to require admin, product manager, or sales manager role
 */
const requireAdminOrProductManagerOrSalesManager = requireRole(
    Enum.USER_ROLES.ADMIN,
    Enum.USER_ROLES.PRODUCT_MANAGER,
    Enum.USER_ROLES.SALES_MANAGER
);

module.exports = {
    requireRole,
    requireAdmin,
    requireAdminOrProductManager,
    requireAdminOrSalesManager,
    requireSupportAgent,
    requireAdminOrSupportAgent,
    requireAdminOrProductManagerOrSalesManager
};

