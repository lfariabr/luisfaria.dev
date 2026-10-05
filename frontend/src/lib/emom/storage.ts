import { Adjustments, DEFAULT_CONFIG, EmomConfig, Phase } from './plan';

export interface LoggedSession {
  id: string;
  date: string;
  label: string;
  reps: number;
  secs: number;
  complete: boolean;
  note: string;
}

export interface LiveSnapshot {
  cfg: EmomConfig;
  phases: Phase[];
  vt: number;
  adj: Adjustments;
  startedAt: string;
}

const KEYS = {
  config: 'emom:config',
  log: 'emom:log',
  live: 'emom:live',
} as const;

function read<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be full or blocked (private mode); the timer keeps running regardless.
  }
}

const isRates = (value: unknown): value is number[] =>
  Array.isArray(value) && value.length > 0 && value.every((n) => typeof n === 'number' && n > 0);

export function loadConfig(): EmomConfig {
  const stored = read<Partial<EmomConfig>>(KEYS.config);
  if (!stored) return DEFAULT_CONFIG;
  const merged = { ...DEFAULT_CONFIG, ...stored };
  return isRates(merged.rates) ? merged : DEFAULT_CONFIG;
}

export const saveConfig = (cfg: EmomConfig) => write(KEYS.config, cfg);

export const loadLog = (): LoggedSession[] => read<LoggedSession[]>(KEYS.log) ?? [];
export const saveLog = (log: LoggedSession[]) => write(KEYS.log, log);

export function loadLive(): LiveSnapshot | null {
  const snap = read<LiveSnapshot>(KEYS.live);
  return snap && isRates(snap.cfg?.rates) && Array.isArray(snap.phases) && snap.phases.length > 0 ? snap : null;
}
export const saveLive = (snap: LiveSnapshot | null) => write(KEYS.live, snap);

export function monthTotal(log: LoggedSession[], now: Date): number {
  const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  return log.filter((s) => s.date.startsWith(prefix)).reduce((total, s) => total + s.reps, 0);
}
