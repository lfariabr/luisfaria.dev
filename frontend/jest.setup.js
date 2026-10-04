// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
require('@testing-library/jest-dom');

// Mock window.matchMedia - required for next-themes
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Polyfill ResizeObserver used by Radix UI
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
if (typeof window.ResizeObserver === 'undefined') {
  window.ResizeObserver = ResizeObserverMock;
  global.ResizeObserver = ResizeObserverMock;
}

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
    events: {
      on: jest.fn(),
      off: jest.fn(),
    },
  }),
}));

// Mock Next.js Image component
jest.mock('next/image', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: function Image(props) {
      const { loader, loading, placeholder, blurDataURL, fill, ...rest } = props || {};
      // Create img element without JSX
      return React.createElement('img', {
        ...rest,
      });
    },
  };
});

// Suppress console errors during tests (ignore known benign warnings)
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    const msg = String(args[0] || '');
    if (
      /ReactDOM.render is no longer supported/.test(msg) ||
      /useLayoutEffect does nothing on the server/.test(msg) ||
      /`ReactDOMTestUtils.act` is deprecated/.test(msg) ||
      /Received `true` for a non-boolean attribute `fill`/.test(msg) ||
      /does not recognize the `blurDataURL` prop/.test(msg) ||
      /validateDOMNesting/.test(msg) ||
      /cannot be a descendant of/.test(msg)
    ) {
      return;
    }
    originalConsoleError(...args);
  };
});

afterAll(() => {
  console.error = originalConsoleError;
});
