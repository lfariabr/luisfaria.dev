'use client';

import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

/** False during SSR and hydration, true on the client afterwards — without a setState-in-effect. */
export function useIsClient() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}
