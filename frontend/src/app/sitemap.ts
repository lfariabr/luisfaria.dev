import { MetadataRoute } from 'next';
import { fetchGql } from '@/lib/graphql/fetchGql';
import {
  PUBLISHED_ARTICLES_QUERY,
  PROJECTS_QUERY,
} from '@/lib/graphql/queries/server.queries';
import type { Article } from '@/lib/graphql/types/article.types';
import type { Project } from '@/lib/graphql/types/project.types';

const BASE_URL = 'https://luisfaria.dev';
const STATIC_LAST_MODIFIED = new Date('2026-03-03T00:00:00.000Z');

function safeDate(value: string): Date {
  const d = new Date(value);
  return isNaN(d.getTime()) ? new Date() : d;
}

const staticRoutes: MetadataRoute.Sitemap = [
  { url: BASE_URL, lastModified: STATIC_LAST_MODIFIED, changeFrequency: 'daily', priority: 1 },
  {
    url: `${BASE_URL}/work`,
    lastModified: STATIC_LAST_MODIFIED,
    changeFrequency: 'weekly',
    priority: 0.9,
  },
  {
    url: `${BASE_URL}/about`,
    lastModified: STATIC_LAST_MODIFIED,
    changeFrequency: 'monthly',
    priority: 0.8,
  },
  {
    url: `${BASE_URL}/projects`,
    lastModified: STATIC_LAST_MODIFIED,
    changeFrequency: 'weekly',
    priority: 0.8,
  },
  {
    url: `${BASE_URL}/articles`,
    lastModified: STATIC_LAST_MODIFIED,
    changeFrequency: 'weekly',
    priority: 0.8,
  },
  {
    url: `${BASE_URL}/chatbot`,
    lastModified: STATIC_LAST_MODIFIED,
    changeFrequency: 'monthly',
    priority: 0.6,
  },
  {
    url: `${BASE_URL}/privacy`,
    lastModified: STATIC_LAST_MODIFIED,
    changeFrequency: 'yearly',
    priority: 0.3,
  },
  {
    url: `${BASE_URL}/terms`,
    lastModified: STATIC_LAST_MODIFIED,
    changeFrequency: 'yearly',
    priority: 0.3,
  },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let articleRoutes: MetadataRoute.Sitemap = [];
  let projectRoutes: MetadataRoute.Sitemap = [];

  try {
    const [articlesData, projectsData] = await Promise.all([
      fetchGql<{ publishedArticles: Article[] }>(PUBLISHED_ARTICLES_QUERY, {
        revalidate: 3600,
      }),
      fetchGql<{ projects: Project[] }>(PROJECTS_QUERY, {
        revalidate: 3600,
      }),
    ]);

    articleRoutes = (articlesData.publishedArticles ?? []).map((article) => ({
      url: `${BASE_URL}/articles/${article.slug}`,
      lastModified: safeDate(article.updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

    projectRoutes = (projectsData.projects ?? []).map((project) => ({
      url: `${BASE_URL}/projects/${project.slug}`,
      lastModified: safeDate(project.updatedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }));
  } catch {
    // Graceful fallback — return static routes only if GraphQL is unavailable
  }

  return [...staticRoutes, ...articleRoutes, ...projectRoutes];
}
