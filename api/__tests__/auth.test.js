const jwt = require('jsonwebtoken');
const { generateToken, authenticate } = require('../lib/auth');
const Users = require('../db/models/Users');
const { UnauthorizedError } = require('../lib/Error');

// Mock dependencies
jest.mock('jsonwebtoken');
jest.mock('../db/models/Users');
jest.mock('../config', () => ({
    JWT: {
        SECRET: 'test-secret-key'
    },
    TOKEN_EXPIRE_TIME: 60
}));

describe('Auth Utilities', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // Test 19: generateToken should create a valid JWT token
    test('generateToken should create a valid JWT token', () => {
        const userId = '123456789012345678901234';
        const mockToken = 'mock-jwt-token';
        
        jwt.sign.mockReturnValue(mockToken);

        const token = generateToken(userId);

        expect(jwt.sign).toHaveBeenCalledWith(
            expect.objectContaining({
                userId: userId,
                iat: expect.any(Number)
            }),
            'test-secret-key',
            { expiresIn: 3600 }
        );
        expect(token).toBe(mockToken);
    });

    // Test 20: authenticate should throw error if no token provided
    test('authenticate should throw UnauthorizedError if no Authorization header', async () => {
        const req = {
            headers: {}
        };
        const res = {};
        const next = jest.fn();

        await authenticate(req, res, next);

        expect(next).toHaveBeenCalledWith(
            expect.any(UnauthorizedError)
        );
    });

    // Test 21: authenticate should throw error if token format is invalid
    test('authenticate should throw error if Bearer token format is invalid', async () => {
        const req = {
            headers: {
                authorization: 'InvalidFormat token123'
            }
        };
        const res = {};
        const next = jest.fn();

        await authenticate(req, res, next);

        expect(next).toHaveBeenCalledWith(
            expect.any(UnauthorizedError)
        );
    });

    // Test 22: authenticate should throw error if token is expired
    test('authenticate should throw error if token is expired', async () => {
        const req = {
            headers: {
                authorization: 'Bearer expired-token'
            }
        };
        const res = {};
        const next = jest.fn();

        jwt.verify.mockImplementation(() => {
            const error = new Error('Token expired');
            error.name = 'TokenExpiredError';
            throw error;
        });

        await authenticate(req, res, next);

        expect(next).toHaveBeenCalledWith(
            expect.any(UnauthorizedError)
        );
        expect(next.mock.calls[0][0].message).toContain('expired');
    });
});

