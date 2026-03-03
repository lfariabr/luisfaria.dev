import { cache } from 'react';

const RAW_GRAPHQL_URL =
  process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:4000/graphql';
const SITE_ORIGIN = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

function resolveGraphqlUrl(rawUrl: string): string {
  if (/^https?:\/\//i.test(rawUrl)) return rawUrl;
  if (rawUrl.startsWith('/')) return new URL(rawUrl, SITE_ORIGIN).toString();
  return `http://${rawUrl}`;
}

const GRAPHQL_URL = resolveGraphqlUrl(RAW_GRAPHQL_URL);

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
