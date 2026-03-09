/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
  
    // Only look for tests in the tests/ folder
    roots: ['<rootDir>/tests'],
    testMatch: ['**/*.test.ts'],
  
    // Map src imports so ts-jest can resolve them
    moduleNameMapper: {
      '^../src/(.*)$': '<rootDir>/src/$1',
    },
  
    // Show individual test names in output
    verbose: true,
  
    // Clear mocks automatically between tests
    clearMocks: true,
  
    // Optional: collect coverage from src modules only
    collectCoverageFrom: [
      'src/**/*.js',
      '!src/server.js',   // entry point, skip
    ],
  };