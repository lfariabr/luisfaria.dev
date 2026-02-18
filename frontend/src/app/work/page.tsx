'use client';

import { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layouts/MainLayout';
import { useProjects } from '@/lib/hooks/useProjects';
import { usePublishedArticles } from '@/lib/hooks/useArticles';
import { Project } from '@/lib/graphql/types/project.types';
import { Article } from '@/lib/graphql/types/article.types';
import { AlertCircle, Calendar, ExternalLink, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { formatDateSafe } from '@/utils/dateHandler';

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

  const bothEmpty =
    !loadingProjects && !loadingArticles &&
    !projectsError && !articlesError &&
    projects.length === 0 && articles.length === 0;

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

        {/* Global empty state — only when both sections have no data */}
        {bothEmpty && visibleItems.length === 0 && (
          <div className="text-center py-20">
            <h3 className="text-lg font-semibold mb-2">Nothing here yet</h3>
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

function ProjectCard({ project }: { project: Project }) {
  return (
    <Link href={`/projects/${project.slug}`} className="relative block group">
      <div className="group rounded-lg border overflow-hidden bg-card text-card-foreground shadow hover:shadow-lg transition-all hover:scale-[1.02] h-full">
        <div className="aspect-video w-full bg-muted relative overflow-hidden">
          {project.imageUrl ? (
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${project.imageUrl})` }}
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-background/80 flex items-center justify-center text-2xl font-bold">
              {project.title}
            </div>
          )}
        </div>

        <div className="p-5 sm:p-7 flex flex-col gap-3 relative z-10">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Project
          </span>
          <h2 className="text-xl font-semibold">{project.title}</h2>
          <p className="text-muted-foreground text-sm line-clamp-3">
            {project.description.length > 150
              ? `${project.description.substring(0, 150)}...`
              : project.description}
          </p>

          {project.technologies?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {project.technologies.map((tech, i) => (
                <span
                  key={i}
                  className="bg-black text-gray-300 font-mono px-3 py-1.5 rounded-md text-xs border border-gray-800 shadow-[0_0_3px_#848884]"
                >
                  {tech}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 mr-1" />
            <span>{formatDateSafe(project.createdAt)}</span>
          </div>

          <div className="flex gap-3">
            {project.githubUrl && (
              <span
                role="link"
                tabIndex={0}
                onClick={(e) => {
                  e.preventDefault();
                  window.open(project.githubUrl, '_blank', 'noopener,noreferrer');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ')
                    window.open(project.githubUrl, '_blank', 'noopener,noreferrer');
                }}
                className="text-sm font-medium hover:underline z-20 cursor-pointer"
              >
                GitHub
              </span>
            )}
            <span className="text-sm font-medium text-primary hover:underline z-20">
              View Details
            </span>
          </div>
        </div>

        <span className="absolute inset-0 z-10" aria-hidden="true" />
      </div>
    </Link>
  );
}

function ArticleCard({ article }: { article: Article }) {
  const preview =
    article.excerpt ||
    (article.content.length > 150 ? `${article.content.substring(0, 150)}...` : article.content);

  return (
    <Link href={`/articles/${article.slug}`} className="relative block group">
      <div className="rounded-lg border overflow-hidden bg-card text-card-foreground shadow hover:shadow-lg transition-all hover:scale-[1.02] h-full">
        {article.imageUrl && (
          <div className="aspect-video w-full bg-muted overflow-hidden">
            <div
              className="w-full h-full bg-cover bg-center"
              style={{ backgroundImage: `url(${article.imageUrl})` }}
            />
          </div>
        )}

        <div className="p-5 sm:p-7 flex flex-col gap-3 relative z-10">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Article
          </span>
          <h2 className="text-xl font-semibold group-hover:text-primary transition-colors">
            {article.title}
          </h2>
          <p className="text-muted-foreground text-sm line-clamp-3">{preview}</p>

          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {article.tags.map((tag, i) => (
                <span
                  key={i}
                  className="bg-secondary text-secondary-foreground px-2 py-1 rounded-full text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 mr-1" />
            <span>{formatDateSafe(article.createdAt)}</span>
          </div>

          <span className="text-sm font-medium text-primary hover:underline z-20">Read more</span>
        </div>

        <span className="absolute inset-0 z-10" aria-hidden="true" />
      </div>
    </Link>
  );
}
