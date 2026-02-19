import Link from 'next/link';
import { Calendar } from 'lucide-react';
import { Article } from '@/lib/graphql/types/article.types';
import { formatDateSafe } from '@/utils/dateHandler';

export function ArticleCard({ article }: { article: Article }) {
  const preview = article.excerpt || article.content;

  return (
    <Link href={`/articles/${article.slug}`} className="relative block group">
      <div className="rounded-lg border overflow-hidden bg-card text-card-foreground shadow hover:shadow-lg transition-all hover:scale-[1.02] h-full">
        {article.imageUrl && (
          <div className="aspect-video w-full bg-muted overflow-hidden">
            <div
              className="w-full h-full bg-cover bg-center"
              style={{ backgroundImage: `url(${article.imageUrl})` }}
            />
          </div>
        )}

        <div className="p-5 sm:p-7 flex flex-col gap-3 relative z-10">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Article
          </span>
          <h2 className="text-xl font-semibold group-hover:text-primary transition-colors">
            {article.title}
          </h2>
          <p className="text-muted-foreground text-sm line-clamp-3">{preview}</p>

          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {article.tags.map((tag, i) => (
                <span
                  key={i}
                  className="bg-secondary text-secondary-foreground px-2 py-1 rounded-full text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 mr-1" />
            <span>{formatDateSafe(article.createdAt)}</span>
          </div>

          <span className="text-sm font-medium text-primary hover:underline z-20">Read more</span>
        </div>

        <span className="absolute inset-0 z-10" aria-hidden="true" />
      </div>
    </Link>
  );
}
