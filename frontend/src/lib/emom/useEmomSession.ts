'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Adjustments,
  EmomConfig,
  Located,
  Phase,
  Tally,
  buildPhases,
  extensionPhase,
  locate,
  minuteKey,
  minutesDone,
  phaseMinutes,
  rateFor,
  tally,
  totalSeconds,
} from './plan';
import { LiveSnapshot, saveLive } from './storage';

const TICK_MS = 100;

interface Engine {
  cfg: EmomConfig;
  phases: Phase[];
  vt: number;
  adj: Adjustments;
  startedAt: Date;
  running: boolean;
  lastTs: number;
  lastPhase: number;
  lastSec: number;
  savedMinute: string;
}

export interface FinishedSession {
  cfg: EmomConfig;
  phases: Phase[];
  adj: Adjustments;
  secs: number;
  done: number;
  complete: boolean;
  startedAt: Date;
}

export interface SessionView extends Tally {
  cfg: EmomConfig;
  phases: Phase[];
  adj: Adjustments;
  vt: number;
  total: number;
  running: boolean;
  startedAt: Date;
  loc: Located;
  now: number;
}

type AudioWindow = Window & { webkitAudioContext?: typeof AudioContext };

function useBeeper() {
  const ctx = useRef<AudioContext | null>(null);
  return useCallback((freq: number, len: number, vol = 0.25) => {
    try {
      const Ctor = window.AudioContext ?? (window as AudioWindow).webkitAudioContext;
      if (!Ctor) return;
      ctx.current ??= new Ctor();
      const ac = ctx.current;
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = 'square';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(vol, ac.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + len);
      osc.connect(gain).connect(ac.destination);
      osc.start();
      osc.stop(ac.currentTime + len + 0.02);
    } catch {
      // Audio is a nice-to-have; a blocked context must never stop the clock.
    }
  }, []);
}

function useWakeLock() {
  const sentinel = useRef<WakeLockSentinel | null>(null);
  const request = useCallback(() => {
    if (!('wakeLock' in navigator)) return;
    navigator.wakeLock
      .request('screen')
      .then((lock) => {
        sentinel.current = lock;
      })
      .catch(() => {});
  }, []);
  const release = useCallback(() => {
    sentinel.current?.release().catch(() => {});
    sentinel.current = null;
  }, []);
  return { request, release };
}

const toSnapshot = (e: Engine): LiveSnapshot => ({
  cfg: e.cfg,
  phases: e.phases,
  vt: e.vt,
  adj: e.adj,
  startedAt: e.startedAt.toISOString(),
});

function toView(e: Engine): SessionView | null {
  const loc = locate(e.phases, e.vt);
  if (!loc) return null;
  return {
    cfg: e.cfg,
    phases: e.phases,
    adj: e.adj,
    vt: e.vt,
    total: totalSeconds(e.phases),
    running: e.running,
    startedAt: e.startedAt,
    loc,
    now: Date.now(),
    ...tally(e.cfg, e.phases, e.adj, e.vt),
  };
}

export function useEmomSession(onFinish: (session: FinishedSession) => void) {
  const engine = useRef<Engine | null>(null);
  const [view, setView] = useState<SessionView | null>(null);
  const onFinishRef = useRef(onFinish);
  const beep = useBeeper();
  const wake = useWakeLock();

  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  const redraw = useCallback(() => setView(engine.current ? toView(engine.current) : null), []);

  const persist = useCallback(() => {
    if (engine.current) saveLive(toSnapshot(engine.current));
  }, []);

  const finish = useCallback(() => {
    const e = engine.current;
    if (!e) return;
    const total = totalSeconds(e.phases);
    const secs = Math.min(e.vt, total);
    engine.current = null;
    saveLive(null);
    wake.release();
    onFinishRef.current({
      cfg: e.cfg,
      phases: e.phases,
      adj: e.adj,
      secs,
      done: tally(e.cfg, e.phases, e.adj, secs).done,
      complete: e.vt >= total,
      startedAt: e.startedAt,
    });
    redraw();
  }, [redraw, wake]);

  const reachedEnd = useCallback((): boolean => {
    const e = engine.current;
    if (!e || e.vt < totalSeconds(e.phases)) return false;
    const extension = extensionPhase(e.cfg, e.phases, e.adj);
    if (extension) {
      e.phases = [...e.phases, extension];
      persist();
      return false;
    }
    finish();
    return true;
  }, [finish, persist]);

  const playCues = useCallback(
    (e: Engine, loc: Located) => {
      const sec = Math.floor(loc.local);
      const sound = e.cfg.sound && e.running;
      if (e.lastPhase !== loc.index) {
        e.lastPhase = loc.index;
        e.lastSec = sec;
        if (!sound) return;
        if (loc.phase.type === 'work') beep(1046, 0.5);
        if (loc.phase.type === 'break') {
          beep(523, 0.25);
          window.setTimeout(() => beep(392, 0.4), 260);
        }
        return;
      }
      if (sec === e.lastSec) return;
      e.lastSec = sec;
      if (!sound) return;
      const remain = loc.phase.dur - sec;
      if (loc.phase.type === 'work') {
        const inMinute = sec % 60;
        if (inMinute === 0) beep(1046, 0.45);
        else if (inMinute >= 57 && remain > 3) beep(784, 0.08, 0.18);
      }
      if (remain >= 1 && remain <= 3) beep(784, 0.08, 0.18);
    },
    [beep],
  );

  useEffect(() => {
    const id = window.setInterval(() => {
      const e = engine.current;
      if (!e) return;
      const now = Date.now();
      if (e.running) e.vt += (now - e.lastTs) / 1000;
      e.lastTs = now;
      if (reachedEnd()) return;
      const loc = locate(e.phases, e.vt);
      if (loc) {
        playCues(e, loc);
        const minute = `${loc.index}-${Math.floor(loc.local / 60)}`;
        if (minute !== e.savedMinute) {
          e.savedMinute = minute;
          persist();
        }
      }
      redraw();
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [persist, playCues, reachedEnd, redraw]);

  useEffect(() => {
    const onHide = () => persist();
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') persist();
      else if (engine.current) wake.request();
    };
    window.addEventListener('pagehide', onHide);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('pagehide', onHide);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [persist, wake]);

  const boot = useCallback(
    (e: Omit<Engine, 'lastTs' | 'lastPhase' | 'lastSec' | 'savedMinute'>) => {
      engine.current = { ...e, lastTs: Date.now(), lastPhase: -1, lastSec: -1, savedMinute: '' };
      persist();
      wake.request();
      redraw();
    },
    [persist, redraw, wake],
  );

  const start = useCallback(
    (cfg: EmomConfig) => {
      if (cfg.sound) beep(660, 0.08, 0.15);
      boot({ cfg, phases: buildPhases(cfg), vt: 0, adj: {}, startedAt: new Date(), running: true });
    },
    [beep, boot],
  );

  const resume = useCallback(
    (snap: LiveSnapshot) =>
      boot({ ...snap, startedAt: new Date(snap.startedAt), running: false }),
    [boot],
  );

  const togglePause = useCallback(() => {
    const e = engine.current;
    if (!e) return;
    e.running = !e.running;
    e.lastTs = Date.now();
    persist();
    redraw();
  }, [persist, redraw]);

  const adjust = useCallback(
    (delta: number) => {
      const e = engine.current;
      const loc = e && locate(e.phases, e.vt);
      if (!e || !loc || loc.phase.type !== 'work') return;
      const key = minuteKey(loc.phase.block, Math.floor(loc.local / 60));
      const next = (e.adj[key] ?? 0) + delta;
      if (rateFor(e.cfg, loc.phase.block) + next < 0) return;
      e.adj = { ...e.adj, [key]: next };
      persist();
      redraw();
    },
    [persist, redraw],
  );

  const skip = useCallback(() => {
    const e = engine.current;
    const loc = e && locate(e.phases, e.vt);
    if (!e || !loc) return;
    const { phase } = loc;
    if (phase.type === 'work') {
      const adj = { ...e.adj };
      for (let m = minutesDone(phase, e.vt, e.cfg.flashSec); m < phaseMinutes(phase); m++) {
        adj[minuteKey(phase.block, m)] = -rateFor(e.cfg, phase.block);
      }
      e.adj = adj;
    }
    e.vt = phase.start + phase.dur + 0.001;
    if (reachedEnd()) return;
    persist();
    redraw();
  }, [persist, reachedEnd, redraw]);

  const end = useCallback(() => finish(), [finish]);

  return { view, start, resume, togglePause, adjust, skip, end };
}
