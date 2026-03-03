import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MainLayout } from '@/components/layouts/MainLayout';
import { ArticleContent } from '@/components/articles/ArticleContent';
import { fetchGql } from '@/lib/graphql/fetchGql';
import { ARTICLE_BY_SLUG_QUERY } from '@/lib/graphql/queries/server.queries';
import type { Article } from '@/lib/graphql/types/article.types';
import { buildDescription, resolveOgImage } from '@/lib/seo/metadata';

const SITE_URL = 'https://luisfaria.dev';

interface Props {
  params: Promise<{ id: string }>;
}

async function getArticle(slug: string): Promise<Article | null> {
  try {
    const data = await fetchGql<{ articleBySlug: Article }>(
      ARTICLE_BY_SLUG_QUERY,
      { variables: { slug } },
    );
    return data.articleBySlug ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const article = await getArticle(id);

  if (!article) {
    return { title: 'Article Not Found' };
  }

  const description = buildDescription(article.excerpt, article.content, 160);
  const ogImage = resolveOgImage(article.imageUrl);

  return {
    title: `${article.title} | Luis Faria`,
    description,
    alternates: { canonical: `${SITE_URL}/articles/${article.slug}` },
    openGraph: {
      title: article.title,
      description,
      url: `${SITE_URL}/articles/${article.slug}`,
      siteName: 'Luis Faria',
      type: 'article',
      publishedTime: article.createdAt,
      modifiedTime: article.updatedAt,
      tags: article.tags,
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description,
      images: [ogImage],
    },
  };
}

export default async function ArticleDetailPage({ params }: Props) {
  const { id } = await params;
  const article = await getArticle(id);

  if (!article) {
    notFound();
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description:
      buildDescription(article.excerpt, article.content, 160),
    image: resolveOgImage(article.imageUrl),
    datePublished: article.createdAt,
    dateModified: article.updatedAt,
    author: {
      '@type': 'Person',
      name: 'Luis Faria',
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Person',
      name: 'Luis Faria',
      url: SITE_URL,
    },
    mainEntityOfPage: `${SITE_URL}/articles/${article.slug}`,
    keywords: article.tags?.join(', '),
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
        name: 'Articles',
        item: `${SITE_URL}/articles`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: article.title,
        item: `${SITE_URL}/articles/${article.slug}`,
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
        <ArticleContent article={article} />
      </div>
    </MainLayout>
  );
}
