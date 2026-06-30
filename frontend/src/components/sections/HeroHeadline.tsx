'use client';

import { cn } from '@/lib/utils';
import { useRotatingText } from '@/lib/hooks/useRotatingText';
import {
  HERO_CANONICAL_INDEX,
  HERO_CANONICAL_PHRASE,
  HERO_FRAMES,
  POSITIONING,
} from '@/content/profile';

/** Time the active frame dwells before the next swap (must match the fill duration). */
const ROTATE_MS = 2950;

/** Each frame fades in/out by index — overlapping grid cells avoid any layout shift. */
const frameOpacity = (active: boolean) =>
  cn('transition-opacity duration-[350ms]', active ? 'opacity-100' : 'opacity-0');

export function HeroHeadline() {
  const { index, isRotating } = useRotatingText(HERO_FRAMES.length, {
    start: HERO_CANONICAL_INDEX,
    intervalMs: ROTATE_MS,
  });

  return (
    <>
      {/* Lens pill + rotation-timer bar — decorative; signals when the headline will swap. */}
      <div aria-hidden="true" className="flex flex-col items-center gap-2.5">
        <span className="grid">
          {HERO_FRAMES.map((frame, i) => (
            <span
              key={frame.lens}
              style={{ gridArea: '1 / 1' }}
              className={cn(
                'inline-flex items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400',
                frameOpacity(i === index),
              )}
            >
              {frame.lens}
            </span>
          ))}
        </span>

        {/* Fills left→right over one interval; re-keyed each frame so it restarts. */}
        {isRotating && (
          <span className="block h-0.5 w-12 overflow-hidden rounded-full bg-emerald-500/15">
            <span
              key={index}
              style={{ animation: `hero-progress ${ROTATE_MS}ms linear` }}
              className="block h-full w-full origin-left rounded-full bg-emerald-500/70"
            />
          </span>
        )}
      </div>

      <div className="space-y-4 sm:space-y-6">
        <h1 className="text-3xl font-extrabold tracking-tight leading-tight sm:text-5xl lg:text-6xl">
          {/* Accessible + SEO: the static, server-rendered canonical phrase. */}
          <span className="sr-only">{HERO_CANONICAL_PHRASE}</span>

          {/* Decorative visual layer — the anchor plus the crossfading green clause. */}
          <span aria-hidden="true">
            <span className="block">I build systems</span>
            <span className="grid">
              {HERO_FRAMES.map((frame, i) => (
                <span
                  key={frame.clause}
                  style={{ gridArea: '1 / 1' }}
                  className={cn(
                    'bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent',
                    frameOpacity(i === index),
                  )}
                >
                  {frame.clause}
                </span>
              ))}
            </span>
          </span>
        </h1>

        <p className="mx-auto max-w-[720px] text-base text-muted-foreground sm:text-lg">
          {POSITIONING.subline}
        </p>
      </div>
    </>
  );
}
