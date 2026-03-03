// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.RATE_LIMIT_WINDOW = '3600';
process.env.RATE_LIMIT_MAX_REQUESTS = '10';
process.env.RATE_LIMIT_ANONYMOUS_REQUESTS = '5';

// Suppress console output during tests
global.console = {
  ...console,
  log: jest.fn(),
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

// Add a dummy test to avoid "no tests" error
describe('Setup', () => {
  it('should have proper test environment variables', () => {
    expect(process.env.NODE_ENV).toBe('test');
  });
});
