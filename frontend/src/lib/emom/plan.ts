export type FlashMode = 'full' | 'panel';
export type FlashColor = 'green' | 'red';

export interface EmomConfig {
  workMin: number;
  breakMin: number;
  rates: number[];
  goal: number;
  flashSec: number;
  mode: FlashMode;
  color: FlashColor;
  sound: boolean;
}

export type PlanField = 'rate' | 'blocks' | 'workMin' | 'breakMin' | 'flashSec' | 'goal';

export interface Preset {
  id: string;
  name: string;
  workMin: number;
  breakMin: number;
  rates: number[];
  goal: number;
}

export type PhaseType = 'count' | 'work' | 'break';

export interface Phase {
  type: PhaseType;
  start: number;
  dur: number;
  block: number;
  extra?: boolean;
}

export interface Located {
  index: number;
  phase: Phase;
  local: number;
}

export type Adjustments = Record<string, number>;

export const COUNT_IN_SEC = 10;
export const MONTH_GOAL = 2000;

export const LIMITS: Record<PlanField, [number, number]> = {
  rate: [1, 30],
  blocks: [1, 12],
  workMin: [1, 120],
  breakMin: [0, 30],
  flashSec: [1, 30],
  goal: [0, 10000],
};

export const PRESETS: Preset[] = [
  { id: 'beast-prep', name: 'Beast prep', workMin: 50, breakMin: 10, rates: [5, 5, 5], goal: 0 },
  { id: 'half-beast', name: 'Half-Beast', workMin: 50, breakMin: 10, rates: [5, 5, 5, 5], goal: 0 },
  { id: 'beast', name: 'The Beast · 8h', workMin: 50, breakMin: 10, rates: [5, 5, 5, 5, 5, 5, 4, 4], goal: 2000 },
  { id: 'grease', name: 'Weekday grease', workMin: 10, breakMin: 0, rates: [5], goal: 0 },
];

export const DEFAULT_CONFIG: EmomConfig = {
  workMin: 50,
  breakMin: 10,
  rates: [5, 5, 5, 5],
  goal: 0,
  flashSec: 10,
  mode: 'full',
  color: 'green',
  sound: true,
};

const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

export const clampField = (field: PlanField, value: number): number => {
  const [min, max] = LIMITS[field];
  return Math.min(max, Math.max(min, Math.round(Number.isFinite(value) ? value : min)));
};

export const lastRate = (cfg: EmomConfig) => cfg.rates[cfg.rates.length - 1];
export const rateFor = (cfg: EmomConfig, block: number) => cfg.rates[block] ?? lastRate(cfg);
export const planReps = (cfg: Pick<EmomConfig, 'rates' | 'workMin'>) => sum(cfg.rates) * cfg.workMin;
export const isSlowBlock = (cfg: EmomConfig, block: number) => rateFor(cfg, block) < Math.max(...cfg.rates);

export const extraMinutes = (cfg: EmomConfig) => {
  const planned = planReps(cfg);
  return cfg.goal > planned ? Math.ceil((cfg.goal - planned) / lastRate(cfg)) : 0;
};

export const sessionGoal = (cfg: Pick<EmomConfig, 'rates' | 'workMin' | 'goal'>) =>
  Math.max(cfg.goal || 0, planReps(cfg));

export const durationMinutes = (cfg: EmomConfig) => {
  const blocks = cfg.rates.length;
  const extra = extraMinutes(cfg);
  return blocks * cfg.workMin + (blocks - 1) * cfg.breakMin + (extra ? cfg.breakMin + extra : 0);
};

export const matchesPreset = (cfg: EmomConfig, preset: Preset) =>
  preset.workMin === cfg.workMin &&
  preset.breakMin === cfg.breakMin &&
  preset.goal === cfg.goal &&
  preset.rates.join() === cfg.rates.join();

export function setPlanField(cfg: EmomConfig, field: PlanField, value: number): EmomConfig {
  const next = clampField(field, value);
  if (field === 'rate') return { ...cfg, rates: cfg.rates.map(() => next) };
  if (field === 'blocks') {
    return { ...cfg, rates: Array.from({ length: next }, (_, i) => cfg.rates[i] ?? lastRate(cfg)) };
  }
  return { ...cfg, [field]: next };
}

export const planFieldValue = (cfg: EmomConfig, field: PlanField) =>
  field === 'rate' ? cfg.rates[0] : field === 'blocks' ? cfg.rates.length : cfg[field];

export function buildPhases(cfg: EmomConfig): Phase[] {
  const shapes: Omit<Phase, 'start'>[] = [{ type: 'count', dur: COUNT_IN_SEC, block: 0 }];
  cfg.rates.forEach((_, block) => {
    shapes.push({ type: 'work', dur: cfg.workMin * 60, block });
    if (block < cfg.rates.length - 1 && cfg.breakMin > 0) {
      shapes.push({ type: 'break', dur: cfg.breakMin * 60, block });
    }
  });
  const extra = extraMinutes(cfg);
  if (extra) {
    if (cfg.breakMin > 0) shapes.push({ type: 'break', dur: cfg.breakMin * 60, block: cfg.rates.length - 1 });
    shapes.push({ type: 'work', dur: extra * 60, block: cfg.rates.length, extra: true });
  }
  let start = 0;
  return shapes.map((shape) => {
    const phase = { ...shape, start };
    start += shape.dur;
    return phase;
  });
}

export const totalSeconds = (phases: Phase[]) => {
  const last = phases[phases.length - 1];
  return last.start + last.dur;
};

export const phaseMinutes = (phase: Phase) => phase.dur / 60;

export function locate(phases: Phase[], vt: number): Located | null {
  for (let index = 0; index < phases.length; index++) {
    const phase = phases[index];
    if (vt < phase.start + phase.dur) return { index, phase, local: vt - phase.start };
  }
  return null;
}

export const minuteKey = (block: number, minute: number) => `${block}-${minute}`;

export const repsAt = (cfg: EmomConfig, adj: Adjustments, block: number, minute: number) =>
  Math.max(0, rateFor(cfg, block) + (adj[minuteKey(block, minute)] ?? 0));

export function minutesDone(phase: Phase, vt: number, flashSec: number): number {
  if (phase.type !== 'work' || vt <= phase.start) return 0;
  if (vt >= phase.start + phase.dur) return phaseMinutes(phase);
  const local = vt - phase.start;
  return Math.floor(local / 60) + (local % 60 >= flashSec ? 1 : 0);
}

export interface Tally {
  done: number;
  plan: number;
}

export function tally(cfg: EmomConfig, phases: Phase[], adj: Adjustments, vt: number): Tally {
  let done = 0;
  let plan = 0;
  for (const phase of phases) {
    const minutes = minutesDone(phase, vt, cfg.flashSec);
    for (let m = 0; m < minutes; m++) {
      done += repsAt(cfg, adj, phase.block, m);
      plan += rateFor(cfg, phase.block);
    }
  }
  return { done, plan };
}

export function extensionPhase(cfg: EmomConfig, phases: Phase[], adj: Adjustments): Phase | null {
  if (!cfg.goal) return null;
  const end = totalSeconds(phases);
  const deficit = cfg.goal - tally(cfg, phases, adj, end).done;
  if (deficit <= 0) return null;
  const block = Math.max(...phases.filter((p) => p.type === 'work').map((p) => p.block)) + 1;
  return { type: 'work', start: end, dur: Math.ceil(deficit / lastRate(cfg)) * 60, block, extra: true };
}

export interface BlockSummary {
  label: string;
  rate: number;
  minutes: number;
  reps: number;
  shortMinutes: number;
}

export function blockSummaries(cfg: EmomConfig, phases: Phase[], adj: Adjustments, vt: number): BlockSummary[] {
  return phases
    .filter((phase) => phase.type === 'work')
    .map((phase) => {
      const minutes = minutesDone(phase, vt, cfg.flashSec);
      const rate = rateFor(cfg, phase.block);
      let reps = 0;
      let shortMinutes = 0;
      for (let m = 0; m < minutes; m++) {
        const r = repsAt(cfg, adj, phase.block, m);
        reps += r;
        if (r < rate) shortMinutes++;
      }
      return { label: phase.extra ? 'Extra' : `Block ${phase.block + 1}`, rate, minutes, reps, shortMinutes };
    })
    .filter((row) => row.minutes > 0);
}

const pad = (n: number) => String(n).padStart(2, '0');

export function formatClock(totalSec: number, withHours = false): string {
  const s = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return withHours || h ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}

export const formatHoursMinutes = (minutes: number) => `${Math.floor(minutes / 60)}:${pad(minutes % 60)}`;

export const formatReps = (n: number) => n.toLocaleString('en-AU');

export const localDateKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export function warRoomLogLine(cfg: EmomConfig, blocks: BlockSummary[], done: number, secs: number, date: Date): string {
  const label = date.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' });
  const distinct = new Set(cfg.rates);
  const pace = distinct.size > 1 ? `${Math.max(...cfg.rates)}→${Math.min(...cfg.rates)}/min` : `${cfg.rates[0]}/min`;
  const parts = blocks.map((b) => `\`${b.reps}\`/${b.minutes}min`).join(' → stop → ');
  return `| # | **${label}** | **\`${formatReps(done)}\`** | ${parts} | EMOM \`${pace}\`, FIT \`${formatClock(secs, true)}\` |`;
}
