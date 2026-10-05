import { EmomConfig, Phase, formatReps, isSlowBlock, phaseMinutes, rateFor } from '@/lib/emom/plan';
import { cn } from '@/lib/utils';
import { SIGNAL } from './signal';

interface SessionMapProps {
  cfg: EmomConfig;
  phases: Phase[];
  vt?: number;
}

export function SessionMap({ cfg, phases, vt = 0 }: SessionMapProps) {
  const segments = phases.filter((p) => p.type !== 'count');
  const showTags = segments.length <= 17;

  return (
    <div className="flex h-7 gap-[3px]" aria-label="Session map">
      {segments.map((phase) => {
        const progress = Math.min(1, Math.max(0, (vt - phase.start) / phase.dur));
        const isWork = phase.type === 'work';
        return (
          <div
            key={phase.start}
            style={{ flexGrow: phase.dur }}
            className={cn(
              'relative min-w-1 basis-0 overflow-hidden rounded',
              isWork
                ? 'border bg-muted'
                : 'border border-dashed border-blue-500/50 bg-[repeating-linear-gradient(135deg,transparent_0_4px,rgb(59_130_246/0.25)_4px_6px)]',
              isWork && isSlowBlock(cfg, phase.block) && 'border-amber-500/60',
              phase.extra && 'border-dashed',
            )}
          >
            <div
              className={cn('absolute inset-y-0 left-0', isWork ? SIGNAL[cfg.color].soft : 'bg-blue-500/40')}
              style={{ width: `${progress * 100}%` }}
            />
            {isWork && showTags && (
              <span className="absolute inset-0 grid place-items-center font-mono text-[11px] tabular-nums">
                {formatReps(phaseMinutes(phase) * rateFor(cfg, phase.block))}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
