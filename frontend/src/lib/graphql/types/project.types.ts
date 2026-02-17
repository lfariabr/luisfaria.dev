// TypeScript interfaces for Project data

export interface Project {
  id: string;
  slug: string;
  title: string;
  description: string;
  imageUrl: string;
  githubUrl?: string;
  liveUrl?: string;
  featured?: boolean;
  order?: number;
  technologies: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectsData {
  projects: Project[];
}

export interface FeaturedProjectsData {
  featuredProjects: Project[];
}

export interface ProjectData {
  project: Project;
}

export interface ProjectVars {
  id: string;
}

export interface ProjectBySlugData {
  projectBySlug: Project;
}

export interface ProjectBySlugVars {
  slug: string;
}

/**
 * Input type for creating a project
 * Matches the GraphQL ProjectInput type from the backend
 */
export interface ProjectInput {
  title: string;
  description: string;
  imageUrl: string;
  githubUrl?: string;
  technologies: string[]; // Required field in the backend schema
  slug?: string;
}

/**
 * Input type for updating a project
 * Matches the GraphQL ProjectUpdateInput type from the backend
 * This is likely the same structure as ProjectInput but as a separate type in the GraphQL schema
 */
export interface ProjectUpdateInput extends ProjectInput {
  // Same fields as ProjectInput, but as a separate type for the GraphQL schema
}
