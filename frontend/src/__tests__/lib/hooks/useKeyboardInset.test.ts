import { act, renderHook } from '@testing-library/react';
import { useKeyboardInset } from '@/lib/hooks/useKeyboardInset';
import { viewport } from '@/app/places/page';

// jsdom has no visualViewport. This fakes the iOS shape: the layout viewport keeps its height
// when the keyboard opens, and the visible part shrinks and can scroll down inside it.
class FakeVisualViewport extends EventTarget {
  height = 800;
  offsetTop = 0;
}

let visualViewport: FakeVisualViewport;

const showKeyboard = (keyboard: number, scrolled = 0) =>
  act(() => {
    visualViewport.height = 800 - keyboard;
    visualViewport.offsetTop = scrolled;
    visualViewport.dispatchEvent(new Event('resize'));
  });

beforeEach(() => {
  visualViewport = new FakeVisualViewport();
  Object.defineProperty(window, 'visualViewport', { value: visualViewport, configurable: true });
  Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true });
});

describe('useKeyboardInset', () => {
  it('is zero with no keyboard', () => {
    const { result } = renderHook(() => useKeyboardInset());

    expect(result.current).toEqual({ top: 0, bottom: 0 });
  });

  it('reports the height the keyboard covers', () => {
    const { result } = renderHook(() => useKeyboardInset());
    showKeyboard(300);

    expect(result.current).toEqual({ top: 0, bottom: 300 });
  });

  it('follows the visible area when iOS scrolls it to show a field', () => {
    const { result } = renderHook(() => useKeyboardInset());
    showKeyboard(300, 120);

    expect(result.current).toEqual({ top: 120, bottom: 180 });
  });

  it('updates on visual viewport scroll as well as resize', () => {
    const { result } = renderHook(() => useKeyboardInset());
    showKeyboard(300);
    act(() => {
      visualViewport.offsetTop = 50;
      visualViewport.dispatchEvent(new Event('scroll'));
    });

    expect(result.current).toEqual({ top: 50, bottom: 250 });
  });

  it('stops listening on unmount', () => {
    const remove = jest.spyOn(visualViewport, 'removeEventListener');
    const { unmount } = renderHook(() => useKeyboardInset());
    unmount();

    expect(remove).toHaveBeenCalledWith('resize', expect.any(Function));
    expect(remove).toHaveBeenCalledWith('scroll', expect.any(Function));
  });

  it('is zero where the browser has no visualViewport', () => {
    Object.defineProperty(window, 'visualViewport', { value: null, configurable: true });
    const { result } = renderHook(() => useKeyboardInset());

    expect(result.current).toEqual({ top: 0, bottom: 0 });
  });
});

describe('places viewport', () => {
  it('lets Android Chrome resize the page for the keyboard, which iOS ignores', () => {
    expect(viewport.interactiveWidget).toBe('resizes-content');
  });
});
