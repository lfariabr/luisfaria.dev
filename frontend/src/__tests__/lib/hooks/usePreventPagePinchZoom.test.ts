import { renderHook } from '@testing-library/react';
import { usePreventPagePinchZoom } from '@/lib/hooks/usePreventPagePinchZoom';
import { viewport } from '@/app/places/page';

// iOS Safari's pinch-to-zoom starts with a non-standard gesturestart event on the document.
const pinch = () => {
  const event = new Event('gesturestart', { cancelable: true });
  document.dispatchEvent(event);
  return event;
};

describe('usePreventPagePinchZoom', () => {
  it('cancels page pinch zoom while mounted', () => {
    renderHook(() => usePreventPagePinchZoom());

    expect(pinch().defaultPrevented).toBe(true);
  });

  it('leaves pinch zoom alone after unmount', () => {
    const { unmount } = renderHook(() => usePreventPagePinchZoom());
    unmount();

    expect(pinch().defaultPrevented).toBe(false);
  });
});

const touchMove = (fingers: number) => {
  const event = new Event('touchmove', { cancelable: true });
  Object.defineProperty(event, 'touches', { value: { length: fingers } });
  document.dispatchEvent(event);
  return event;
};

describe('usePreventPagePinchZoom on iOS', () => {
  it('registers non-passive listeners, since WebKit makes document touch listeners passive by default', () => {
    const add = jest.spyOn(document, 'addEventListener');
    renderHook(() => usePreventPagePinchZoom());

    for (const type of ['gesturestart', 'gesturechange', 'touchmove']) {
      expect(add).toHaveBeenCalledWith(type, expect.any(Function), { passive: false });
    }
    add.mockRestore();
  });

  it('cancels a two-finger move but leaves one-finger scrolling alone', () => {
    renderHook(() => usePreventPagePinchZoom());

    expect(touchMove(2).defaultPrevented).toBe(true);
    expect(touchMove(1).defaultPrevented).toBe(false);
  });

  it('cancels gesturechange as well as gesturestart', () => {
    renderHook(() => usePreventPagePinchZoom());
    const change = new Event('gesturechange', { cancelable: true });
    document.dispatchEvent(change);

    expect(change.defaultPrevented).toBe(true);
  });

  it('removes every listener on unmount', () => {
    const { unmount } = renderHook(() => usePreventPagePinchZoom());
    unmount();

    expect(touchMove(2).defaultPrevented).toBe(false);
  });
});

describe('/places viewport', () => {
  it('caps page zoom at 1 for browsers that honour the viewport', () => {
    expect(viewport).toMatchObject({ initialScale: 1, maximumScale: 1, userScalable: false });
  });
});
