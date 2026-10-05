'use client';

import { ReactNode, useEffect, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import {
  EmomConfig,
  PRESETS,
  PlanField,
  buildPhases,
  durationMinutes,
  extraMinutes,
  formatHoursMinutes,
  formatReps,
  isSlowBlock,
  lastRate,
  matchesPreset,
  planFieldValue,
  planReps,
  sessionGoal,
  setPlanField,
} from '@/lib/emom/plan';
import { cn } from '@/lib/utils';
import { SIGNAL, WARN_TEXT } from './signal';
import { SessionMap } from './SessionMap';

const LABEL = 'text-xs font-semibold uppercase tracking-widest text-muted-foreground';

interface StepperProps {
  id: string;
  label: string;
  field: PlanField;
  step: number;
  cfg: EmomConfig;
  onChange: (cfg: EmomConfig) => void;
  hint?: string;
}

function Stepper({ id, label, field, step, cfg, onChange, hint }: StepperProps) {
  const value = planFieldValue(cfg, field);
  const commit = (raw: string) => onChange(setPlanField(cfg, field, Number(raw)));

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className={LABEL}>
        {label}
      </label>
      <div className="grid grid-cols-[44px_1fr_44px] overflow-hidden rounded-lg border bg-muted/50">
        <button
          type="button"
          aria-label={`Decrease ${label.toLowerCase()}`}
          onClick={() => onChange(setPlanField(cfg, field, value - step))}
          className="grid place-items-center text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Minus className="h-4 w-4" />
        </button>
        <input
          key={value}
          id={id}
          type="number"
          inputMode="numeric"
          defaultValue={value}
          onBlur={(e) => commit(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && commit(e.currentTarget.value)}
          className="w-full bg-transparent py-2 text-center font-mono text-xl tabular-nums [appearance:textfield] focus:outline-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <button
          type="button"
          aria-label={`Increase ${label.toLowerCase()}`}
          onClick={() => onChange(setPlanField(cfg, field, value + step))}
          className="grid place-items-center text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

interface SegmentProps<T extends string> {
  label: string;
  value: T;
  options: { value: T; label: ReactNode }[];
  onSelect: (value: T) => void;
}

function Segment<T extends string>({ label, value, options, onSelect }: SegmentProps<T>) {
  return (
    <div role="group" aria-label={label} className="inline-flex overflow-hidden rounded-lg border bg-card">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={option.value === value}
          onClick={() => onSelect(option.value)}
          className={cn(
            'inline-flex items-center gap-1.5 border-l px-3 py-2 text-sm text-muted-foreground first:border-l-0',
            option.value === value && 'bg-muted text-foreground',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function CycleList({ cfg, onChange }: { cfg: EmomConfig; onChange: (cfg: EmomConfig) => void }) {
  const rows: ReactNode[] = [];
  let t = 0;
  let cumulative = 0;
  const setRate = (block: number, delta: number) =>
    onChange({ ...cfg, rates: cfg.rates.map((r, i) => (i === block ? Math.min(30, Math.max(1, r + delta)) : r)) });
  const stop = (key: string) => {
    rows.push(
      <li key={key} className="grid grid-cols-[52px_minmax(0,1fr)] items-center gap-2.5 text-xs text-blue-600 dark:text-blue-400">
        <span className="font-mono text-muted-foreground">{formatHoursMinutes(t)}</span>
        <span>Service stop · {cfg.breakMin} min</span>
      </li>,
    );
    t += cfg.breakMin;
  };

  cfg.rates.forEach((rate, block) => {
    cumulative += rate * cfg.workMin;
    const slow = isSlowBlock(cfg, block);
    rows.push(
      <li key={`b${block}`} className="grid min-h-9 grid-cols-[52px_minmax(0,1fr)_auto_56px] items-center gap-2.5 text-sm">
        <span className="font-mono text-xs text-muted-foreground">{formatHoursMinutes(t)}</span>
        <span>
          <b className="font-semibold">Block {block + 1}</b>
          {slow && <span className={cn('ml-1', WARN_TEXT)}>· slower</span>}
        </span>
        <span className="inline-grid grid-cols-[28px_34px_28px] overflow-hidden rounded-md border bg-muted/50">
          <button type="button" aria-label={`Block ${block + 1} fewer reps`} onClick={() => setRate(block, -1)} className="text-muted-foreground hover:bg-muted hover:text-foreground">
            −
          </button>
          <span className="self-center text-center font-mono text-sm tabular-nums">{rate}</span>
          <button type="button" aria-label={`Block ${block + 1} more reps`} onClick={() => setRate(block, 1)} className="text-muted-foreground hover:bg-muted hover:text-foreground">
            +
          </button>
        </span>
        <span className="text-right font-mono text-xs tabular-nums text-muted-foreground">{formatReps(cumulative)}</span>
      </li>,
    );
    t += cfg.workMin;
    if (block < cfg.rates.length - 1 && cfg.breakMin > 0) stop(`s${block}`);
  });

  const extra = extraMinutes(cfg);
  if (extra) {
    if (cfg.breakMin > 0) stop('s-extra');
    cumulative += extra * lastRate(cfg);
    rows.push(
      <li key="extra" className="grid min-h-9 grid-cols-[52px_minmax(0,1fr)_auto_56px] items-center gap-2.5 text-sm">
        <span className="font-mono text-xs text-muted-foreground">{formatHoursMinutes(t)}</span>
        <span>
          <b className="font-semibold">Extra · {extra} min</b>
          <span className={cn('ml-1', WARN_TEXT)}>· to reach goal</span>
        </span>
        <span className="w-[90px] text-center font-mono text-sm tabular-nums">{lastRate(cfg)}</span>
        <span className="text-right font-mono text-xs tabular-nums text-muted-foreground">{formatReps(cumulative)}</span>
      </li>,
    );
    t += extra;
  }

  rows.push(
    <li key="done" className="grid grid-cols-[52px_minmax(0,1fr)_56px] items-center gap-2.5 text-sm">
      <span className="font-mono text-xs text-muted-foreground">{formatHoursMinutes(t)}</span>
      <b className="font-semibold">Done</b>
      <span className="text-right font-mono text-xs tabular-nums text-muted-foreground">{formatReps(cumulative)}</span>
    </li>,
  );

  return <ol className="flex max-h-80 flex-col gap-1 overflow-auto">{rows}</ol>;
}

function goalHint(cfg: EmomConfig): string {
  if (!cfg.goal) return 'The session ends when the last block ends, whatever the count.';
  const extra = extraMinutes(cfg);
  return extra
    ? `The blocks give ${formatReps(planReps(cfg))}. Adds ${extra} min at ${lastRate(cfg)}/min to reach ${formatReps(cfg.goal)}, and keeps adding minutes if you fall short.`
    : `The blocks already reach ${formatReps(cfg.goal)}. Minutes are added at the end only if you fall short.`;
}

interface EmomSetupProps {
  cfg: EmomConfig;
  onChange: (cfg: EmomConfig) => void;
  onStart: () => void;
  aside?: ReactNode;
}

export function EmomSetup({ cfg, onChange, onStart, aside }: EmomSetupProps) {
  const [demoTick, setDemoTick] = useState(0);
  const signal = SIGNAL[cfg.color];
  const duration = durationMinutes(cfg);
  const goal = sessionGoal(cfg);

  useEffect(() => {
    const id = window.setInterval(() => setDemoTick((t) => (t + 1) % 8), 400);
    return () => window.clearInterval(id);
  }, []);
  const demoOn = cfg.mode === 'full' ? demoTick < 4 : demoTick < 4 && demoTick % 2 === 0;

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <section className="flex min-w-0 flex-col gap-5 rounded-xl border bg-card p-5" aria-label="Session plan">
        <div className="flex flex-col gap-2">
          <span className={LABEL}>Presets</span>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((preset) => {
              const active = matchesPreset(cfg, preset);
              return (
                <button
                  key={preset.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() =>
                    onChange({ ...cfg, workMin: preset.workMin, breakMin: preset.breakMin, rates: [...preset.rates], goal: preset.goal })
                  }
                  className={cn(
                    'inline-flex items-baseline gap-1.5 rounded-full border px-3 py-1.5 text-sm',
                    active && 'border-foreground bg-foreground text-background',
                  )}
                >
                  {preset.name}
                  <small className="font-mono text-[11px] opacity-70">{formatReps(sessionGoal(preset))}</small>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Stepper id="emom-rate" label="Reps on the minute" field="rate" step={1} cfg={cfg} onChange={onChange} hint="Sets every block. Fine-tune each one below." />
          <Stepper id="emom-blocks" label="Work blocks" field="blocks" step={1} cfg={cfg} onChange={onChange} />
          <Stepper id="emom-work" label="Block length (min)" field="workMin" step={5} cfg={cfg} onChange={onChange} />
          <Stepper id="emom-break" label="Service stop (min)" field="breakMin" step={1} cfg={cfg} onChange={onChange} />
        </div>

        <div className="flex flex-col gap-2">
          <div className="grid items-end gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <span className={LABEL}>Finish line</span>
              <Segment
                label="Finish line"
                value={cfg.goal ? 'goal' : 'plan'}
                options={[
                  { value: 'plan', label: 'End of plan' },
                  { value: 'goal', label: 'Reach goal' },
                ]}
                onSelect={(v) =>
                  onChange({ ...cfg, goal: v === 'goal' ? cfg.goal || Math.ceil(planReps(cfg) / 50) * 50 : 0 })
                }
              />
            </div>
            {cfg.goal > 0 && <Stepper id="emom-goal" label="Goal reps" field="goal" step={50} cfg={cfg} onChange={onChange} />}
          </div>
          <p className="text-xs text-muted-foreground">{goalHint(cfg)}</p>
        </div>

        <dl className="grid grid-cols-3 gap-3">
          <div>
            <dt className={LABEL}>Session goal</dt>
            <dd className={cn('font-mono text-3xl tabular-nums leading-none sm:text-4xl', signal.text)}>{formatReps(goal)}</dd>
          </div>
          <div>
            <dt className={LABEL}>Duration</dt>
            <dd className="font-mono text-3xl tabular-nums leading-none sm:text-4xl">{formatHoursMinutes(duration)}</dd>
          </div>
          <div>
            <dt className={LABEL}>Pace</dt>
            <dd className="font-mono text-3xl tabular-nums leading-none sm:text-4xl">{formatReps(Math.round(goal / (duration / 60)))}</dd>
            <dd className="text-xs text-muted-foreground">reps / hour</dd>
          </div>
        </dl>

        <div className="flex flex-col gap-2">
          <span className={LABEL}>Session map</span>
          <SessionMap cfg={cfg} phases={buildPhases(cfg)} />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className={LABEL}>The cycle</span>
            <span className="text-xs text-muted-foreground">reps / min per block</span>
          </div>
          <CycleList cfg={cfg} onChange={onChange} />
        </div>
      </section>

      <div className="flex min-w-0 flex-col gap-5">
        <section className="flex flex-col gap-5 rounded-xl border bg-card p-5" aria-label="Go signal">
          <div className="flex flex-col gap-2">
            <span className={LABEL}>Go signal</span>
            <div className="flex flex-wrap gap-2.5">
              <Segment
                label="Signal size"
                value={cfg.mode}
                options={[
                  { value: 'full', label: 'Full screen' },
                  { value: 'panel', label: 'Clock panel' },
                ]}
                onSelect={(mode) => onChange({ ...cfg, mode })}
              />
              <Segment
                label="Signal colour"
                value={cfg.color}
                options={[
                  { value: 'green', label: <><i className={cn('h-2.5 w-2.5 rounded-full', SIGNAL.green.fill)} />Green</> },
                  { value: 'red', label: <><i className={cn('h-2.5 w-2.5 rounded-full', SIGNAL.red.fill)} />Red</> },
                ]}
                onSelect={(color) => onChange({ ...cfg, color })}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {cfg.mode === 'full'
                ? 'The whole screen holds your colour for the signal window, then returns to the clock.'
                : 'Only the clock panel blinks during the signal window.'}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Stepper id="emom-flash" label="Signal window (sec)" field="flashSec" step={1} cfg={cfg} onChange={onChange} />
            <div className="flex flex-col gap-1.5">
              <span className={LABEL}>Sound</span>
              <Segment
                label="Sound"
                value={cfg.sound ? 'on' : 'off'}
                options={[
                  { value: 'on', label: 'Beeps on' },
                  { value: 'off', label: 'Off' },
                ]}
                onSelect={(v) => onChange({ ...cfg, sound: v === 'on' })}
              />
              <p className="text-xs text-muted-foreground">3-2-1 ticks, a long beep on the minute.</p>
            </div>
          </div>

          <div
            aria-hidden
            className={cn(
              'grid h-[72px] place-items-center rounded-lg border text-2xl font-extrabold uppercase tracking-widest',
              demoOn ? cn(signal.fill, signal.ink, 'border-transparent') : 'bg-muted/50 text-muted-foreground',
            )}
          >
            Go · {cfg.rates[0]} reps
          </div>

          <button
            type="button"
            onClick={onStart}
            className={cn('rounded-xl py-4 text-xl font-extrabold uppercase tracking-widest hover:brightness-105', signal.fill, signal.ink)}
          >
            Start session
          </button>
          <p className="flex flex-wrap gap-x-3.5 gap-y-1 text-xs text-muted-foreground">
            <span><kbd className="rounded border px-1 font-mono">Space</kbd> pause</span>
            <span><kbd className="rounded border px-1 font-mono">↑</kbd><kbd className="ml-0.5 rounded border px-1 font-mono">↓</kbd> reps this minute</span>
            <span><kbd className="rounded border px-1 font-mono">F</kbd> fullscreen</span>
            <span><kbd className="rounded border px-1 font-mono">N</kbd> skip phase</span>
          </p>
        </section>
        {aside}
      </div>
    </div>
  );
}
