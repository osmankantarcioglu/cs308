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
        if (!req.user) {
            return next(new ForbiddenError('Authentication required'));
        }

        if (!allowedRoles.includes(req.user.role)) {
            return next(new ForbiddenError('Insufficient permissions'));
        }

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

module.exports = {
    requireRole,
    requireAdmin,
    requireAdminOrProductManager,
    requireAdminOrSalesManager,
    requireSupportAgent,
    requireAdminOrSupportAgent
};

