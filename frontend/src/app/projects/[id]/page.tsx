import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MainLayout } from '@/components/layouts/MainLayout';
import { ProjectContent } from '@/components/projects/ProjectContent';
import { fetchGql } from '@/lib/graphql/fetchGql';
import { PROJECT_BY_SLUG_QUERY } from '@/lib/graphql/queries/server.queries';
import type { Project } from '@/lib/graphql/types/project.types';

const SITE_URL = 'https://luisfaria.dev';

interface Props {
  params: Promise<{ id: string }>;
}

async function getProject(slug: string): Promise<Project | null> {
  try {
    const data = await fetchGql<{ projectBySlug: Project }>(
      PROJECT_BY_SLUG_QUERY,
      { variables: { slug } },
    );
    return data.projectBySlug ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const project = await getProject(id);

  if (!project) {
    return { title: 'Project Not Found' };
  }

  const description =
    project.description.slice(0, 160).replace(/[#*_`\n]/g, '') + '...';
  const ogImage = project.imageUrl || `${SITE_URL}/og-default.png`;

  return {
    title: `${project.title} | Luis Faria`,
    description,
    alternates: { canonical: `${SITE_URL}/projects/${project.slug}` },
    openGraph: {
      title: project.title,
      description,
      url: `${SITE_URL}/projects/${project.slug}`,
      siteName: 'Luis Faria',
      type: 'website',
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: project.title,
      description,
      images: [ogImage],
    },
  };
}

export default async function ProjectDetailPage({ params }: Props) {
  const { id } = await params;
  const project = await getProject(id);

  if (!project) {
    notFound();
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: project.title,
    description:
      project.description.slice(0, 160).replace(/[#*_`\n]/g, ''),
    image: project.imageUrl || `${SITE_URL}/og-default.png`,
    url: `${SITE_URL}/projects/${project.slug}`,
    applicationCategory: 'WebApplication',
    operatingSystem: 'Any',
    author: {
      '@type': 'Person',
      name: 'Luis Faria',
      url: SITE_URL,
    },
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: SITE_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Projects',
        item: `${SITE_URL}/projects`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: project.title,
        item: `${SITE_URL}/projects/${project.slug}`,
      },
    ],
  };

  return (
    <MainLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <div className="container py-16 mx-auto px-4">
        <ProjectContent project={project} />
      </div>
    </MainLayout>
  );
}
