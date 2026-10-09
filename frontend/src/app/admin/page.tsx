'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useQuery, type ApolloError } from '@apollo/client';
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  FolderKanban,
  MapPin,
  Plus,
  Receipt,
  RotateCw,
  Timer,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GET_PROJECTS } from '@/lib/graphql/queries/project.queries';
import { GET_ARTICLES } from '@/lib/graphql/queries/article.queries';
import { GET_USERS } from '@/lib/graphql/queries/user.queries';
import { GET_PAYMENTS } from '@/lib/graphql/queries/payment.queries';
import { GET_PINS } from '@/lib/graphql/queries/pin.queries';
import type { ProjectsData } from '@/lib/graphql/types/project.types';
import type { ArticlesData } from '@/lib/graphql/types/article.types';
import type { UsersData } from '@/lib/graphql/types/user.types';
import type { PaymentsQueryData } from '@/lib/graphql/types/payment.types';
import type { PinsData } from '@/lib/graphql/types/pin.types';
import {
  NEW_USERS_WINDOW_DAYS,
  countNewSince,
  formatCurrencyTotals,
  latestPin,
  paymentsThisMonth,
  recentDraftArticles,
  recentFailedPayments,
  stalePendingPayments,
} from '@/lib/admin/dashboard';

const QUERY_OPTIONS = { notifyOnNetworkStatusChange: true } as const;

interface QueryState {
  loading: boolean;
  error?: ApolloError;
  refetch: () => unknown;
}

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;

function LoadError({ label, onRetry }: { label: string; onRetry: () => unknown }) {
  return (
    <div className="flex items-center gap-2 text-sm text-destructive">
      <span>Couldn&apos;t load {label}</span>
      <Button variant="ghost" size="sm" className="h-7 gap-1" onClick={() => onRetry()}>
        <RotateCw className="h-3.5 w-3.5" /> Retry
      </Button>
    </div>
  );
}

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-muted ${className}`} />;
}

interface TileProps {
  title: string;
  href: string;
  icon: LucideIcon;
  query?: QueryState;
  stat?: ReactNode;
  detail?: ReactNode;
  action: { href: string; label: string; icon?: LucideIcon };
}

function Tile({ title, href, icon: Icon, query, stat, detail, action }: TileProps) {
  const ActionIcon = action.icon;

  return (
    <Card data-testid={`tile-${title.toLowerCase()}`} className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">
          <Link href={href} className="hover:underline">
            {title}
          </Link>
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        <div className="flex-1 space-y-1">
          {query?.loading ? (
            <>
              <Skeleton className="h-7 w-16" />
              <Skeleton className="h-3 w-32" />
            </>
          ) : query?.error ? (
            <LoadError label={title.toLowerCase()} onRetry={query.refetch} />
          ) : (
            <>
              {stat !== undefined && <div className="text-2xl font-bold">{stat}</div>}
              {detail && <p className="text-xs text-muted-foreground">{detail}</p>}
            </>
          )}
        </div>
        <Button asChild variant="outline" size="sm" className="h-8 w-fit gap-1">
          <Link href={action.href}>
            {ActionIcon && <ActionIcon className="h-3.5 w-3.5" />}
            {action.label}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

interface AttentionItem {
  key: string;
  label: string;
  href: string;
}

function AttentionStrip({
  sources,
}: {
  sources: { label: string; query: QueryState; items: AttentionItem[] }[];
}) {
  const loading = sources.some((source) => source.query.loading);
  const failed = sources.filter((source) => !source.query.loading && source.query.error);
  const items = sources.flatMap((source) =>
    source.query.loading || source.query.error ? [] : source.items,
  );
  const allClear = !loading && failed.length === 0 && items.length === 0;

  return (
    <section aria-label="Needs attention" className="rounded-lg border bg-card p-4 space-y-2">
      <h2 className="text-sm font-semibold">Needs attention</h2>
      {allClear && (
        <p className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4" /> All clear
        </p>
      )}
      {items.length > 0 && (
        <ul className="space-y-1">
          {items.map((item) => (
            <li key={item.key}>
              <Link
                href={item.href}
                className="flex items-center gap-2 text-sm text-amber-600 hover:underline dark:text-amber-400"
              >
                <AlertTriangle className="h-4 w-4" /> {item.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
      {loading && <Skeleton className="h-4 w-48" />}
      {failed.map((source) => (
        <LoadError key={source.label} label={source.label} onRetry={source.query.refetch} />
      ))}
    </section>
  );
}

export default function AdminDashboardPage() {
  const [now] = useState(() => new Date());
  const projects = useQuery<ProjectsData>(GET_PROJECTS, QUERY_OPTIONS);
  const articles = useQuery<ArticlesData>(GET_ARTICLES, QUERY_OPTIONS);
  const users = useQuery<UsersData>(GET_USERS, QUERY_OPTIONS);
  const payments = useQuery<PaymentsQueryData>(GET_PAYMENTS, QUERY_OPTIONS);
  const pins = useQuery<PinsData>(GET_PINS, QUERY_OPTIONS);

  const projectList = projects.data?.projects ?? [];
  const articleList = articles.data?.articles ?? [];
  const userList = users.data?.users ?? [];
  const paymentList = payments.data?.payments ?? [];
  const pinList = pins.data?.pins ?? [];

  const failedPayments = recentFailedPayments(paymentList, now);
  const pendingPayments = stalePendingPayments(paymentList, now);
  const drafts = recentDraftArticles(articleList, now);
  const month = paymentsThisMonth(paymentList, now);
  const publishedCount = articleList.filter((article) => article.published).length;
  const lastPin = latestPin(pinList);

  const paymentAttention: AttentionItem[] = [
    ...(failedPayments.length
      ? [{ key: 'failed', label: `${plural(failedPayments.length, 'failed payment')} (last 30 days)`, href: '/admin/payments' }]
      : []),
    ...(pendingPayments.length
      ? [{ key: 'pending', label: `${plural(pendingPayments.length, 'payment')} pending for over 24h`, href: '/admin/payments' }]
      : []),
  ];
  const articleAttention: AttentionItem[] = drafts.length
    ? [{ key: 'drafts', label: `${plural(drafts.length, 'draft article')} in progress`, href: '/admin/articles' }]
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">What needs you, and where everything is.</p>
      </div>

      <AttentionStrip
        sources={[
          { label: 'payments', query: payments, items: paymentAttention },
          { label: 'articles', query: articles, items: articleAttention },
        ]}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Tile
          title="Projects"
          href="/admin/projects"
          icon={FolderKanban}
          query={projects}
          stat={projectList.length}
          detail={`${projectList.filter((project) => project.featured).length} featured`}
          action={{ href: '/admin/projects/new', label: 'New', icon: Plus }}
        />
        <Tile
          title="Articles"
          href="/admin/articles"
          icon={FileText}
          query={articles}
          stat={`${publishedCount} published`}
          detail={plural(articleList.length - publishedCount, 'draft')}
          action={{ href: '/admin/articles/new', label: 'New', icon: Plus }}
        />
        <Tile
          title="Payments"
          href="/admin/payments"
          icon={Receipt}
          query={payments}
          stat={`${month.paidCount} paid`}
          detail={[
            'This month',
            formatCurrencyTotals(month.paidTotals),
            month.refundedOrFailedCount ? `${month.refundedOrFailedCount} refunded/failed` : '',
          ]
            .filter(Boolean)
            .join(' · ')}
          action={{ href: '/admin/payments', label: 'View' }}
        />
        <Tile
          title="Users"
          href="/admin/users"
          icon={Users}
          query={users}
          stat={userList.length}
          detail={`${countNewSince(userList, NEW_USERS_WINDOW_DAYS, now)} new in the last 7 days`}
          action={{ href: '/admin/users', label: 'View' }}
        />
        <Tile
          title="Pins"
          href="/admin/relationship"
          icon={MapPin}
          query={pins}
          stat={pinList.length}
          detail={lastPin ? `Latest: ${lastPin.placeName}` : 'No places yet'}
          action={{ href: '/admin/relationship', label: 'Open map' }}
        />
        <Tile
          title="EMOM"
          href="/admin/emom"
          icon={Timer}
          detail="Every minute on the minute"
          action={{ href: '/admin/emom', label: 'Start session' }}
        />
      </div>
    </div>
  );
}
