'use client';

import { useEffect, useState } from 'react';

export interface KeyboardInset {
  /** How far iOS has scrolled the visible area down the page to show a focused field. */
  top: number;
  /** How much of the page bottom the on-screen keyboard covers. */
  bottom: number;
}

const NONE: KeyboardInset = { top: 0, bottom: 0 };

const measure = (viewport: VisualViewport): KeyboardInset => ({
  top: Math.max(0, Math.round(viewport.offsetTop)),
  bottom: Math.max(0, Math.round(window.innerHeight - viewport.height - viewport.offsetTop)),
});

/**
 * The part of a fixed, full-height sheet that is actually visible while the keyboard is open.
 *
 * iOS Safari keeps the layout viewport full height when the keyboard opens: a fixed sheet's
 * footer ends up behind the keyboard, and when iOS scrolls the visible area to reach a field
 * the header slides off the top. Insetting the sheet by these two numbers keeps both in view.
 * Android Chrome resizes the page itself (see `interactiveWidget` on /places), so both stay 0.
 */
export function useKeyboardInset(): KeyboardInset {
  const [inset, setInset] = useState(NONE);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const update = () => setInset(measure(viewport));
    update();
    viewport.addEventListener('resize', update);
    viewport.addEventListener('scroll', update);
    return () => {
      viewport.removeEventListener('resize', update);
      viewport.removeEventListener('scroll', update);
    };
  }, []);

  return inset;
}
