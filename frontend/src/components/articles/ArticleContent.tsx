'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Calendar } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { MarkdownMessage } from '@/components/chat/MarkdownMessage';
import type { Article } from '@/lib/graphql/types/article.types';

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

interface ArticleContentProps {
  article: Article;
}

export function ArticleContent({ article }: ArticleContentProps) {
  return (
    <>
      <div className="mb-6 px-4">
        <Link
          href="/articles"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Articles
        </Link>

        <h1 className="text-4xl font-bold tracking-tight mt-2">
          {article.title}
        </h1>

        <div className="flex items-center mt-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4 mr-1" />
          <span>Published {formatDateSafe(article.createdAt)}</span>
        </div>
      </div>

      {article.imageUrl && (
        <div className="relative w-full rounded-lg overflow-hidden mb-8 px-4">
          <div className="relative aspect-video w-full">
            <Image
              src={article.imageUrl}
              alt={`${article.title} cover image`}
              fill
              className="object-cover"
              sizes="100vw"
            />
          </div>
        </div>
      )}

      {article.tags && article.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6 px-4">
          {article.tags.map((tag, index) => (
            <span
              key={index}
              className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="prose dark:prose-invert max-w-none px-4 space-y-1">
        <MarkdownMessage content={article.content} />
      </div>
    </>
  );
}
