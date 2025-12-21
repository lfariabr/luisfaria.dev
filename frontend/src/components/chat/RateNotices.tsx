'use client';

import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import type { RateNotice } from './types';

interface RateNoticesProps {
  notices: RateNotice[];
}

const toneClasses: Record<RateNotice['tone'], string> = {
  info: 'bg-primary/10 text-primary border-primary/30',
  warning: 'bg-amber-50 text-amber-900 border-amber-200',
  success: 'bg-emerald-50 text-emerald-900 border-emerald-200',
};

function NoticeItem({ notice }: { notice: RateNotice }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger entrance animation after mount
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div
      className={cn(
        'rounded-2xl border px-4 py-3 shadow-lg backdrop-blur-sm',
        'transition-all duration-300 ease-out',
        visible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-2',
        toneClasses[notice.tone]
      )}
    >
      <p className="text-sm font-medium">{notice.message}</p>
    </div>
  );
}

export function RateNotices({ notices }: RateNoticesProps) {
  if (!notices.length) return null;

  return (
    <div className="fixed right-4 bottom-4 z-50 flex flex-col gap-2">
      {notices.map((notice) => (
        <NoticeItem key={notice.id} notice={notice} />
      ))}
    </div>
  );
}
