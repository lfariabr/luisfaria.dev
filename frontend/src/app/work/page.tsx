import { MainLayout } from '@/components/layouts/MainLayout';
import { AlertCircle, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ProjectCard } from '@/components/work/ProjectCard';
import { ArticleCard } from '@/components/work/ArticleCard';
import { fetchGql } from '@/lib/graphql/fetchGql';
import {
  PUBLISHED_ARTICLES_QUERY,
  PROJECTS_QUERY,
} from '@/lib/graphql/queries/server.queries';
import type { Project } from '@/lib/graphql/types/project.types';
import type { Article } from '@/lib/graphql/types/article.types';
import { sanitizeJsonLd } from '@/lib/seo/metadata';

type WorkItem =
  | { type: 'project'; data: Project }
  | { type: 'article'; data: Article };

const toMs = (value: string) =>
  !isNaN(Number(value)) ? Number(value) : new Date(value).getTime();

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

  const allItems: WorkItem[] = [
    ...projects.map((project): WorkItem => ({ type: 'project', data: project })),
    ...articles.map((article): WorkItem => ({ type: 'article', data: article })),
  ].sort((a, b) => toMs(b.data.createdAt) - toMs(a.data.createdAt));

  const itemListLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Work | Luis Faria',
    url: 'https://luisfaria.dev/work',
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: allItems.map((item, index) => ({
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

        <div className="flex items-center gap-2 mb-10 px-4">
          <a
            href="https://www.linkedin.com/in/lfariabr/"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto"
          >
            <Button variant="outline" size="sm" className="gap-1.5">
              LinkedIn
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </a>
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

        {allItems.length === 0 && !(projectsError || articlesError) && (
          <div className="text-center py-20">
            <h3 className="text-lg font-semibold mb-2">Nothing here yet</h3>
            <p className="text-muted-foreground">Content will appear once it is published.</p>
          </div>
        )}

        {allItems.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-4">
            {allItems.map((item) =>
              item.type === 'project' ? (
                <ProjectCard key={`project-${item.data.id}`} project={item.data} />
              ) : (
                <ArticleCard key={`article-${item.data.id}`} article={item.data} />
              ),
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
