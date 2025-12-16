import { renderHook } from '@testing-library/react';
import { useIsAdmin, useIsEditorOrAdmin } from '../isAdmin';
import { useAuth, User } from '../AuthContext';
import { UserRole } from '../../graphql/types/user.types';

// Mock the AuthContext
jest.mock('../AuthContext', () => ({
  useAuth: jest.fn(),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Helper to reduce duplication - creates a mock auth context with sensible defaults
function createMockAuthContext(user: User | null) {
  return {
    user,
    loading: false,
    error: null,
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    isAuthenticated: user !== null,
    refetchUser: jest.fn(),
  };
}

describe('useIsAdmin Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns true when user role is ADMIN', () => {
    mockUseAuth.mockReturnValue(
      createMockAuthContext({ id: '1', email: 'admin@test.com', name: 'Admin', role: UserRole.ADMIN })
    );

    const { result } = renderHook(() => useIsAdmin());
    expect(result.current).toBe(true);
  });

  it('returns false when user role is USER', () => {
    mockUseAuth.mockReturnValue(
      createMockAuthContext({ id: '1', email: 'user@test.com', name: 'User', role: UserRole.USER })
    );

    const { result } = renderHook(() => useIsAdmin());
    expect(result.current).toBe(false);
  });

  it('returns false when user role is EDITOR', () => {
    mockUseAuth.mockReturnValue(
      createMockAuthContext({ id: '1', email: 'editor@test.com', name: 'Editor', role: UserRole.EDITOR })
    );

    const { result } = renderHook(() => useIsAdmin());
    expect(result.current).toBe(false);
  });

  it('returns false when user is null (not authenticated)', () => {
    mockUseAuth.mockReturnValue(createMockAuthContext(null));

    const { result } = renderHook(() => useIsAdmin());
    expect(result.current).toBe(false);
  });
});

describe('useIsEditorOrAdmin Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns true when user role is ADMIN', () => {
    mockUseAuth.mockReturnValue(
      createMockAuthContext({ id: '1', email: 'admin@test.com', name: 'Admin', role: UserRole.ADMIN })
    );

    const { result } = renderHook(() => useIsEditorOrAdmin());
    expect(result.current).toBe(true);
  });

  it('returns true when user role is EDITOR', () => {
    mockUseAuth.mockReturnValue(
      createMockAuthContext({ id: '1', email: 'editor@test.com', name: 'Editor', role: UserRole.EDITOR })
    );

    const { result } = renderHook(() => useIsEditorOrAdmin());
    expect(result.current).toBe(true);
  });

  it('returns false when user role is USER', () => {
    mockUseAuth.mockReturnValue(
      createMockAuthContext({ id: '1', email: 'user@test.com', name: 'User', role: UserRole.USER })
    );

    const { result } = renderHook(() => useIsEditorOrAdmin());
    expect(result.current).toBe(false);
  });

  it('returns false when user is null', () => {
    mockUseAuth.mockReturnValue(createMockAuthContext(null));

    const { result } = renderHook(() => useIsEditorOrAdmin());
    expect(result.current).toBe(false);
  });
});
