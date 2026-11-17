/**
 * Serializes a stored date for a GraphQL `String` field.
 *
 * Without a field resolver, GraphQL coerces a Mongoose `Date` to an
 * epoch-milliseconds string ("1728600000000"), which `Date.parse`,
 * search engines and JSON-LD can't read. Every date field returns ISO 8601.
 */
export const toIsoString = (value: unknown): string | null => {
  if (value === null || value === undefined) return null;

  let date: Date;
  if (value instanceof Date) {
    date = value;
  } else if (typeof value === 'number' || (typeof value === 'string' && /^\d+$/.test(value))) {
    date = new Date(Number(value));
  } else if (typeof value === 'string') {
    date = new Date(value);
  } else {
    return null;
  }

  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

/** Field resolver for a date field: `createdAt: isoDate('createdAt')`. */
export const isoDate =
  <K extends string>(field: K) =>
  (parent: Partial<Record<K, unknown>>): string | null =>
    toIsoString(parent[field]);
