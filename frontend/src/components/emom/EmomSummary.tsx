'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { blockSummaries, formatClock, formatReps, sessionGoal, warRoomLogLine } from '@/lib/emom/plan';
import type { FinishedSession } from '@/lib/emom/useEmomSession';
import { cn } from '@/lib/utils';
import { SIGNAL } from './signal';

const LABEL = 'text-xs font-semibold uppercase tracking-widest text-muted-foreground';

interface EmomSummaryProps {
  session: FinishedSession;
  note: string;
  onNoteChange: (note: string) => void;
  onBack: () => void;
}

export function EmomSummary({ session, note, onNoteChange, onBack }: EmomSummaryProps) {
  const [copied, setCopied] = useState<'idle' | 'copied' | 'failed'>('idle');
  const { cfg, phases, adj, secs, done, complete, startedAt } = session;
  const blocks = blockSummaries(cfg, phases, adj, secs);
  const logLine = warRoomLogLine(cfg, blocks, done, secs, startedAt);
  const vsGoal = done - sessionGoal(cfg);
  const signal = SIGNAL[cfg.color];

  const copy = () => {
    navigator.clipboard
      ?.writeText(logLine)
      .then(() => setCopied('copied'))
      .catch(() => setCopied('failed'));
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <p className={LABEL}>
        {startedAt.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })} ·{' '}
        {complete ? 'session complete' : 'ended early'}
      </p>
      <h1 className="text-balance text-5xl font-extrabold uppercase leading-[0.95] md:text-7xl">
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

      <dl className="grid grid-cols-3 gap-3">
        <div>
          <dt className={LABEL}>Time</dt>
          <dd className="font-mono text-3xl tabular-nums md:text-4xl">{formatClock(secs, true)}</dd>
        </div>
        <div>
          <dt className={LABEL}>Rate</dt>
          <dd className="font-mono text-3xl tabular-nums md:text-4xl">{secs > 0 ? formatReps(Math.round(done / (secs / 3600))) : '—'}</dd>
          <dd className="text-xs text-muted-foreground">reps / hour</dd>
        </div>
        <div>
          <dt className={LABEL}>Vs goal</dt>
          <dd className="font-mono text-3xl tabular-nums md:text-4xl">
            {vsGoal === 0 ? 'On goal' : `${vsGoal > 0 ? '+' : ''}${formatReps(vsGoal)}`}
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
              <th className={cn(LABEL, 'py-2 text-right')}>Short min</th>
            </tr>
          </thead>
          <tbody>
            {blocks.map((b) => (
              <tr key={b.label} className="border-b font-mono tabular-nums">
                <td className="py-2 pr-2 font-sans">{b.label}</td>
                <td className="py-2 pr-2 text-right">{b.rate}/min</td>
                <td className="py-2 pr-2 text-right">{b.minutes} min</td>
                <td className="py-2 pr-2 text-right">{formatReps(b.reps)}</td>
                <td className="py-2 text-right">{b.shortMinutes || '—'}</td>
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
          onBlur={(e) => onNoteChange(e.target.value.trim())}
          placeholder="Cramps in the last block, callus on the ring finger, ~40g carbs/h"
        />
        <p className="text-xs text-muted-foreground">Saved with the session when you leave the field.</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className={LABEL}>War Room log line</span>
          <Button variant="outline" size="sm" onClick={copy}>
            {copied === 'copied' ? 'Copied' : 'Copy'}
          </Button>
        </div>
        <pre className="whitespace-pre-wrap break-words rounded-lg border bg-muted/50 p-3 font-mono text-xs select-all">{logLine}</pre>
        {copied === 'failed' && <p className="text-xs text-muted-foreground">Copy was blocked. Select the line above and copy it manually.</p>}
      </div>

      <button
        type="button"
        onClick={onBack}
        className={cn('rounded-xl py-4 text-xl font-extrabold uppercase tracking-widest hover:brightness-105', signal.fill, signal.ink)}
      >
        Back to setup
      </button>
    </div>
  );
}
