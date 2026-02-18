'use client';

import Link from 'next/link';
import { ArrowLeft, Calendar, Github } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { Button } from '@/components/ui/button';
import { MarkdownMessage } from '@/components/chat/MarkdownMessage';
import type { Project } from '@/lib/graphql/types/project.types';

function formatDateSafe(dateString: string) {
  try {
    const date = !isNaN(Number(dateString))
      ? new Date(Number(dateString))
      : parseISO(dateString);
    if (isValid(date)) {
      return format(date, 'MMMM dd, yyyy');
    }
    return 'Recently';
  } catch {
    return 'Recently';
  }
}

interface ProjectContentProps {
  project: Project;
}

export function ProjectContent({ project }: ProjectContentProps) {
  return (
    <div className="space-y-8 px-4">
      <Button variant="outline" size="sm" asChild className="mb-4">
        <Link href="/projects" className="flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" />
          Back to Projects
        </Link>
      </Button>

      <div>
        <h1 className="text-4xl font-bold tracking-tight">{project.title}</h1>
        <p className="text-muted-foreground mt-2 flex items-center gap-1">
          <Calendar className="h-4 w-4" />
          Published on {formatDateSafe(project.createdAt)}
        </p>
      </div>

      {project.imageUrl && (
        <div className="overflow-hidden rounded-lg border">
          <img
            src={project.imageUrl}
            alt={project.title}
            className="w-full h-auto object-cover max-h-[400px]"
          />
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">About this project</h2>
        <div className="prose prose-stone dark:prose-invert space-y-1">
          <MarkdownMessage content={project.description} />
        </div>
      </div>

      {project.technologies && project.technologies.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Technologies</h2>
          <div className="flex flex-wrap gap-2">
            {project.technologies.map((tech, i) => (
              <div
                key={i}
                className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm"
              >
                {tech}
              </div>
            ))}
          </div>
        </div>
      )}

      {project.githubUrl && (
        <div className="pt-4">
          <Button variant="outline" asChild>
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2"
            >
              <Github className="h-4 w-4" />
              View on GitHub
            </a>
          </Button>
        </div>
      )}
    </div>
  );
}
