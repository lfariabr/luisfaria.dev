'use client';

import { Check } from 'lucide-react';
import { formatClock, formatReps } from '@/lib/emom/plan';
import type { FinishedSession } from '@/lib/emom/useEmomSession';
import { cn } from '@/lib/utils';
import { SIGNAL } from './signal';

/** The brief "you finished" moment between the last minute and the summary. A tap skips it. */
export function EmomDone({ session, onSkip }: { session: FinishedSession; onSkip: () => void }) {
  const signal = SIGNAL[session.cfg.color];

  return (
    <button
      type="button"
      data-testid="emom-done"
      onClick={onSkip}
      className={cn(
        'flex min-h-[360px] w-full flex-col items-center justify-center gap-3 rounded-2xl px-4 py-7 text-center',
        signal.fill,
        signal.ink,
      )}
    >
      <span role="alert" className="flex items-center gap-3 text-[min(22vw,8rem)] font-extrabold uppercase leading-none">
        Done <Check aria-hidden className="h-[0.7em] w-[0.7em]" strokeWidth={3} />
      </span>
      <span className="font-mono text-2xl tabular-nums">
        {formatReps(session.done)} reps · {formatClock(session.secs)}
      </span>
    </button>
  );
}
