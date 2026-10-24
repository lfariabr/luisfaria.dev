'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  EmomConfig,
  PRESETS,
  formatClock,
  formatReps,
  localDateKey,
  matchesPreset,
  sessionGoal,
  tally,
} from '@/lib/emom/plan';
import {
  LiveSnapshot,
  LoggedSession,
  loadConfig,
  loadLive,
  loadLog,
  saveConfig,
  saveLive,
  saveLog,
} from '@/lib/emom/storage';
import { FinishedSession, useEmomSession } from '@/lib/emom/useEmomSession';
import { EmomDone } from './EmomDone';
import { EmomRun } from './EmomRun';
import { EmomSetup } from './EmomSetup';
import { EmomSummary } from './EmomSummary';
import { EmomTrainingLog } from './EmomTrainingLog';

/** How long the DONE card holds before the summary takes over. */
const DONE_HOLD_MS = 1500;

const sessionLabel = (cfg: EmomConfig) => PRESETS.find((p) => matchesPreset(cfg, p))?.name ?? 'Custom EMOM';

function ResumeBanner({ snap, onResume, onDiscard }: { snap: LiveSnapshot; onResume: () => void; onDiscard: () => void }) {
  const started = new Date(snap.startedAt);
  const reps = tally(snap.cfg, snap.phases, snap.adj, snap.paces ?? [], snap.vt).done;

  return (
    <section
      aria-label="Unfinished session"
      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/50 bg-card p-4"
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Unfinished session</p>
        <p>
          {started.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })}, started{' '}
          {started.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })} · {formatReps(reps)} reps
        </p>
        <p className="font-mono text-xs text-muted-foreground">
          {formatClock(snap.vt, true)} in · goal {formatReps(sessionGoal(snap.cfg))}
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onDiscard}>
          Discard
        </Button>
        <Button onClick={onResume}>Resume, paused</Button>
      </div>
    </section>
  );
}

export function EmomTracker() {
  const [cfg, setCfg] = useState<EmomConfig>(loadConfig);
  const [log, setLog] = useState<LoggedSession[]>(loadLog);
  const [live, setLive] = useState<LiveSnapshot | null>(loadLive);
  const [finished, setFinished] = useState<{ session: FinishedSession; id: string } | null>(null);
  const [celebrating, setCelebrating] = useState(false);

  useEffect(() => {
    if (!finished) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  }, [finished, celebrating]);

  useEffect(() => {
    if (!celebrating) return;
    const id = window.setTimeout(() => setCelebrating(false), DONE_HOLD_MS);
    return () => window.clearTimeout(id);
  }, [celebrating]);

  const updateLog = useCallback((update: (prev: LoggedSession[]) => LoggedSession[]) => {
    setLog((prev) => {
      const next = update(prev);
      saveLog(next);
      return next;
    });
  }, []);

  const handleFinish = useCallback(
    (session: FinishedSession) => {
      const entry: LoggedSession = {
        id: String(session.startedAt.getTime()),
        date: localDateKey(session.startedAt),
        label: sessionLabel(session.cfg),
        reps: session.done,
        secs: Math.round(session.secs),
        complete: session.complete,
        note: '',
      };
      updateLog((prev) => [...prev.filter((s) => s.id !== entry.id), entry]);
      setFinished({ session, id: entry.id });
      setCelebrating(session.complete);
    },
    [updateLog],
  );

  const session = useEmomSession(handleFinish);

  const updateCfg = (next: EmomConfig) => {
    setCfg(next);
    saveConfig(next);
  };

  if (session.view) {
    return (
      <EmomRun
        view={session.view}
        awake={session.awake}
        onTogglePause={session.togglePause}
        onAdjust={session.adjust}
        onSkip={session.skip}
        onEnd={session.end}
      />
    );
  }

  if (finished && celebrating) {
    return <EmomDone session={finished.session} onSkip={() => setCelebrating(false)} />;
  }

  if (finished) {
    const note = log.find((s) => s.id === finished.id)?.note ?? '';
    return (
      <EmomSummary
        session={finished.session}
        note={note}
        sessionNumber={log.findIndex((s) => s.id === finished.id) + 1}
        onNoteChange={(text) => updateLog((prev) => prev.map((s) => (s.id === finished.id ? { ...s, note: text } : s)))}
        onBack={() => setFinished(null)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h1 className="text-2xl font-extrabold uppercase tracking-wide">Beast EMOM</h1>
        <p className="text-sm text-muted-foreground">Pull-ups on the minute</p>
      </header>

      {live && (
        <ResumeBanner
          snap={live}
          onResume={() => {
            session.resume(live);
            setLive(null);
          }}
          onDiscard={() => {
            saveLive(null);
            setLive(null);
          }}
        />
      )}

      <EmomSetup
        cfg={cfg}
        onChange={updateCfg}
        onStart={() => {
          setLive(null);
          session.start(cfg);
        }}
        aside={<EmomTrainingLog log={log} color={cfg.color} now={new Date()} />}
      />
    </div>
  );
}
