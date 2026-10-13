import type { FlashColor } from '@/lib/emom/plan';

export interface SignalStyle {
  fill: string;
  ink: string;
  text: string;
  soft: string;
  /** Lighter tints for minutes paced below plan: one step per rep under, capped at three. */
  paced: [string, string, string];
}

export const SIGNAL: Record<FlashColor, SignalStyle> = {
  green: {
    fill: 'bg-green-600 dark:bg-green-500',
    ink: 'text-white dark:text-green-950',
    text: 'text-green-700 dark:text-green-400',
    soft: 'bg-green-600/70 dark:bg-green-500/60',
    paced: ['bg-green-600/50 dark:bg-green-500/45', 'bg-green-600/35 dark:bg-green-500/30', 'bg-green-600/20 dark:bg-green-500/18'],
  },
  red: {
    fill: 'bg-red-600 dark:bg-red-500',
    ink: 'text-white dark:text-red-950',
    text: 'text-red-600 dark:text-red-400',
    soft: 'bg-red-600/70 dark:bg-red-500/60',
    paced: ['bg-red-600/50 dark:bg-red-500/45', 'bg-red-600/35 dark:bg-red-500/30', 'bg-red-600/20 dark:bg-red-500/18'],
  },
};

export const REST_TEXT = 'text-blue-600 dark:text-blue-400';
export const WARN_TEXT = 'text-amber-600 dark:text-amber-400';
