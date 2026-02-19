'use client';

import { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layouts/MainLayout';
import { useProjects } from '@/lib/hooks/useProjects';
import { usePublishedArticles } from '@/lib/hooks/useArticles';
import { Project } from '@/lib/graphql/types/project.types';
import { Article } from '@/lib/graphql/types/article.types';
import { AlertCircle, ExternalLink, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ProjectCard } from '@/components/work/ProjectCard';
import { ArticleCard } from '@/components/work/ArticleCard';

type Tab = 'all' | 'projects' | 'articles';

type WorkItem =
  | { type: 'project'; data: Project }
  | { type: 'article'; data: Article };

// Module-level helper — no re-creation on each render
const toMs = (s: string) => (!isNaN(Number(s)) ? Number(s) : new Date(s).getTime());

export default function WorkPage() {
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const { projects, loading: loadingProjects, error: projectsError } = useProjects();
  const { articles, loading: loadingArticles, error: articlesError } = usePublishedArticles();

  const loading = loadingProjects || loadingArticles;

  const allItems = useMemo<WorkItem[]>(
    () =>
      [
        ...projects.map((p): WorkItem => ({ type: 'project', data: p })),
        ...articles.map((a): WorkItem => ({ type: 'article', data: a })),
      ].sort((a, b) => toMs(b.data.createdAt) - toMs(a.data.createdAt)),
    [projects, articles],
  );

  const visibleItems = useMemo(
    () =>
      activeTab === 'projects'
        ? allItems.filter((i) => i.type === 'project')
        : activeTab === 'articles'
        ? allItems.filter((i) => i.type === 'article')
        : allItems,
    [allItems, activeTab],
  );

  return (
    <MainLayout>
      <div className="container py-12 max-w-6xl">
        {/* Header */}
        <div className="space-y-2 mb-8 px-4">
          <h1 className="text-3xl font-bold tracking-tight">Work</h1>
          <p className="text-muted-foreground">Featured projects and writing.</p>
        </div>

        {/* Tab bar */}
        <div className="flex flex-wrap items-center gap-2 mb-10 px-4">
          {(
            [
              { id: 'all', label: 'All', count: allItems.length },
              { id: 'projects', label: 'Projects', count: projects.length },
              { id: 'articles', label: 'Articles', count: articles.length },
            ] as { id: Tab; label: string; count: number }[]
          ).map(({ id, label, count }) => (
            <Button
              key={id}
              variant={activeTab === id ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab(id)}
              className="gap-1.5"
            >
              {label}
              {!loading && (
                <span
                  className={`text-[11px] font-semibold ${
                    activeTab === id
                      ? 'text-emerald-300 dark:text-emerald-700'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {count}
                </span>
              )}
            </Button>
          ))}

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

        {/* Global loading spinner — only while both are still fetching */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Per-section error banners — each independent */}
        {projectsError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Could not load projects: {projectsError}</AlertDescription>
          </Alert>
        )}
        {articlesError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Could not load articles: {articlesError}</AlertDescription>
          </Alert>
        )}

        {/* Empty state — tab-aware; suppressed during loading and when error banners already explain the gap */}
        {!loading && visibleItems.length === 0 &&
          !(activeTab === 'all' && (projectsError || articlesError)) && (
          <div className="text-center py-20">
            <h3 className="text-lg font-semibold mb-2">
              {activeTab === 'projects'
                ? 'No projects yet'
                : activeTab === 'articles'
                ? 'No articles yet'
                : 'Nothing here yet'}
            </h3>
            <p className="text-muted-foreground">Content will appear once it is published.</p>
          </div>
        )}

        {/* Grid — renders whatever is available regardless of partial errors */}
        {!loading && visibleItems.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-4">
            {visibleItems.map((item) =>
              item.type === 'project' ? (
                <ProjectCard key={`project-${item.data.id}`} project={item.data} />
              ) : (
                <ArticleCard key={`article-${item.data.id}`} article={item.data} />
              )
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
