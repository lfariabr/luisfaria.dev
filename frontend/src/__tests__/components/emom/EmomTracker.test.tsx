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

    fireEvent.click(screen.getByRole('button', { name: 'One rep fewer this minute' }));
    expect(screen.getByTestId('emom-this-minute')).toHaveTextContent('4');
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

  it('offers to resume an unfinished session, paused', () => {
    const cfg = { ...DEFAULT_CONFIG, rates: [5, 5] };
    window.localStorage.setItem(
      'emom:live',
      JSON.stringify({ cfg, phases: buildPhases(cfg), vt: 10 + 120 + 15, adj: {}, startedAt: '2026-10-11T06:00:00.000Z' }),
    );
    render(<EmomTracker />);

    expect(screen.getByText(/15 reps/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Resume, paused' }));

    expect(screen.getByText('Paused')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Resume' })).toBeInTheDocument();
    advance(5_000);
    expect(screen.getByRole('timer')).toHaveTextContent('0:45');
  });
});
