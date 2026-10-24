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

/** A reps-per-minute change made mid-session. It holds from (block, minute) until the next change. */
export interface PaceChange {
  block: number;
  minute: number;
  rate: number;
}

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

const paceBefore = (p: PaceChange, block: number, minute: number) =>
  p.block < block || (p.block === block && p.minute <= minute);

/** Effective reps per minute at (block, minute): the latest pace change at or before it, else the configured rate. */
export function paceAt(cfg: EmomConfig, paces: PaceChange[], block: number, minute: number): number {
  let rate = rateFor(cfg, block);
  for (const p of paces) if (paceBefore(p, block, minute)) rate = p.rate;
  return rate;
}

export const setPace = (paces: PaceChange[], change: PaceChange): PaceChange[] => {
  const last = paces[paces.length - 1];
  const same = last && last.block === change.block && last.minute === change.minute;
  return [...(same ? paces.slice(0, -1) : paces), { ...change, rate: clampField('rate', change.rate) }];
};

export const repsAt = (cfg: EmomConfig, adj: Adjustments, paces: PaceChange[], block: number, minute: number) =>
  Math.max(0, paceAt(cfg, paces, block, minute) + (adj[minuteKey(block, minute)] ?? 0));

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

export function tally(cfg: EmomConfig, phases: Phase[], adj: Adjustments, paces: PaceChange[], vt: number): Tally {
  let done = 0;
  let plan = 0;
  for (const phase of phases) {
    const minutes = minutesDone(phase, vt, cfg.flashSec);
    for (let m = 0; m < minutes; m++) {
      done += repsAt(cfg, adj, paces, phase.block, m);
      plan += rateFor(cfg, phase.block);
    }
  }
  return { done, plan };
}

export function extensionPhase(cfg: EmomConfig, phases: Phase[], adj: Adjustments, paces: PaceChange[]): Phase | null {
  if (!cfg.goal) return null;
  const end = totalSeconds(phases);
  const deficit = cfg.goal - tally(cfg, phases, adj, paces, end).done;
  if (deficit <= 0) return null;
  const block = Math.max(...phases.filter((p) => p.type === 'work').map((p) => p.block)) + 1;
  return { type: 'work', start: end, dur: Math.ceil(deficit / lastRate(cfg)) * 60, block, extra: true };
}

/** True in the last minute of the last phase when no goal extension will follow it. */
export function isFinalMinute(cfg: EmomConfig, phases: Phase[], adj: Adjustments, paces: PaceChange[], loc: Located): boolean {
  const { phase, local, index } = loc;
  if (index !== phases.length - 1 || phase.type !== 'work') return false;
  if (Math.floor(local / 60) !== phaseMinutes(phase) - 1) return false;
  return extensionPhase(cfg, phases, adj, paces) === null;
}

export interface BlockSummary {
  label: string;
  /** Configured reps per minute for the block. */
  rate: number;
  /** Paces actually run in the block, in order, consecutive repeats collapsed. */
  paces: number[];
  minutes: number;
  reps: number;
  /** Minutes below the pace in force, i.e. skipped minutes. */
  shortMinutes: number;
}

export function blockSummaries(
  cfg: EmomConfig,
  phases: Phase[],
  adj: Adjustments,
  paces: PaceChange[],
  vt: number,
): BlockSummary[] {
  return phases
    .filter((phase) => phase.type === 'work')
    .map((phase) => {
      const minutes = minutesDone(phase, vt, cfg.flashSec);
      const rate = rateFor(cfg, phase.block);
      const run: number[] = [];
      let reps = 0;
      let shortMinutes = 0;
      for (let m = 0; m < minutes; m++) {
        const pace = paceAt(cfg, paces, phase.block, m);
        const r = repsAt(cfg, adj, paces, phase.block, m);
        reps += r;
        if (r < pace) shortMinutes++;
        if (run[run.length - 1] !== pace) run.push(pace);
      }
      return { label: phase.extra ? 'Extra' : `Block ${phase.block + 1}`, rate, paces: run, minutes, reps, shortMinutes };
    })
    .filter((row) => row.minutes > 0);
}

/** "5/min" when the block ran at plan, "5 → 3/min" when it was paced away from it. */
export const formatPace = (block: Pick<BlockSummary, 'rate' | 'paces'>) => {
  const steps = block.paces[0] === block.rate ? block.paces.slice(1) : block.paces;
  return `${[block.rate, ...steps].join(' → ')}/min`;
};

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

/** The paces run across the whole session in the table's format, so the log line and the table agree. */
export function sessionPace(cfg: EmomConfig, blocks: BlockSummary[]): string {
  const run = blocks.flatMap((b) => b.paces).filter((pace, i, all) => i === 0 || pace !== all[i - 1]);
  return formatPace({ rate: blocks[0]?.rate ?? cfg.rates[0], paces: run.length ? run : [cfg.rates[0]] });
}

/** A row for the War Room table. `n` is the session's number in the training log. */
export function warRoomLogLine(cfg: EmomConfig, blocks: BlockSummary[], done: number, secs: number, date: Date, n: number): string {
  const label = date.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' });
  const parts = blocks.map((b) => `\`${b.reps}\`/${b.minutes}min`).join(' → stop → ');
  return `| ${n} | **${label}** | **\`${formatReps(done)}\`** | ${parts} | EMOM \`${sessionPace(cfg, blocks)}\`, FIT \`${formatClock(secs, true)}\` |`;
}
