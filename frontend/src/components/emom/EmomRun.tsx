'use client';

import { useEffect, useRef, useState } from 'react';
import { Maximize, Minus, Pause, Play, Plus, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  LIMITS,
  Phase,
  formatClock,
  formatReps,
  isFinalMinute,
  isSlowBlock,
  minuteKey,
  minutesDone,
  paceAt,
  phaseMinutes,
  rateFor,
  repsAt,
  sessionGoal,
} from '@/lib/emom/plan';
import { paceTarget, type SessionView } from '@/lib/emom/useEmomSession';
import { cn } from '@/lib/utils';
import { REST_TEXT, SIGNAL, WARN_TEXT } from './signal';
import { SessionMap } from './SessionMap';

const LABEL = 'text-xs font-semibold uppercase tracking-widest text-muted-foreground';
const STOP_CHECKS = ['Eat · ~40g carbs', 'Wash hands', 'Re-chalk', 'Skin + elbows check'];

type PanelState = 'count' | 'go' | 'go-off' | 'warn' | 'idle' | 'break';

interface EmomRunProps {
  view: SessionView;
  /** The screen wake lock is held. */
  awake: boolean;
  onTogglePause: () => void;
  onAdjust: (delta: number) => void;
  onSkip: () => void;
  onEnd: () => void;
}

const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

function toggleFullscreen() {
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  else document.documentElement.requestFullscreen?.().catch(() => {});
}

function MinuteStrip({ view, phase }: { view: SessionView; phase: Phase }) {
  const minutes = phaseMinutes(phase);
  const done = minutesDone(phase, view.vt, view.cfg.flashSec);
  const current = view.loc.phase === phase ? Math.floor(view.loc.local / 60) : -1;
  const signal = SIGNAL[view.cfg.color];

  return (
    <div className="grid gap-[3px]" style={{ gridTemplateColumns: `repeat(${Math.min(minutes, 10)}, minmax(0, 1fr))` }}>
      {Array.from({ length: minutes }, (_, m) => {
        const skipped = (view.adj[minuteKey(phase.block, m)] ?? 0) < 0;
        const under = rateFor(view.cfg, phase.block) - paceAt(view.cfg, view.paces, phase.block, m);
        const isDone = m < done;
        const state = !isDone ? 'todo' : skipped ? 'short' : under > 0 ? 'paced' : 'done';
        const tint = skipped
          ? 'bg-amber-500/70'
          : under > 0
            ? signal.paced[Math.min(under, signal.paced.length) - 1]
            : signal.soft;
        return (
          <i
            key={m}
            title={`Minute ${m + 1}`}
            data-state={state}
            className={cn(
              'aspect-square rounded-[3px] border bg-muted',
              isDone && cn('border-transparent', tint),
              isDone && under < 0 && 'border-foreground',
              m === current && 'border-2 border-foreground',
            )}
          />
        );
      })}
    </div>
  );
}

export function EmomRun({ view, awake, onTogglePause, onAdjust, onSkip, onEnd }: EmomRunProps) {
  const [endArmed, setEndArmed] = useState(false);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const endTimer = useRef<number | undefined>(undefined);
  const { cfg, loc, phases, paces, vt, running } = view;
  const { phase, local } = loc;
  const signal = SIGNAL[cfg.color];
  const goal = sessionGoal(cfg);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof Element && e.target.closest('input, textarea')) return;
      if (e.code === 'Space') {
        e.preventDefault();
        onTogglePause();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        onAdjust(1);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        onAdjust(-1);
      } else if (e.key === 'f' || e.key === 'F') toggleFullscreen();
      else if (e.key === 'n' || e.key === 'N') onSkip();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onAdjust, onSkip, onTogglePause]);

  useEffect(() => () => window.clearTimeout(endTimer.current), []);

  const handleEnd = () => {
    if (endArmed) {
      window.clearTimeout(endTimer.current);
      onEnd();
      return;
    }
    setEndArmed(true);
    endTimer.current = window.setTimeout(() => setEndArmed(false), 3000);
  };

  const next = phases[loc.index + 1];
  const minute = Math.floor(local / 60);
  const sec = local % 60;
  const workBlock = phase.type === 'count' ? 0 : phase.block;
  const stripPhase = phase.type === 'work' ? phase : phase.type === 'count' ? phases[1] : phases[loc.index - 1];

  let state: PanelState = 'idle';
  let cue = '';
  let clock = '';
  let sub = '';
  let progress = 0;
  let overlay: { seconds: number; reps: number; fill: number } | null = null;

  if (phase.type === 'count') {
    state = 'count';
    cue = 'Get on the bar';
    clock = String(Math.ceil(phase.dur - local));
    sub = `Block 1 · ${phaseMinutes(phases[1])} min × ${paceAt(cfg, paces, 0, 0)}`;
    progress = local / phase.dur;
  } else if (phase.type === 'work') {
    const reps = repsAt(cfg, view.adj, paces, phase.block, minute);
    const signalling = sec < cfg.flashSec;
    const remain = 60 - sec;
    const blink = reducedMotion() || Math.floor(sec * 2) % 2 === 0;
    state = signalling ? (cfg.mode === 'panel' && blink ? 'go' : 'go-off') : remain <= 3 ? 'warn' : 'idle';
    const final = isFinalMinute(cfg, phases, view.adj, paces, loc);
    const finishing = final && remain <= 3;
    cue = signalling ? `Go · ${reps} reps` : finishing ? 'Finish' : remain <= 3 ? 'Next minute' : 'Hang loose';
    clock = formatClock(Math.min(59.99, remain));
    const blockLeft = formatClock(phase.dur - local);
    const upNext = minute + 1 < phaseMinutes(phase) ? `Next: ${repsAt(cfg, view.adj, paces, phase.block, minute + 1)} reps · ` : '';
    sub = upNext + (phase.extra
      ? `Extra time · ${formatReps(Math.max(0, cfg.goal - view.done))} to ${formatReps(cfg.goal)}`
      : next?.type === 'break'
        ? `Service stop in ${blockLeft}`
        : next
          ? `Block ${phase.block + 2} in ${blockLeft}`
          : `Last block · ${blockLeft} left`);
    if (isSlowBlock(cfg, phase.block)) sub += ` · slower block, ${rateFor(cfg, phase.block)}/min`;
    if (final) sub = finishing ? `Last minute · ${clock} left` : 'Last minute';
    progress = sec / 60;
    if (signalling && cfg.mode === 'full' && running) {
      overlay = { seconds: Math.ceil(cfg.flashSec - sec), reps, fill: 1 - sec / cfg.flashSec };
    }
  } else {
    state = 'break';
    cue = 'Service stop';
    clock = formatClock(phase.dur - local);
    if (next) {
      const nextPace = paceAt(cfg, paces, next.block, 0);
      sub = `Next: block ${next.block + 1} · ${nextPace}/min · ${formatReps(phaseMinutes(next) * nextPace)} reps`;
    }
    progress = local / phase.dur;
  }

  const delta = view.done - view.plan;
  const target = paceTarget(phases, loc);
  const pace = target ? paceAt(cfg, paces, target.block, target.minute) : 0;
  const paceVsPlan = target ? pace - rateFor(cfg, target.block) : 0;
  const eta = new Date(view.now + (view.total - vt) * 1000);
  const canFullscreen = document.fullscreenEnabled;
  const where = [
    phase.type === 'break' ? 'Stop' : phase.extra ? 'Extra' : `B${workBlock + 1}/${cfg.rates.length}`,
    phase.type === 'work' && `M${minute + 1}/${phaseMinutes(phase)}`,
    formatClock(vt, true),
  ];
  const announce = phase.type === 'break' ? 'Service stop' : phase.extra ? 'Extra time' : phase.type === 'work' ? `Block ${phase.block + 1}` : '';
  const bar =
    state === 'go'
      ? 'bg-foreground/40'
      : state === 'warn' || state === 'count'
        ? 'bg-amber-500'
        : state === 'break'
          ? 'bg-blue-500/60'
          : signal.fill;

  return (
    <div className="flex flex-col gap-4">
      <div className="sticky top-14 z-30 -mx-4 -mt-4 flex h-14 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur md:top-0 md:-mx-6 md:-mt-6 md:px-6">
        <p className="min-w-0 flex-1 truncate font-mono text-sm tabular-nums sm:text-base">{where.filter(Boolean).join(' · ')}</p>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <i role="img" aria-label="Saved in browser" title="Saved in browser" className="h-1.5 w-1.5 rounded-full bg-green-600 dark:bg-green-500" />
          {awake && (
            <>
              <i role="img" aria-label="Screen stays on" title="Screen stays on" className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
              <span aria-hidden className="hidden sm:inline">Screen stays on</span>
            </>
          )}
        </span>
        <Button variant="outline" size="icon" className="size-11" onClick={onTogglePause} aria-label={running ? 'Pause' : 'Resume'}>
          {running ? <Pause /> : <Play />}
        </Button>
        {canFullscreen && (
          <Button variant="outline" size="icon" className="size-11" onClick={toggleFullscreen} aria-label="Fullscreen">
            <Maximize />
          </Button>
        )}
        <Button
          variant="outline"
          size={endArmed ? 'default' : 'icon'}
          onClick={handleEnd}
          aria-label={endArmed ? 'Tap again to end' : 'End'}
          className={cn('h-11', endArmed ? 'border-destructive text-destructive' : 'w-11')}
        >
          {endArmed ? 'Tap again to end' : <Square />}
        </Button>
      </div>

      <div aria-live="assertive" className="sr-only">
        {announce}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div
          data-testid="emom-panel"
          data-state={state}
          className={cn(
            'relative flex flex-col items-center justify-center gap-1.5 overflow-hidden rounded-2xl border bg-card px-4 py-5 lg:min-h-[360px] lg:py-7',
            state === 'go' && cn(signal.fill, 'border-transparent'),
            state === 'break' && 'border-blue-500/40 bg-blue-500/5',
          )}
        >
          {!running && (
            <span className={cn('absolute right-4 top-3.5 text-sm font-bold uppercase tracking-widest', WARN_TEXT)}>Paused</span>
          )}
          <p
            className={cn(
              'text-center text-2xl font-extrabold uppercase tracking-[0.14em] text-muted-foreground md:text-3xl',
              state === 'go' && signal.ink,
              state === 'go-off' && signal.text,
              (state === 'warn' || state === 'count') && WARN_TEXT,
              state === 'break' && REST_TEXT,
            )}
          >
            {cue}
          </p>
          <p
            role="timer"
            aria-live="off"
            className={cn(
              'font-mono text-[min(28vw,9rem)] font-medium leading-none tracking-tighter tabular-nums lg:text-[clamp(96px,20vw,240px)] lg:leading-[0.9]',
              state === 'go' && signal.ink,
              (state === 'warn' || state === 'count') && WARN_TEXT,
              state === 'break' && REST_TEXT,
            )}
          >
            {clock}
          </p>
          <p className={cn('text-center text-sm text-muted-foreground', state === 'go' && signal.ink)}>{sub}</p>
          <div className="absolute inset-x-0 bottom-0 h-1.5 bg-muted">
            <div className={cn('h-full', bar)} style={{ width: `${progress * 100}%` }} />
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-3">
          <section className="flex flex-col gap-2.5 rounded-xl border bg-card p-4">
            <span className={LABEL}>Reps done</span>
            <p className="font-mono text-4xl tabular-nums leading-none">
              {formatReps(view.done)} <span className="text-lg text-muted-foreground">/ {formatReps(goal)}</span>
            </p>
            <div className="h-2 overflow-hidden rounded bg-muted">
              <div className={cn('h-full', signal.fill)} style={{ width: `${Math.min(100, (view.done / goal) * 100)}%` }} />
            </div>
            <div className="flex justify-between gap-2 text-xs">
              <span className={cn('font-mono', delta < 0 && WARN_TEXT, delta > 0 && signal.text)}>
                {delta === 0 ? 'On plan' : `${delta > 0 ? '+' : ''}${delta} vs plan`}
              </span>
              <span className="text-muted-foreground">
                {formatReps(Math.max(0, goal - view.done))} to go · ends ~
                {eta.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </section>

          {phase.type === 'break' && (
            <section className="flex flex-col gap-2.5 rounded-xl border bg-card p-4">
              <span className={LABEL}>Service stop</span>
              <div className="grid grid-cols-2 gap-2">
                {STOP_CHECKS.map((item) => {
                  const id = `${phase.start}-${item}`;
                  return (
                    <label
                      key={id}
                      className={cn(
                        'flex cursor-pointer items-center gap-2 rounded-lg border bg-muted/50 px-2.5 py-2 text-sm',
                        checked[id] && 'text-muted-foreground line-through',
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={!!checked[id]}
                        onChange={(e) => setChecked((c) => ({ ...c, [id]: e.target.checked }))}
                        className="h-4 w-4 accent-blue-600"
                      />
                      {item}
                    </label>
                  );
                })}
              </div>
              <Button variant="outline" onClick={onSkip}>
                Back on the bar now
              </Button>
            </section>
          )}

          {target && (
            <section className="flex flex-col gap-2.5 rounded-xl border bg-card p-4">
              <span className={LABEL}>{phase.type === 'work' ? 'Pace · from this minute' : 'Pace · next block'}</span>
              <div className="grid grid-cols-[56px_1fr_56px] items-center gap-2">
                <button
                  type="button"
                  aria-label="Decrease pace"
                  disabled={pace <= LIMITS.rate[0]}
                  onClick={() => onAdjust(-1)}
                  className="grid h-14 place-items-center rounded-xl border bg-muted/50 disabled:opacity-35"
                >
                  <Minus className="h-5 w-5" />
                </button>
                <div className="text-center">
                  <span className="block font-mono text-4xl tabular-nums leading-none" data-testid="emom-pace">
                    {pace}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    plan {rateFor(cfg, target.block)}
                    {paceVsPlan !== 0 && ` · ${paceVsPlan > 0 ? '+' : ''}${paceVsPlan}`}
                  </span>
                </div>
                <button
                  type="button"
                  aria-label="Increase pace"
                  disabled={pace >= LIMITS.rate[1]}
                  onClick={() => onAdjust(1)}
                  className="grid h-14 place-items-center rounded-xl border bg-muted/50 disabled:opacity-35"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
            </section>
          )}

          {stripPhase && (
            <section className="flex flex-col gap-2.5 rounded-xl border bg-card p-4">
              <span className={LABEL}>{stripPhase.extra ? 'Extra time' : `Block ${stripPhase.block + 1}`} · minutes</span>
              <MinuteStrip view={view} phase={stripPhase} />
            </section>
          )}
        </div>
      </div>

      <SessionMap cfg={cfg} phases={phases} vt={vt} />

      {overlay && (
        <div
          aria-hidden
          data-testid="emom-overlay"
          className={cn('fixed inset-0 z-50 grid place-items-center px-4 text-center', signal.fill, signal.ink)}
        >
          <div>
            <b className="block text-[clamp(90px,24vw,340px)] font-extrabold leading-[0.85]">GO</b>
            <span className="my-2 block font-mono text-[clamp(48px,9vw,120px)] leading-none">{overlay.seconds}</span>
            <span className="font-mono text-[clamp(18px,3vw,34px)]">
              {overlay.reps} reps · {phase.extra ? 'extra' : `block ${workBlock + 1}`} · minute {minute + 1}/{phaseMinutes(phase)}
            </span>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-2.5 bg-current/25">
            <div className="h-full bg-current opacity-70" style={{ width: `${overlay.fill * 100}%` }} />
          </div>
        </div>
      )}
    </div>
  );
}
