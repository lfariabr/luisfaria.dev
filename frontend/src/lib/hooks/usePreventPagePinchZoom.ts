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
 * iOS Safari ignores `maximum-scale` and `user-scalable=no` in the viewport. `touch-action:
 * pan-x pan-y` on the root tells it never to start a page pinch, while one finger still scrolls.
 * The listeners stay as a fallback for older iOS, but they cannot stop a pinch that began as a
 * scroll: iOS makes that touch's moves uncancelable. Neither stops Google Maps, which handles
 * the touches itself and zooms the map. Other browsers also get the page's `viewport` export.
 */
export function usePreventPagePinchZoom() {
  useEffect(() => {
    const root = document.documentElement.style;
    const previousTouchAction = root.touchAction;
    root.touchAction = 'pan-x pan-y';
    for (const [type, listener] of LISTENERS) document.addEventListener(type, listener, OPTIONS);
    return () => {
      root.touchAction = previousTouchAction;
      for (const [type, listener] of LISTENERS) document.removeEventListener(type, listener, OPTIONS);
    };
  }, []);
}
