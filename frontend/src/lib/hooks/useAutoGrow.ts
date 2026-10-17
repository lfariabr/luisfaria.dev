'use client';

import { useLayoutEffect, useRef } from 'react';

const supportsFieldSizing = () => typeof CSS !== 'undefined' && CSS.supports?.('field-sizing', 'content') === true;

/**
 * Grows a textarea with its content. CSS `field-sizing: content` does this on its own; for
 * browsers without it, this sets the height to the content's after each change. The element's
 * own min-height and max-height still apply, and past the max it scrolls.
 */
export function useAutoGrow<T extends HTMLTextAreaElement>(value: string) {
  const ref = useRef<T>(null);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element || supportsFieldSizing()) return;
    element.style.height = 'auto';
    element.style.height = `${element.scrollHeight}px`;
  }, [value]);

  return ref;
}
