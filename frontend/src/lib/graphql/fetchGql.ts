import { cache } from 'react';

const GRAPHQL_URL =
  process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:4000/graphql';

interface FetchGqlOptions {
  variables?: Record<string, unknown>;
  revalidate?: number;
}

async function _fetchGql<T>(
  query: string,
  { variables, revalidate = 3600 }: FetchGqlOptions = {},
): Promise<T> {
  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
    next: { revalidate },
  });

  if (!res.ok) {
    throw new Error(`GraphQL fetch failed: ${res.status}`);
  }

  const json = await res.json();

  if (json.errors?.length) {
    throw new Error(json.errors[0].message);
  }

  return json.data as T;
}

export const fetchGql = cache(_fetchGql);
