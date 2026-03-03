import { MainLayout } from '@/components/layouts/MainLayout';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArticleCard } from '@/components/work/ArticleCard';
import { fetchGql } from '@/lib/graphql/fetchGql';
import { PUBLISHED_ARTICLES_QUERY } from '@/lib/graphql/queries/server.queries';
import type { Article } from '@/lib/graphql/types/article.types';
import { sanitizeJsonLd } from '@/lib/seo/metadata';

export const dynamic = 'force-dynamic';

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
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
