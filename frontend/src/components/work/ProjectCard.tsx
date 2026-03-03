import Link from 'next/link';
import Image from 'next/image';
import { Calendar } from 'lucide-react';
import { Project } from '@/lib/graphql/types/project.types';
import { formatDateSafe } from '@/utils/dateHandler';

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Link href={`/projects/${project.slug}`} className="relative block group">
      <div className="group rounded-lg border overflow-hidden bg-card text-card-foreground shadow hover:shadow-lg transition-all hover:scale-[1.02] h-full">
        <div className="aspect-video w-full bg-muted relative overflow-hidden">
          {project.imageUrl ? (
            <Image
              src={project.imageUrl}
              alt={`${project.title} preview`}
              fill
              className="object-cover"
              sizes="(min-width: 768px) 50vw, 100vw"
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
          <p className="text-muted-foreground text-sm line-clamp-3">{project.description}</p>

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
