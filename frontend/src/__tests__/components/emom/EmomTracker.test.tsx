import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { EmomTracker } from '@/components/emom/EmomTracker';
import { DEFAULT_CONFIG, buildPhases } from '@/lib/emom/plan';

const advance = (ms: number) =>
  act(() => {
    jest.advanceTimersByTime(ms);
  });

describe('EmomTracker', () => {
  beforeEach(() => {
    window.localStorage.clear();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-10-11T07:00:00'));
    window.scrollTo = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('updates the goal and duration when a preset is chosen', () => {
    render(<EmomTracker />);

    fireEvent.click(screen.getByRole('button', { name: /The Beast · 8h/ }));

    expect(screen.getByRole('button', { name: /The Beast · 8h/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Duration').parentElement).toHaveTextContent('8:25');
    expect(screen.getByText(/Adds 25 min at 4\/min to reach 2,000/)).toBeInTheDocument();
  });

  it('runs the count-in, shows a solid go signal, then hides it after the window', () => {
    render(<EmomTracker />);
    fireEvent.click(screen.getByRole('button', { name: 'Start session' }));

    expect(screen.getByText('Get on the bar')).toBeInTheDocument();

    advance(10_200);
    expect(screen.getByTestId('emom-overlay')).toBeInTheDocument();
    advance(1_000);
    expect(screen.getByTestId('emom-overlay')).toBeInTheDocument();

    advance(9_500);
    expect(screen.queryByTestId('emom-overlay')).not.toBeInTheDocument();
    expect(screen.getByTestId('emom-panel')).toHaveAttribute('data-state', 'idle');
  });

  it('logs a short minute and saves an ended-early session to the browser log', () => {
    render(<EmomTracker />);
    fireEvent.click(screen.getByRole('button', { name: 'Start session' }));
    advance(10_000 + 60_000 + 20_000);

    fireEvent.click(screen.getByRole('button', { name: /Pace down/ }));
    expect(screen.getByTestId('emom-pace')).toHaveTextContent('4');
    expect(screen.getByText('-1 vs plan')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'End' }));
    fireEvent.click(screen.getByRole('button', { name: 'Tap again to end' }));

    expect(screen.getByText('Saved · partial')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('9 pull-ups');

    const log = JSON.parse(window.localStorage.getItem('emom:log') ?? '[]');
    expect(log).toHaveLength(1);
    expect(log[0]).toMatchObject({ reps: 9, complete: false, label: 'Half-Beast', date: '2026-10-11' });
    expect(window.localStorage.getItem('emom:live')).toBeNull();
  });

  it('does not credit the minutes of a skipped work block', () => {
    render(<EmomTracker />);
    fireEvent.click(screen.getByRole('button', { name: 'Start session' }));
    advance(10_000 + 60_000 + 5_000);

    fireEvent.keyDown(document.body, { key: 'n' });
    expect(screen.getByText('Service stop', { selector: 'p' })).toBeInTheDocument();
    expect(screen.getByText('995 to go')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'End' }));
    fireEvent.click(screen.getByRole('button', { name: 'Tap again to end' }));
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('5 pull-ups');
  });

  it('keeps a lowered pace for the following minutes and blocks', () => {
    const cfg = { ...DEFAULT_CONFIG, rates: [5, 5], workMin: 2, breakMin: 1 };
    window.localStorage.setItem('emom:config', JSON.stringify(cfg));
    render(<EmomTracker />);
    fireEvent.click(screen.getByRole('button', { name: 'Start session' }));
    advance(10_000 + 20_000);

    fireEvent.click(screen.getByRole('button', { name: /Pace down/ }));
    fireEvent.click(screen.getByRole('button', { name: /Pace down/ }));
    expect(screen.getByTestId('emom-pace')).toHaveTextContent('3');
    expect(screen.getByText('plan 5 · -2')).toBeInTheDocument();

    advance(45_000);
    expect(screen.getByTestId('emom-pace')).toHaveTextContent('3');
    expect(screen.getByText('Go · 3 reps')).toBeInTheDocument();
    advance(10_000);
    expect(screen.getByText('-4 vs plan')).toBeInTheDocument();

    advance(60_000);
    expect(screen.getByText('Service stop', { selector: 'p' })).toBeInTheDocument();
    expect(screen.getByText(/Next: block 2 · 3\/min · 6 reps/)).toBeInTheDocument();
    expect(document.querySelectorAll('[data-state="paced"]')).toHaveLength(2);
    fireEvent.click(screen.getByRole('button', { name: /Pace up/ }));
    expect(screen.getByText('Pace · next block')).toBeInTheDocument();
    expect(screen.getByTestId('emom-pace')).toHaveTextContent('4');

    advance(50_000);
    expect(screen.getByText('Go · 4 reps')).toBeInTheDocument();

    const live = JSON.parse(window.localStorage.getItem('emom:live') ?? '{}');
    expect(live.paces).toEqual([
      { block: 0, minute: 0, rate: 3 },
      { block: 1, minute: 0, rate: 4 },
    ]);
  });

  it('says FINISH in the last minute, holds a DONE card, then opens the summary at the top', () => {
    const cfg = { ...DEFAULT_CONFIG, rates: [5], workMin: 2, breakMin: 0, sound: false };
    window.localStorage.setItem('emom:config', JSON.stringify(cfg));
    render(<EmomTracker />);
    fireEvent.click(screen.getByRole('button', { name: 'Start session' }));

    advance(10_000 + 57_500);
    expect(screen.getByText('Next minute')).toBeInTheDocument();

    advance(60_000);
    expect(screen.getByText('Finish')).toBeInTheDocument();
    expect(screen.queryByText('Next minute')).not.toBeInTheDocument();
    expect(screen.getByText(/^Last minute · 0:0\d left$/)).toBeInTheDocument();

    advance(3_000);
    expect(screen.getByTestId('emom-done')).toHaveTextContent('10 reps · 2:10');
    expect(screen.queryByRole('button', { name: 'End' })).not.toBeInTheDocument();
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });

    advance(1_500);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('10 pull-ups');
    expect(heading).toHaveFocus();
    expect(window.scrollTo).toHaveBeenCalledTimes(2);
  });

  it('skips the DONE card on tap', () => {
    const cfg = { ...DEFAULT_CONFIG, rates: [5], workMin: 1, breakMin: 0, sound: false };
    window.localStorage.setItem('emom:config', JSON.stringify(cfg));
    render(<EmomTracker />);
    fireEvent.click(screen.getByRole('button', { name: 'Start session' }));
    advance(10_000 + 60_500);

    fireEvent.click(screen.getByTestId('emom-done'));
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('5 pull-ups');
  });

  it('lays the summary stats out in three shrinkable cells', () => {
    render(<EmomTracker />);
    fireEvent.click(screen.getByRole('button', { name: 'Start session' }));
    advance(10_000 + 60_000 + 20_000);
    fireEvent.click(screen.getByRole('button', { name: 'End' }));
    fireEvent.click(screen.getByRole('button', { name: 'Tap again to end' }));

    expect(screen.queryByTestId('emom-done')).not.toBeInTheDocument();
    const stats = screen.getByText('Time', { selector: 'dt' }).closest('dl')!;
    expect(stats).toHaveClass('grid', 'grid-cols-3');
    expect(Array.from(stats.children).every((cell) => cell.classList.contains('min-w-0'))).toBe(true);
    expect(screen.getByText('Vs goal').nextElementSibling).toHaveClass('whitespace-nowrap');
    expect(screen.getByText('Vs goal').nextElementSibling).toHaveTextContent('−990');
  });

  it('offers to resume an unfinished session, paused', () => {
    const cfg = { ...DEFAULT_CONFIG, rates: [5, 5] };
    window.localStorage.setItem(
      'emom:live',
      JSON.stringify({
        cfg,
        phases: buildPhases(cfg),
        vt: 10 + 120 + 15,
        adj: {},
        paces: [{ block: 0, minute: 1, rate: 4 }],
        startedAt: '2026-10-11T06:00:00.000Z',
      }),
    );
    render(<EmomTracker />);

    expect(screen.getByText(/13 reps/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Resume, paused' }));

    expect(screen.getByText('Paused')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Resume' })).toBeInTheDocument();
    advance(5_000);
    expect(screen.getByRole('timer')).toHaveTextContent('0:45');
    expect(screen.getByTestId('emom-pace')).toHaveTextContent('4');
  });
});
