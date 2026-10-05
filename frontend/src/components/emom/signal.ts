import type { FlashColor } from '@/lib/emom/plan';

export interface SignalStyle {
  fill: string;
  ink: string;
  text: string;
  soft: string;
}

export const SIGNAL: Record<FlashColor, SignalStyle> = {
  green: {
    fill: 'bg-green-600 dark:bg-green-500',
    ink: 'text-white dark:text-green-950',
    text: 'text-green-700 dark:text-green-400',
    soft: 'bg-green-600/70 dark:bg-green-500/60',
  },
  red: {
    fill: 'bg-red-600 dark:bg-red-500',
    ink: 'text-white dark:text-red-950',
    text: 'text-red-600 dark:text-red-400',
    soft: 'bg-red-600/70 dark:bg-red-500/60',
  },
};

export const REST_TEXT = 'text-blue-600 dark:text-blue-400';
export const WARN_TEXT = 'text-amber-600 dark:text-amber-400';
