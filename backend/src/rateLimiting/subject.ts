import type { SubjectKind } from './rateLimits';

export const UNKNOWN_SUBJECT_ID = 'unknown';

export interface Subject<K extends SubjectKind = SubjectKind> {
  kind: K;
  id: string;
}

const make = <K extends SubjectKind>(kind: K, id: string | null | undefined): Subject<K> => ({
  kind,
  id: (id == null ? '' : String(id)).trim() || UNKNOWN_SUBJECT_ID,
});

export const Subject = {
  user: (id: string | null | undefined) => make('user', id),
  email: (email: string | null | undefined) => make('email', email?.trim().toLowerCase()),
  ip: (ip: string | null | undefined) => make('ip', ip),
};
