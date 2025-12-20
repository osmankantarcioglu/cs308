const { 
    requireAdmin, 
    requireAdminOrProductManager,
    requireAdminOrSalesManager,
    requireSupportAgent,
    requireAdminOrSupportAgent,
    requireRole
} = require('../lib/middleware');
const { ForbiddenError } = require('../lib/Error');
const Enum = require('../config/Enum');

describe('Middleware Functions', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            user: null
        };
        res = {};
        next = jest.fn();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // Test 23: requireAdmin should call next if user is admin
    test('requireAdmin should call next if user is admin', () => {
        req.user = { role: Enum.USER_ROLES.ADMIN };
        
        requireAdmin(req, res, next);
        
        expect(next).toHaveBeenCalledWith();
    });

    // Test 24: requireAdmin should throw ForbiddenError if user is not admin
    test('requireAdmin should throw ForbiddenError if user is not admin', () => {
        req.user = { role: Enum.USER_ROLES.CUSTOMER };
        
        requireAdmin(req, res, next);
        
        expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });

    // Test 25: requireAdminOrProductManager should allow admin
    test('requireAdminOrProductManager should allow admin', () => {
        req.user = { role: Enum.USER_ROLES.ADMIN };
        
        requireAdminOrProductManager(req, res, next);
        
        expect(next).toHaveBeenCalledWith();
    });

    // Test 47: requireAdminOrProductManager should allow product manager
    test('requireAdminOrProductManager should allow product manager', () => {
        req.user = { role: Enum.USER_ROLES.PRODUCT_MANAGER };
        
        requireAdminOrProductManager(req, res, next);
        
        expect(next).toHaveBeenCalledWith();
    });

    // Test 48: requireAdminOrProductManager should reject customer
    test('requireAdminOrProductManager should reject customer role', () => {
        req.user = { role: Enum.USER_ROLES.CUSTOMER };
        
        requireAdminOrProductManager(req, res, next);
        
        expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });

    // Test 49: requireAdminOrSalesManager should allow sales manager
    test('requireAdminOrSalesManager should allow sales manager', () => {
        req.user = { role: Enum.USER_ROLES.SALES_MANAGER };
        
        requireAdminOrSalesManager(req, res, next);
        
        expect(next).toHaveBeenCalledWith();
    });

    // Test 50: requireRole should reject when user has no role
    test('requireRole should reject when user is null', () => {
        req.user = null;
        const middleware = requireRole(Enum.USER_ROLES.ADMIN);
        
        middleware(req, res, next);
        
        expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
        expect(next.mock.calls[0][0].message).toContain('Authentication required');
    });
});
