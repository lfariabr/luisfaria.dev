export type ClientEventPayload = Record<string, unknown>;

export function trackClientEvent(eventName: string, payload?: ClientEventPayload): void {
  try {
    if (typeof window === 'undefined') return;
    const w = window as unknown as {
      gtag?: (...args: any[]) => void;
    };

    if (typeof w.gtag === 'function') {
      // GA4 recommended signature: gtag('event', <name>, <params>)
      w.gtag('event', eventName, payload ?? {});
      return;
    }

    // Fallback for local dev/testing visibility
    // eslint-disable-next-line no-console
    console.log('[client-event]', eventName, payload ?? {});
  } catch {
    // never throw from analytics
  }
}
