'use client';

import { useEffect, useState } from 'react';

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

type Options = {
  /** Index rendered on first paint (SSR) and kept when motion is reduced. */
  start?: number;
  /** Time between frames (dwell + fade). Defaults to 2600 + 350. */
  intervalMs?: number;
};

/**
 * Cycles through `length` frames, returning the active index plus whether the
 * timer is actually running. SSR and the first client render both return
 * `start` with `isRotating: false`, so there is no hydration mismatch and the
 * progress indicator never animates when motion is reduced.
 */
export function useRotatingText(length: number, { start = 0, intervalMs = 2950 }: Options = {}) {
  const [index, setIndex] = useState(start);
  const [isRotating, setIsRotating] = useState(false);

  useEffect(() => {
    if (length <= 1 || typeof window === 'undefined') return;
    if (window.matchMedia(REDUCED_MOTION).matches) return;

    setIsRotating(true);
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % length);
    }, intervalMs);

    return () => {
      window.clearInterval(id);
      setIsRotating(false);
    };
  }, [length, intervalMs]);

  return { index, isRotating };
}
