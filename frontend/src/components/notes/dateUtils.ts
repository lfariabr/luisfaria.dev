import { format, getISOWeek, isDate, isValid, parseISO } from 'date-fns';

export const toSafeDate = (value: unknown): Date | null => {
  if (!value) return null;
  if (typeof value === 'number') {
    const timestampDate = new Date(value);
    return isValid(timestampDate) ? timestampDate : null;
  }

  if (isDate(value)) {
    return isValid(value) ? value : null;
  }

  if (typeof value !== 'string') return null;

  const parsed = parseISO(value);
  if (isValid(parsed)) return parsed;

  const fallback = new Date(value);
  return isValid(fallback) ? fallback : null;
};

export const formatSafeDate = (
  value: string | Date | null | undefined,
  pattern: string,
  fallback = 'Unknown date'
) => {
  const parsed = toSafeDate(value);
  return parsed ? format(parsed, pattern) : fallback;
};

export const toDateInputValue = (value: string | Date | null | undefined) => {
  const parsed = toSafeDate(value) ?? new Date();
  return format(parsed, 'yyyy-MM-dd');
};

export const getNoteMonthKey = (value: string | Date | null | undefined) => {
  const parsed = toSafeDate(value);
  return parsed ? format(parsed, 'yyyy-MM') : 'unknown';
};

export const getNoteWeekKey = (value: string | Date | null | undefined) => {
  const parsed = toSafeDate(value);
  if (!parsed) return 'unknown';
  return `${parsed.getUTCFullYear()}-W${String(getISOWeek(parsed)).padStart(2, '0')}`;
};
