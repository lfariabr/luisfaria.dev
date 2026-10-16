'use client';

import { useEffect } from 'react';

const cancel = (event: Event) => event.preventDefault();

// Two fingers moving is a pinch; one finger is a scroll and must stay untouched.
const cancelPinchMove = (event: Event) => {
  if ((event as TouchEvent).touches.length > 1) event.preventDefault();
};

const LISTENERS: [string, (event: Event) => void][] = [
  ['gesturestart', cancel],
  ['gesturechange', cancel],
  ['touchmove', cancelPinchMove],
];

// WebKit treats touch listeners on the document as passive by default, which silently
// ignores preventDefault. Asking for passive: false is what lets the cancel take effect.
const OPTIONS: AddEventListenerOptions = { passive: false };

/**
 * Stops the browser zooming the whole page on a pinch, for pages built around a map: a pinch
 * that starts with a finger off the map zooms the page, not the map, and is hard to undo.
 *
 * iOS Safari ignores `maximum-scale` and `user-scalable=no` in the viewport, so this cancels
 * its gesture events and any two-finger move. preventDefault stops only the browser's own
 * zoom: Google Maps still receives the touches and zooms the map. Other browsers also get
 * the page's `viewport` export.
 */
export function usePreventPagePinchZoom() {
  useEffect(() => {
    for (const [type, listener] of LISTENERS) document.addEventListener(type, listener, OPTIONS);
    return () => {
      for (const [type, listener] of LISTENERS) document.removeEventListener(type, listener, OPTIONS);
    };
  }, []);
}
