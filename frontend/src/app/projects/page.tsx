import { MainLayout } from '@/components/layouts/MainLayout';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ProjectCard } from '@/components/work/ProjectCard';
import { fetchGql } from '@/lib/graphql/fetchGql';
import { PROJECTS_QUERY } from '@/lib/graphql/queries/server.queries';
import type { Project } from '@/lib/graphql/types/project.types';

export default async function ProjectsPage() {
  let projects: Project[] = [];
  let errorMessage: string | null = null;

  try {
    const data = await fetchGql<{ projects: Project[] }>(PROJECTS_QUERY, {
      revalidate: 3600,
    });
    projects = data.projects ?? [];
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : 'Unknown error';
  }

  return (
    <MainLayout>
      <div className="container py-12 max-w-6xl">
        <div className="space-y-2 mb-10 px-4">
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            A showcase of my recent development work and technical projects.
          </p>
        </div>

        {errorMessage && (
          <Alert variant="destructive" className="my-8">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Error loading projects: {errorMessage}</AlertDescription>
          </Alert>
        )}

        {!errorMessage && projects.length === 0 && (
          <div className="text-center py-20">
            <h3 className="text-lg font-semibold mb-2">No projects found</h3>
            <p className="text-muted-foreground">Projects will appear here once they are added.</p>
          </div>
        )}

        {!errorMessage && projects.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-4">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
