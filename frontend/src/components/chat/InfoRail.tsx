'use client';

import { Button } from '@/components/ui/button';
import { AlertCircle, AlertTriangle } from 'lucide-react';
import { UsageMeter } from './UsageMeter';
import type { RateStatus, UsageHistoryEntry } from './types';

interface InfoRailProps {
  profileInitials: string;
  displayName: string;
  isAuthenticated: boolean;
  remaining: number;
  limit: number;
  timeUntilReset: string;
  rateLimitResetTime: Date | null;
  defaultLimit: number;
  status: RateStatus;
  usageHistory: UsageHistoryEntry[];
  hasRateLimitData: boolean;
}

export function InfoRail({
  profileInitials,
  displayName,
  isAuthenticated,
  remaining,
  limit,
  timeUntilReset,
  rateLimitResetTime,
  defaultLimit,
  status,
  usageHistory,
  hasRateLimitData,
}: InfoRailProps) {
  const showLimitBanner = isAuthenticated && hasRateLimitData && remaining === 0 && rateLimitResetTime;
  
  const fallbackInitials = (() => {
    const base = profileInitials?.trim() || displayName?.trim() || 'LF';
    if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
      const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
      const segments: string[] = [];
      for (const { segment } of segmenter.segment(base)) {
        const clean = segment.trim();
        if (!clean) continue;
        segments.push(clean);
        if (segments.length === 2) break;
      }
      return segments.join('') || 'LF';
    }
    const chars = Array.from(base).filter((ch) => ch.trim());
    if (!chars.length) return 'LF';
    return (chars[0] ?? '') + (chars[1] ?? '');
  })();

  return (
    <aside className="flex flex-col gap-4 lg:gap-6 lg:sticky lg:top-8 w-full lg:self-start">
      {/* Profile Block - hidden on mobile */}
      <section className="hidden lg:block rounded-3xl border bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white p-6 shadow-lg">
        <p className="text-[11px] uppercase tracking-[0.3em] text-white/60 mb-3">
          Luis Faria • AI Command Center
        </p>
        <h1 className="text-3xl font-semibold leading-tight">
          Personal AI Assistant
        </h1>
        <p className="mt-3 text-sm text-white/80">
          Ask anything about my shipping history, architecture decisions, or leadership philosophy. Replies are grounded
          in my real portfolio.
        </p>
      </section>

      {/* Signed-in block - hidden on mobile */}
      <section className="hidden lg:block border rounded-2xl p-5 bg-card shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 border border-primary/40 flex items-center justify-center text-lg font-semibold text-primary uppercase">
            {fallbackInitials}
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              Signed in as
            </p>
            <p className="text-base font-semibold">
              {displayName}
            </p>
            <p className="text-xs text-muted-foreground">
              {isAuthenticated ? 'Full access unlocked' : `Log in for ${defaultLimit} authenticated messages/hr`}
            </p>
          </div>
        </div>
      </section>

      <UsageMeter
        limit={limit}
        remaining={isAuthenticated ? remaining : 0}
        timeUntilReset={timeUntilReset}
        status={status}
        hasData={!isAuthenticated || hasRateLimitData}
      />

      {!isAuthenticated && (
        <section className="border rounded-2xl p-5 bg-blue-50/70 dark:bg-blue-900/20">
          <div className="flex items-start gap-3">
            <div className="rounded-full p-2 bg-white/70 dark:bg-blue-900/40">
              <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                  Sign in to chat with Luis' AI Assistant
                </h3>
                <p className="text-sm text-blue-800/80 dark:text-blue-200/80">
                  Create an account to unlock full conversations ({defaultLimit} messages/hour).
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button asChild size="sm">
                  <a href="/login">Log in</a>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <a href="/register">Create account</a>
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      {showLimitBanner && (
        <section className="border rounded-2xl p-4 bg-amber-50 dark:bg-amber-900/30">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <div>
              <p className="font-semibold text-amber-900 dark:text-amber-100">
                Rate limit reached
              </p>
              <p className="text-sm text-amber-900/80 dark:text-amber-200/80">
                Next message available in {timeUntilReset}.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Recent usage - hidden on mobile */}
      <section className="hidden lg:block border rounded-2xl p-5 bg-card space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Recent usage</p>
          <span className="text-xs text-muted-foreground">Last 5 events</span>
        </div>
        <div className="space-y-2">
          {usageHistory.length === 0 && (
            <p className="text-xs text-muted-foreground">No usage recorded yet.</p>
          )}
          {usageHistory.map((entry) => (
            <div key={entry.id} className="flex items-center justify-between text-xs">
              <span className="text-foreground">{entry.description}</span>
              <span className="text-muted-foreground">
                {entry.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      </section>
    </aside>
  );
}
