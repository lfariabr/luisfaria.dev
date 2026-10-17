import React, { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { useAutoGrow } from '@/lib/hooks/useAutoGrow';

function Notes() {
  const [value, setValue] = useState('');
  const ref = useAutoGrow<HTMLTextAreaElement>(value);
  return <textarea aria-label="Notes" ref={ref} value={value} onChange={(event) => setValue(event.target.value)} />;
}

// jsdom lays nothing out, so the content height is faked.
const contentHeight = (px: number) =>
  jest.spyOn(HTMLTextAreaElement.prototype, 'scrollHeight', 'get').mockReturnValue(px);

const supportsFieldSizing = (supported: boolean) => {
  Object.defineProperty(window, 'CSS', { value: { supports: () => supported }, configurable: true });
};

afterEach(() => jest.restoreAllMocks());

describe('useAutoGrow', () => {
  it('sizes the box to its content where CSS field-sizing is missing', () => {
    supportsFieldSizing(false);
    contentHeight(96);
    render(<Notes />);

    fireEvent.change(screen.getByLabelText('Notes'), { target: { value: 'one\ntwo\nthree\nfour' } });

    expect(screen.getByLabelText('Notes').style.height).toBe('96px');
  });

  it('leaves sizing to CSS where field-sizing works', () => {
    supportsFieldSizing(true);
    contentHeight(96);
    render(<Notes />);

    fireEvent.change(screen.getByLabelText('Notes'), { target: { value: 'one\ntwo\nthree\nfour' } });

    expect(screen.getByLabelText('Notes').style.height).toBe('');
  });
});
