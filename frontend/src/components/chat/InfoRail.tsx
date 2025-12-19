'use client';

import { Button } from '@/components/ui/button';
import { AlertCircle, AlertTriangle } from 'lucide-react';

interface InfoRailProps {
  profileInitials: string;
  displayName: string;
  isAuthenticated: boolean;
  remaining: number;
  limit: number;
  usagePercent: number;
  timeUntilReset: string;
  rateLimitResetTime: Date | null;
  defaultLimit: number;
}

export function InfoRail({
  profileInitials,
  displayName,
  isAuthenticated,
  remaining,
  limit,
  usagePercent,
  timeUntilReset,
  rateLimitResetTime,
  defaultLimit,
}: InfoRailProps) {
  const showLimitBanner = isAuthenticated && remaining === 0 && rateLimitResetTime;

  return (
    <aside className="flex flex-col gap-6 lg:sticky lg:top-8 self-start">
      {/* Profile Block */}
      <section className="rounded-3xl border bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white p-6 shadow-lg">
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

      <section className="border rounded-2xl p-5 bg-card shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 border border-primary/40 flex items-center justify-center text-lg font-semibold text-primary uppercase">
            {profileInitials}
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

      {/* Rate Limit Module */}
      <section className="border rounded-2xl p-5 space-y-4 bg-muted/40">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              Usage Window
            </p>
            <p className="text-2xl font-semibold">
              {isAuthenticated ? `${remaining}/${limit}` : `0/${defaultLimit}`}
            </p>
          </div>
          <span className="text-[11px] bg-white/60 dark:bg-slate-900/60 border rounded-full px-3 py-1 text-muted-foreground">
            {timeUntilReset ? `Resets in ${timeUntilReset}` : 'Fresh window'}
          </span>
        </div>
        <div className="space-y-2">
          <div className="h-2 w-full bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-blue-500 transition-all duration-300"
              style={{ width: `${usagePercent}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {isAuthenticated
              ? remaining > 0
                ? 'Still clear to keep chatting.'
                : 'Limit hit. Breathe for a minute, then try again.'
              : 'Authenticate to start using your message window.'}
          </p>
        </div>
      </section>

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
    </aside>
  );
}
