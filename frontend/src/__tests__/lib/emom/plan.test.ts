import {
  COUNT_IN_SEC,
  DEFAULT_CONFIG,
  EmomConfig,
  PRESETS,
  blockSummaries,
  buildPhases,
  durationMinutes,
  extensionPhase,
  extraMinutes,
  formatClock,
  minuteKey,
  planReps,
  sessionGoal,
  setPlanField,
  tally,
  totalSeconds,
  warRoomLogLine,
} from '@/lib/emom/plan';

const fromPreset = (id: string): EmomConfig => {
  const preset = PRESETS.find((p) => p.id === id)!;
  return { ...DEFAULT_CONFIG, ...preset, rates: [...preset.rates] };
};

describe('emom plan', () => {
  it('plans the Half-Beast as four 50-minute blocks with 10-minute stops', () => {
    const cfg = fromPreset('half-beast');
    expect(planReps(cfg)).toBe(1000);
    expect(durationMinutes(cfg)).toBe(230);
    expect(buildPhases(cfg).map((p) => p.type)).toEqual(['count', 'work', 'break', 'work', 'break', 'work', 'break', 'work']);
  });

  it('extends The Beast at the slower pace until it reaches 2,000', () => {
    const cfg = fromPreset('beast');
    expect(planReps(cfg)).toBe(1900);
    expect(extraMinutes(cfg)).toBe(25);
    expect(sessionGoal(cfg)).toBe(2000);
    expect(durationMinutes(cfg)).toBe(505);

    const phases = buildPhases(cfg);
    const last = phases[phases.length - 1];
    expect(last).toMatchObject({ type: 'work', extra: true, dur: 25 * 60, block: 8 });
    expect(phases[phases.length - 2].type).toBe('break');
    expect(tally(cfg, phases, {}, totalSeconds(phases)).done).toBe(2000);
  });

  it('sets every block from the main rate and grows blocks at the last rate', () => {
    const cfg = { ...DEFAULT_CONFIG, rates: [5, 4] };
    expect(setPlanField(cfg, 'rate', 6).rates).toEqual([6, 6]);
    expect(setPlanField(cfg, 'blocks', 4).rates).toEqual([5, 4, 4, 4]);
    expect(setPlanField(cfg, 'blocks', 1).rates).toEqual([5]);
    expect(setPlanField(cfg, 'workMin', 999).workMin).toBe(120);
    expect(setPlanField(cfg, 'breakMin', -3).breakMin).toBe(0);
  });

  it('counts a minute once its signal window has passed', () => {
    const cfg = { ...DEFAULT_CONFIG, rates: [5], workMin: 10, flashSec: 10 };
    const phases = buildPhases(cfg);
    const minuteThree = COUNT_IN_SEC + 2 * 60;
    expect(tally(cfg, phases, {}, minuteThree + 5)).toEqual({ done: 10, plan: 10 });
    expect(tally(cfg, phases, {}, minuteThree + 10)).toEqual({ done: 15, plan: 15 });
  });

  it('keeps the plan when a minute comes up short', () => {
    const cfg = { ...DEFAULT_CONFIG, rates: [5], workMin: 10 };
    const phases = buildPhases(cfg);
    const adj = { [minuteKey(0, 0)]: -2 };
    expect(tally(cfg, phases, adj, totalSeconds(phases))).toEqual({ done: 48, plan: 50 });
  });

  it('adds extra minutes only in reach-goal mode when reps fall short', () => {
    const plan = { ...DEFAULT_CONFIG, rates: [5], workMin: 10, goal: 0 };
    const goal = { ...plan, goal: 50 };
    const adj = { [minuteKey(0, 3)]: -4 };
    expect(extensionPhase(plan, buildPhases(plan), adj)).toBeNull();
    expect(extensionPhase(goal, buildPhases(goal), {})).toBeNull();

    const ext = extensionPhase(goal, buildPhases(goal), adj);
    expect(ext).toMatchObject({ type: 'work', extra: true, dur: 60, block: 1 });
  });

  it('summarises blocks and writes a War Room log line', () => {
    const cfg = { ...DEFAULT_CONFIG, rates: [5, 4], workMin: 10, breakMin: 2 };
    const phases = buildPhases(cfg);
    const adj = { [minuteKey(1, 0)]: -1 };
    const secs = totalSeconds(phases);
    const blocks = blockSummaries(cfg, phases, adj, secs);

    expect(blocks).toEqual([
      { label: 'Block 1', rate: 5, minutes: 10, reps: 50, shortMinutes: 0 },
      { label: 'Block 2', rate: 4, minutes: 10, reps: 39, shortMinutes: 1 },
    ]);
    const line = warRoomLogLine(cfg, blocks, 89, secs, new Date('2026-10-11T07:00:00'));
    expect(line).toContain('**`89`**');
    expect(line).toContain('`50`/10min → stop → `39`/10min');
    expect(line).toContain('EMOM `5→4/min`');
  });

  it('formats clocks with and without hours', () => {
    expect(formatClock(42)).toBe('0:42');
    expect(formatClock(3725)).toBe('1:02:05');
    expect(formatClock(59, true)).toBe('0:00:59');
  });
});
