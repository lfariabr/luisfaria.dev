'use client';

import { cn } from '@/lib/utils';
import type { RateStatus } from './types';

interface UsageMeterProps {
  limit: number;
  remaining: number;
  timeUntilReset: string;
  status: RateStatus;
  hasData?: boolean;
}

const STATUS_COPY: Record<RateStatus, { title: string; body: string }> = {
  ok: {
    title: 'Plenty of runway',
    body: 'You are within the safe zone. Keep exploring.',
  },
  warning: {
    title: 'Approaching limit',
    body: 'Slow down to avoid hitting the cap. Each request counts.',
  },
  blocked: {
    title: 'Limit reached',
    body: 'Messages temporarily paused. Cooldown is running.',
  },
  guest: {
    title: 'Login for full access',
    body: 'Authenticated members get 5 guided questions per hour.',
  },
};

export function UsageMeter({ limit, remaining, timeUntilReset, status, hasData = true }: UsageMeterProps) {
  // When no data yet, show empty meter (no progress)
  const used = hasData ? Math.max(0, limit - remaining) : 0;
  const progress = hasData && limit > 0 ? Math.min(1, used / limit) : 0;
  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - progress * circumference;
  const { title, body } = STATUS_COPY[status];

  return (
    <div className="border rounded-2xl p-4 md:p-5 bg-background shadow-sm space-y-4 md:space-y-5 w-full">
      <div className="flex items-center justify-between gap-3 md:gap-4">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.2em] md:tracking-[0.3em] text-muted-foreground">Usage Meter</p>
          <p className="text-2xl md:text-3xl font-semibold">{hasData ? `${remaining}/${limit}` : `—/${limit}`}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {timeUntilReset ? `Resets in ${timeUntilReset}` : 'Fresh window'}
          </p>
        </div>
        <div className="relative h-24 w-24 md:h-28 md:w-28 flex-shrink-0">
          <svg className="h-full w-full rotate-[-90deg]" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r="54"
              stroke="hsl(var(--muted))"
              strokeWidth="8"
              fill="transparent"
            />
            <circle
              cx="60"
              cy="60"
              r="54"
              stroke="url(#usageGradient)"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className={cn({
                'opacity-40': status === 'guest',
              })}
            />
            <defs>
              <linearGradient id="usageGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(var(--primary))" />
                <stop offset="100%" stopColor="hsl(var(--secondary))" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-[10px] md:text-xs uppercase tracking-[0.15em] md:tracking-[0.2em] text-muted-foreground">Used</span>
            <span className="text-xl md:text-2xl font-semibold">{hasData ? used : '—'}</span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-muted/40 p-4">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground mt-1">{body}</p>
      </div>
    </div>
  );
}
