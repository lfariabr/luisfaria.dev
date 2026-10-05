import { Badge } from '@/components/ui/badge';
import { MONTH_GOAL, formatClock, formatReps } from '@/lib/emom/plan';
import { LoggedSession, monthTotal } from '@/lib/emom/storage';
import { cn } from '@/lib/utils';
import { SIGNAL } from './signal';
import type { FlashColor } from '@/lib/emom/plan';

interface EmomTrainingLogProps {
  log: LoggedSession[];
  color: FlashColor;
  now: Date;
}

export function EmomTrainingLog({ log, color, now }: EmomTrainingLogProps) {
  const total = monthTotal(log, now);
  const recent = [...log].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)).slice(0, 6);

  return (
    <section className="flex flex-col gap-4 rounded-xl border bg-card p-5" aria-labelledby="emom-log-title">
      <div className="flex items-center justify-between gap-2">
        <h2 id="emom-log-title" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Training log
        </h2>
        <Badge variant="outline">This browser</Badge>
      </div>

      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-end gap-x-4 gap-y-1">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {now.toLocaleDateString('en-AU', { month: 'long' })}
          </p>
          <p className="font-mono text-3xl tabular-nums leading-none">
            {formatReps(total)} <span className="text-base text-muted-foreground">/ {formatReps(MONTH_GOAL)}</span>
          </p>
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="h-2 overflow-hidden rounded bg-muted">
            <div className={cn('h-full', SIGNAL[color].fill)} style={{ width: `${Math.min(100, (total / MONTH_GOAL) * 100)}%` }} />
          </div>
          <p className="text-xs text-muted-foreground">
            {total >= MONTH_GOAL ? 'Month goal cleared' : `${formatReps(MONTH_GOAL - total)} to the month goal`}
          </p>
        </div>
      </div>

      {recent.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No sessions yet. Finished sessions land here and count toward the month.
        </p>
      ) : (
        <table className="w-full text-sm">
          <tbody>
            {recent.map((s) => (
              <tr key={s.id} className="border-t align-top">
                <td className="whitespace-nowrap py-2 pr-2 font-mono text-xs text-muted-foreground">
                  {new Date(`${s.date}T00:00:00`).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                </td>
                <td className="py-2 pr-2">
                  {s.label}
                  {!s.complete && (
                    <Badge variant="outline" className="ml-2 text-amber-600 dark:text-amber-400">
                      Ended early
                    </Badge>
                  )}
                  {s.note && <p className="text-xs text-muted-foreground">{s.note}</p>}
                </td>
                <td className="whitespace-nowrap py-2 pr-2 text-right font-mono tabular-nums">{formatReps(s.reps)}</td>
                <td className="whitespace-nowrap py-2 text-right font-mono text-xs tabular-nums text-muted-foreground">
                  {formatClock(s.secs, true)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="text-xs text-muted-foreground">Saved in this browser only. Other devices keep their own log.</p>
    </section>
  );
}
