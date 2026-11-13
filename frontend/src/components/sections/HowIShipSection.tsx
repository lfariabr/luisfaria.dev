import { cn } from '@/lib/utils';
import { HOW_I_SHIP } from '@/content/profile';

/** "How I ship": agent roles on the day-job platform, with the human deciding what merges (#490). */
export function HowIShipSection() {
  return (
    <section aria-labelledby="how-i-ship-heading" className="rounded-2xl border bg-card p-6 text-left">
      <h2 id="how-i-ship-heading" className="text-2xl font-bold tracking-tight">
        How I ship
      </h2>
      <div className="mt-4 grid gap-6 md:grid-cols-[3fr_2fr]">
        <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          {HOW_I_SHIP.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <ul aria-label="Agent roles" className="space-y-1.5 font-mono text-xs">
          {HOW_I_SHIP.roles.map((item) => {
            const human = 'human' in item && item.human;
            return (
              <li
                key={item.role}
                className={cn(
                  'flex justify-between gap-3 rounded-lg px-3 py-1.5',
                  human
                    ? 'bg-emerald-500/10 font-semibold text-emerald-700 ring-1 ring-emerald-500 dark:text-emerald-400'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                <span>{item.role}</span>
                <span>{item.does}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
