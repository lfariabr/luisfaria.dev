'use client';

import { useAuth } from './AuthContext';

/**
 * Hook to check if the current user has admin role.
 * Uses AuthContext which gets user data from server via httpOnly cookie.
 * @returns Boolean indicating if user is admin
 */
export function useIsAdmin(): boolean {
  const { user } = useAuth();
  return user?.role === 'ADMIN';
}

/**
 * Hook to check if the current user has editor or admin role.
 * @returns Boolean indicating if user is editor or admin
 */
export function useIsEditorOrAdmin(): boolean {
  const { user } = useAuth();
  return user?.role === 'ADMIN' || user?.role === 'EDITOR';
}

/**
 * Hook to check if the current user can view the private relationship map.
 */
export function useCanViewRelationshipPins(): boolean {
  const { user } = useAuth();
  return user?.role === 'ADMIN' || user?.role === 'PARTNER';
}
