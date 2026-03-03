'use client';

import { useMemo, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProjectCard } from '@/components/work/ProjectCard';
import { ArticleCard } from '@/components/work/ArticleCard';
import type { Project } from '@/lib/graphql/types/project.types';
import type { Article } from '@/lib/graphql/types/article.types';

type Tab = 'all' | 'projects' | 'articles';

type WorkItem =
  | { type: 'project'; data: Project }
  | { type: 'article'; data: Article };

const toMs = (value: string) =>
  !isNaN(Number(value)) ? Number(value) : new Date(value).getTime();

export function WorkTabsContent({
  projects,
  articles,
}: {
  projects: Project[];
  articles: Article[];
}) {
  const [activeTab, setActiveTab] = useState<Tab>('all');

  const allItems = useMemo<WorkItem[]>(
    () =>
      [
        ...projects.map((project): WorkItem => ({ type: 'project', data: project })),
        ...articles.map((article): WorkItem => ({ type: 'article', data: article })),
      ].sort((a, b) => toMs(b.data.createdAt) - toMs(a.data.createdAt)),
    [projects, articles],
  );

  const visibleItems = useMemo(
    () =>
      activeTab === 'projects'
        ? allItems.filter((item) => item.type === 'project')
        : activeTab === 'articles'
        ? allItems.filter((item) => item.type === 'article')
        : allItems,
    [allItems, activeTab],
  );

  return (
    <>
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
            <span
              className={`text-[11px] font-semibold ${
                activeTab === id
                  ? 'text-emerald-300 dark:text-emerald-700'
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {count}
            </span>
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

      {visibleItems.length === 0 && (
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

      {visibleItems.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-4">
          {visibleItems.map((item) =>
            item.type === 'project' ? (
              <ProjectCard key={`project-${item.data.id}`} project={item.data} />
            ) : (
              <ArticleCard key={`article-${item.data.id}`} article={item.data} />
            ),
          )}
        </div>
      )}
    </>
  );
}
