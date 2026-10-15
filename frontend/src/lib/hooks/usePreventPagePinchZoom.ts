'use client';

import { useEffect } from 'react';

const cancel = (event: Event) => event.preventDefault();

/**
 * Stops the browser zooming the whole page on a pinch, for pages built around a map: a pinch
 * that starts with a finger off the map zooms the page, not the map, and is hard to undo.
 *
 * iOS Safari ignores `maximum-scale` and `user-scalable=no` in the viewport, but still lets a
 * page cancel its non-standard `gesturestart`. Google Maps reads raw touch events, so its own
 * pinch keeps working. Other browsers get the page's `viewport` export instead.
 */
export function usePreventPagePinchZoom() {
  useEffect(() => {
    document.addEventListener('gesturestart', cancel);
    return () => document.removeEventListener('gesturestart', cancel);
  }, []);
}
