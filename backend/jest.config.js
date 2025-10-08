export default {
    testEnvironment: 'node',
    testMatch: ['**/tests/**/*.spec.js'],
    collectCoverageFrom: [
        'controllers/**/*.js',
        'services/**/*.js',
        'models/**/*.js',
        'routes/**/*.js',
        'server.js',
        '!**/node_modules/**'
    ],
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
    testTimeout: 30000,
    verbose: true,
};
