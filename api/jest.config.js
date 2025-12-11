module.exports = {
    testEnvironment: 'node',
    testMatch: ['**/__tests__/**/*.test.js'],
    collectCoverageFrom: [
        'routes/**/*.js',
        'lib/**/*.js',
        'db/models/**/*.js',
        'services/**/*.js',
        '!**/node_modules/**',
        '!**/coverage/**'
    ],
    coverageDirectory: 'coverage',
    verbose: true,
    clearMocks: true,
    resetMocks: true,
    restoreMocks: true
};

