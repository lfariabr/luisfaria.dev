'use client';

import { cn } from '@/lib/utils';
import type { RateNotice } from './types';

interface RateNoticesProps {
  notices: RateNotice[];
}

const toneClasses: Record<RateNotice['tone'], string> = {
  info: 'bg-primary/10 text-primary border-primary/30',
  warning: 'bg-amber-50 text-amber-900 border-amber-200',
  success: 'bg-emerald-50 text-emerald-900 border-emerald-200',
};

export function RateNotices({ notices }: RateNoticesProps) {
  if (!notices.length) return null;

  return (
    <div className="fixed right-4 bottom-4 z-50 flex flex-col gap-2">
      {notices.map((notice) => (
        <div
          key={notice.id}
          className={cn(
            'rounded-2xl border px-4 py-3 shadow-lg backdrop-blur-sm transition-all',
            toneClasses[notice.tone]
          )}
        >
          <p className="text-sm font-medium">{notice.message}</p>
        </div>
      ))}
    </div>
  );
}
