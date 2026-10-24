'use client';

import { useEffect, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { blockSummaries, formatClock, formatPace, formatReps, sessionGoal, warRoomLogLine } from '@/lib/emom/plan';
import type { FinishedSession } from '@/lib/emom/useEmomSession';
import { cn } from '@/lib/utils';
import { SIGNAL, WARN_TEXT } from './signal';

const LABEL = 'text-xs font-semibold uppercase tracking-widest text-muted-foreground';
const STAT = 'font-mono text-[clamp(1.125rem,6vw,2.25rem)] leading-tight tabular-nums';

interface EmomSummaryProps {
  session: FinishedSession;
  note: string;
  /** This session's number in the training log, for the War Room row. */
  sessionNumber: number;
  onNoteChange: (note: string) => void;
  onBack: () => void;
}

export function EmomSummary({ session, note, sessionNumber, onNoteChange, onBack }: EmomSummaryProps) {
  const [copied, setCopied] = useState<'idle' | 'copied' | 'failed'>('idle');
  const [noteSaved, setNoteSaved] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const copiedTimer = useRef<number | undefined>(undefined);
  const { cfg, phases, adj, paces, secs, done, complete, startedAt } = session;
  const blocks = blockSummaries(cfg, phases, adj, paces, secs);
  const logLine = warRoomLogLine(cfg, blocks, done, secs, startedAt, sessionNumber);
  const showSkipped = blocks.some((b) => b.shortMinutes > 0);
  const vsGoal = done - sessionGoal(cfg);
  const signal = SIGNAL[cfg.color];

  useEffect(() => heading.current?.focus({ preventScroll: true }), []);
  useEffect(() => () => window.clearTimeout(copiedTimer.current), []);

  const copy = () => {
    navigator.clipboard
      ?.writeText(logLine)
      .then(() => {
        setCopied('copied');
        window.clearTimeout(copiedTimer.current);
        copiedTimer.current = window.setTimeout(() => setCopied('idle'), 2000);
      })
      .catch(() => setCopied('failed'));
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <p className={LABEL}>
        {startedAt.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })} ·{' '}
        {complete ? 'session complete' : 'ended early'}
      </p>
      <h1 ref={heading} tabIndex={-1} className="text-balance text-5xl font-extrabold uppercase leading-[0.95] outline-none md:text-7xl">
        <span className={signal.text}>{formatReps(done)}</span> pull-ups
      </h1>

      <div className="flex flex-wrap items-center gap-2.5 rounded-xl border border-green-600/40 bg-green-600/5 px-3.5 py-3 text-sm">
        <Badge variant="outline" className={complete ? 'text-green-700 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}>
          {complete ? 'Saved' : 'Saved · partial'}
        </Badge>
        {complete
          ? 'Added to the training log in this browser and to this month’s count.'
          : 'Saved what you did in this browser. It still counts toward the month.'}
      </div>

      <dl className="grid grid-cols-3 gap-4">
        <div className="min-w-0">
          <dt className={LABEL}>Time</dt>
          <dd className={STAT}>{formatClock(secs)}</dd>
        </div>
        <div className="min-w-0">
          <dt className={LABEL}>Rate</dt>
          <dd className={STAT}>{secs > 0 ? formatReps(Math.round(done / (secs / 3600))) : '—'}</dd>
          <dd className="text-xs text-muted-foreground">reps / hour</dd>
        </div>
        <div className="min-w-0">
          <dt className={LABEL}>Vs goal</dt>
          <dd className={cn(STAT, 'whitespace-nowrap', vsGoal >= 0 ? signal.text : WARN_TEXT)}>
            {vsGoal === 0 ? 'On goal' : `${vsGoal > 0 ? '+' : '−'}${formatReps(Math.abs(vsGoal))}`}
          </dd>
        </div>
      </dl>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className={cn(LABEL, 'py-2 pr-2')}>Block</th>
              <th className={cn(LABEL, 'py-2 pr-2 text-right')}>Pace</th>
              <th className={cn(LABEL, 'py-2 pr-2 text-right')}>Time</th>
              <th className={cn(LABEL, 'py-2 pr-2 text-right')}>Reps</th>
              {showSkipped && (
                <th className={cn(LABEL, 'py-2 text-right')} title="Minutes logged below the pace, i.e. skipped">
                  Skipped
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {blocks.map((b) => (
              <tr key={b.label} className="border-b font-mono tabular-nums">
                <td className="py-2 pr-2 font-sans">{b.label}</td>
                <td className="py-2 pr-2 text-right">{formatPace(b)}</td>
                <td className="py-2 pr-2 text-right">{b.minutes} min</td>
                <td className="py-2 pr-2 text-right">{formatReps(b.reps)}</td>
                {showSkipped && <td className="py-2 text-right">{b.shortMinutes || '—'}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="emom-notes" className={LABEL}>
          Notes · skin, elbows, fuel
        </label>
        <Textarea
          id="emom-notes"
          defaultValue={note}
          onChange={() => setNoteSaved(false)}
          onBlur={(e) => {
            onNoteChange(e.target.value.trim());
            setNoteSaved(true);
          }}
          placeholder="e.g. skin, elbows, fuel…"
          className="placeholder:italic placeholder:text-muted-foreground/70"
        />
        <p aria-live="polite" className="min-h-4 text-xs text-muted-foreground">
          {noteSaved && 'Saved ✓'}
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className={LABEL}>War Room log line</span>
        <pre className="whitespace-pre-wrap break-words rounded-lg border bg-muted/50 p-3 font-mono text-xs select-all">{logLine}</pre>
        {copied === 'failed' && <p className="text-xs text-muted-foreground">Copy was blocked. Select the line above and copy it manually.</p>}
      </div>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={copy}
          className={cn('rounded-xl py-4 text-xl font-extrabold uppercase tracking-widest hover:brightness-105', signal.fill, signal.ink)}
        >
          <span aria-live="polite">{copied === 'copied' ? 'Copied ✓' : 'Copy log line'}</span>
        </button>
        <Button variant="outline" size="lg" className="h-12 rounded-xl text-base" onClick={onBack}>
          Back to setup
        </Button>
      </div>
    </div>
  );
}
