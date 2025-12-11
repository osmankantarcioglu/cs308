# Unit Tests

This directory contains unit tests for the backend API.

## Test Files

1. **Error.test.js** - 7 tests for Error classes (Tests 1-7)
   - Tests for CustomError, NotFoundError, ValidationError, UnauthorizedError, and ForbiddenError
   - Verifies proper error creation with status codes and default messages

2. **Product.model.test.js** - 3 tests for Product model (Tests 8-10)
   - Tests for `calculatePopularityScore` static method
   - Verifies popularity score calculation based on view count and product age

3. **Review.model.test.js** - 6 tests for Review model (Tests 11-16)
   - Tests for static methods: `findByProduct`, `findPending`, `approveComment`, `rejectComment`, `getAverageRating`, and `canUserReview`
   - Verifies review querying, approval/rejection logic, and rating calculations

4. **User.model.test.js** - 2 tests for User model (Tests 17-18)
   - Tests for `findByEmail` and `findByTaxID` static methods
   - Verifies user lookup functionality with proper email normalization

5. **auth.test.js** - 4 tests for Authentication utilities (Tests 19-22)
   - Tests for `generateToken` and `authenticate` middleware
   - Verifies JWT token generation and authentication error handling

6. **middleware.test.js** - 3 tests for Middleware functions (Tests 23-25)
   - Tests for `requireAdmin` and `requireAdminOrProductManager` middleware
   - Verifies role-based access control

**Total: 28 unit tests** (7 test suites)

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (reruns on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Structure

Each test file:
- Uses Jest testing framework
- Isolates dependencies using mocks
- Provides clean test environment with `beforeEach` and `afterEach` hooks
- Follows consistent naming and structure conventions

## Test Results

When all tests pass, you should see:
```
Test Suites: 7 passed, 7 total
Tests:       28 passed, 28 total
Snapshots:   0 total
```

## Notes

- Product model tests focus on the `calculatePopularityScore` method which doesn't require mongoose mocking
- Review and User model tests mock mongoose query methods to isolate static method behavior
- Auth tests use mocked JWT and User model dependencies
- All tests use Jest's mocking capabilities to ensure isolation and fast execution

## Writing New Tests

When adding new tests:
1. Place test files in the `__tests__` directory
2. Follow the naming convention: `*.test.js`
3. Use descriptive test names that explain what is being tested
4. Mock external dependencies to ensure test isolation
5. Use `beforeEach` and `afterEach` to set up and clean up test state
6. Update this README with new test file information
