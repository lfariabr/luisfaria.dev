'use client';

import { useSyncExternalStore } from 'react';

const KEY = 'places.amountsHidden';
const listeners = new Set<() => void>();
// Used only when storage is blocked (private mode, disabled site data), so the toggle still works for the visit.
let fallback = false;

const read = () => {
  try {
    const stored = window.localStorage.getItem(KEY);
    return stored === null ? fallback : stored === '1';
  } catch {
    return fallback;
  }
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  // Another tab flipping the toggle updates this one too.
  window.addEventListener('storage', listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', listener);
  };
};

const setAmountsHidden = (hidden: boolean) => {
  try {
    window.localStorage.setItem(KEY, hidden ? '1' : '0');
  } catch {
    fallback = hidden;
  }
  listeners.forEach((listener) => listener());
};

/** Bank-app style: hide every amount on the Places page, remembered per device. Shown by default. */
export function useAmountsHidden() {
  const hidden = useSyncExternalStore(subscribe, read, () => false);
  return [hidden, () => setAmountsHidden(!hidden)] as const;
}
