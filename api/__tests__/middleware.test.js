const { requireAdmin, requireAdminOrProductManager } = require('../lib/middleware');
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
});
