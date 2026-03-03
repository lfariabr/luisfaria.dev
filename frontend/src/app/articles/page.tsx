import { MainLayout } from '@/components/layouts/MainLayout';
import Link from 'next/link';
import Image from 'next/image';
import { AlertCircle, Calendar } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { fetchGql } from '@/lib/graphql/fetchGql';
import { PUBLISHED_ARTICLES_QUERY } from '@/lib/graphql/queries/server.queries';
import type { Article } from '@/lib/graphql/types/article.types';
import { sanitizeJsonLd } from '@/lib/seo/metadata';
import { formatDateSafe } from '@/utils/dateHandler';

export default async function ArticlesPage() {
  let articles: Article[] = [];
  let errorMessage: string | null = null;

  try {
    const data = await fetchGql<{ publishedArticles: Article[] }>(PUBLISHED_ARTICLES_QUERY, {
      revalidate: 3600,
    });
    articles = data.publishedArticles ?? [];
  } catch (error) {
    console.error('Failed to fetch articles page data', error);
    errorMessage = 'An unexpected error occurred. Please try again later.';
  }

  const itemListLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Articles | Luis Faria',
    url: 'https://luisfaria.dev/articles',
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: articles.map((article, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `https://luisfaria.dev/articles/${article.slug}`,
        name: article.title,
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
        <div className="space-y-2 mb-10 px-4">
          <h1 className="text-3xl font-bold tracking-tight">Articles</h1>
          <p className="text-muted-foreground">Latest thoughts, tutorials, and insights</p>
        </div>

        {errorMessage && (
          <Alert variant="destructive" className="my-8">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        {!errorMessage && articles.length === 0 && (
          <div className="text-center py-20">
            <h3 className="text-lg font-semibold mb-2">No articles found</h3>
            <p className="text-muted-foreground">
              Articles will appear here once they are published.
            </p>
          </div>
        )}

        {!errorMessage && articles.length > 0 && (
          <div className="space-y-10 px-4">
            {articles.map((article) => (
              <ArticleListItem key={article.id} article={article} />
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}

function ArticleListItem({ article }: { article: Article }) {
  const contentPreview =
    article.excerpt ||
    (article.content.length > 200 ? `${article.content.substring(0, 200)}...` : article.content);

  return (
    <Link href={`/articles/${article.slug}`} className="block group border-b pb-8 last:border-b-0">
      <div className="flex flex-col md:flex-row gap-6 relative">
        {article.imageUrl && (
          <div className="w-full md:w-1/3 aspect-video bg-muted overflow-hidden rounded-lg relative">
            <Image
              src={article.imageUrl}
              alt={`${article.title} cover image`}
              fill
              className="object-cover"
              sizes="(min-width: 768px) 33vw, 100vw"
            />
          </div>
        )}

        <div className="w-full md:w-2/3 space-y-4">
          <h2 className="text-2xl font-semibold group-hover:text-primary transition-colors">
            {article.title}
          </h2>

          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 mr-1" />
            <span>Published {formatDateSafe(article.createdAt)}</span>
          </div>

          <p className="text-muted-foreground">{contentPreview}</p>

          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {article.tags.map((tag, index) => (
                <span
                  key={index}
                  className="bg-secondary text-secondary-foreground px-2 py-1 rounded-full text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <span className="inline-block text-sm font-medium text-primary hover:underline">
            Read more
          </span>
        </div>

        <span className="absolute inset-0 z-10" aria-hidden="true" />
      </div>
    </Link>
  );
}
