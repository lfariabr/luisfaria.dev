import { renderHook } from '@testing-library/react';
import { useIsAdmin, useIsEditorOrAdmin } from '../isAdmin';
import { useAuth } from '../AuthContext';
import { UserRole } from '../../graphql/types/user.types';

// Mock the AuthContext
jest.mock('../AuthContext', () => ({
  useAuth: jest.fn(),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('useIsAdmin Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns true when user role is ADMIN', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'admin@test.com', name: 'Admin', role: UserRole.ADMIN },
      loading: false,
      error: null,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      isAuthenticated: true,
      refetchUser: jest.fn(),
    });

    const { result } = renderHook(() => useIsAdmin());
    expect(result.current).toBe(true);
  });

  it('returns false when user role is USER', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'user@test.com', name: 'User', role: UserRole.USER },
      loading: false,
      error: null,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      isAuthenticated: true,
      refetchUser: jest.fn(),
    });

    const { result } = renderHook(() => useIsAdmin());
    expect(result.current).toBe(false);
  });

  it('returns false when user role is EDITOR', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'editor@test.com', name: 'Editor', role: UserRole.EDITOR },
      loading: false,
      error: null,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      isAuthenticated: true,
      refetchUser: jest.fn(),
    });

    const { result } = renderHook(() => useIsAdmin());
    expect(result.current).toBe(false);
  });

  it('returns false when user is null (not authenticated)', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      error: null,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      isAuthenticated: false,
      refetchUser: jest.fn(),
    });

    const { result } = renderHook(() => useIsAdmin());
    expect(result.current).toBe(false);
  });
});

describe('useIsEditorOrAdmin Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns true when user role is ADMIN', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'admin@test.com', name: 'Admin', role: UserRole.ADMIN },
      loading: false,
      error: null,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      isAuthenticated: true,
      refetchUser: jest.fn(),
    });

    const { result } = renderHook(() => useIsEditorOrAdmin());
    expect(result.current).toBe(true);
  });

  it('returns true when user role is EDITOR', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'editor@test.com', name: 'Editor', role: UserRole.EDITOR },
      loading: false,
      error: null,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      isAuthenticated: true,
      refetchUser: jest.fn(),
    });

    const { result } = renderHook(() => useIsEditorOrAdmin());
    expect(result.current).toBe(true);
  });

  it('returns false when user role is USER', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'user@test.com', name: 'User', role: UserRole.USER },
      loading: false,
      error: null,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      isAuthenticated: true,
      refetchUser: jest.fn(),
    });

    const { result } = renderHook(() => useIsEditorOrAdmin());
    expect(result.current).toBe(false);
  });

  it('returns false when user is null', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      error: null,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      isAuthenticated: false,
      refetchUser: jest.fn(),
    });

    const { result } = renderHook(() => useIsEditorOrAdmin());
    expect(result.current).toBe(false);
  });
});
