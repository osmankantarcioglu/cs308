const {
    CustomError,
    NotFoundError,
    ValidationError,
    UnauthorizedError,
    ForbiddenError
} = require('../lib/Error');

describe('Error Classes', () => {
    // Test 1: CustomError should create error with statusCode
    test('CustomError should create error with message and statusCode', () => {
        const error = new CustomError('Test error', 500);
        expect(error.message).toBe('Test error');
        expect(error.statusCode).toBe(500);
        expect(error.isOperational).toBe(true);
        expect(error).toBeInstanceOf(Error);
    });

    // Test 2: NotFoundError should have 404 status code
    test('NotFoundError should have 404 status code', () => {
        const error = new NotFoundError('Resource not found');
        expect(error.message).toBe('Resource not found');
        expect(error.statusCode).toBe(404);
        expect(error).toBeInstanceOf(CustomError);
        expect(error).toBeInstanceOf(Error);
    });

    // Test 3: NotFoundError should use default message
    test('NotFoundError should use default message when not provided', () => {
        const error = new NotFoundError();
        expect(error.message).toBe('Resource not found');
        expect(error.statusCode).toBe(404);
    });

    // Test 4: ValidationError should have 400 status code
    test('ValidationError should have 400 status code', () => {
        const error = new ValidationError('Invalid input');
        expect(error.message).toBe('Invalid input');
        expect(error.statusCode).toBe(400);
        expect(error).toBeInstanceOf(CustomError);
    });

    // Test 5: UnauthorizedError should have 401 status code
    test('UnauthorizedError should have 401 status code', () => {
        const error = new UnauthorizedError('Unauthorized access');
        expect(error.message).toBe('Unauthorized access');
        expect(error.statusCode).toBe(401);
        expect(error).toBeInstanceOf(CustomError);
    });

    // Test 6: ForbiddenError should have 403 status code
    test('ForbiddenError should have 403 status code', () => {
        const error = new ForbiddenError('Access forbidden');
        expect(error.message).toBe('Access forbidden');
        expect(error.statusCode).toBe(403);
        expect(error).toBeInstanceOf(CustomError);
    });

    // Test 7: ValidationError should use default message
    test('ValidationError should use default message when not provided', () => {
        const error = new ValidationError();
        expect(error.message).toBe('Validation error');
        expect(error.statusCode).toBe(400);
    });
});

