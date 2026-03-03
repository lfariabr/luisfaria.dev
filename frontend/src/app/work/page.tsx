import { MainLayout } from '@/components/layouts/MainLayout';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { WorkTabsContent } from '@/components/work/WorkTabsContent';
import { fetchGql } from '@/lib/graphql/fetchGql';
import {
  PUBLISHED_ARTICLES_QUERY,
  PROJECTS_QUERY,
} from '@/lib/graphql/queries/server.queries';
import type { Article } from '@/lib/graphql/types/article.types';
import type { Project } from '@/lib/graphql/types/project.types';
import { sanitizeJsonLd } from '@/lib/seo/metadata';

export const dynamic = 'force-dynamic';

export default async function WorkPage() {
  let projects: Project[] = [];
  let articles: Article[] = [];
  let projectsError: string | null = null;
  let articlesError: string | null = null;

  try {
    const data = await fetchGql<{ projects: Project[] }>(PROJECTS_QUERY, {
      revalidate: 3600,
    });
    projects = data.projects ?? [];
  } catch (error) {
    console.error('Failed to fetch work page projects data', error);
    projectsError = 'An unexpected error occurred. Please try again later.';
  }

  try {
    const data = await fetchGql<{ publishedArticles: Article[] }>(PUBLISHED_ARTICLES_QUERY, {
      revalidate: 3600,
    });
    articles = data.publishedArticles ?? [];
  } catch (error) {
    console.error('Failed to fetch work page articles data', error);
    articlesError = 'An unexpected error occurred. Please try again later.';
  }

  const itemListLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Work | Luis Faria',
    url: 'https://luisfaria.dev/work',
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: [
        ...projects.map((project) => ({ type: 'project' as const, data: project })),
        ...articles.map((article) => ({ type: 'article' as const, data: article })),
      ].map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url:
          item.type === 'project'
            ? `https://luisfaria.dev/projects/${item.data.slug}`
            : `https://luisfaria.dev/articles/${item.data.slug}`,
        name: item.data.title,
      })),
    },
  };

  return (
    <MainLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: sanitizeJsonLd(itemListLd) }}
      />
      <div className="container py-12 max-w-6xl">
        <div className="space-y-2 mb-8 px-4">
          <h1 className="text-3xl font-bold tracking-tight">Work</h1>
          <p className="text-muted-foreground">Featured projects and writing.</p>
        </div>

        {projectsError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{projectsError}</AlertDescription>
          </Alert>
        )}

        {articlesError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{articlesError}</AlertDescription>
          </Alert>
        )}

        <WorkTabsContent projects={projects} articles={articles} />
      </div>
    </MainLayout>
  );
}
