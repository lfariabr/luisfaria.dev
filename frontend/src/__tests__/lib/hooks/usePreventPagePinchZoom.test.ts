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

describe('/places viewport', () => {
  it('caps page zoom at 1 for browsers that honour the viewport', () => {
    expect(viewport).toMatchObject({ initialScale: 1, maximumScale: 1, userScalable: false });
  });
});
