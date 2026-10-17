import React, { useState } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { ChipPicker } from '@/components/relationship/ChipPicker';

const OPTIONS = ['Eat out', 'Coffee', 'Drinks', 'Groceries', 'Activity', 'Visit', 'Gift'];

function Harness({ initial = '', options = OPTIONS, seeds }: { initial?: string; options?: string[]; seeds?: string[] }) {
  const [value, setValue] = useState(initial);
  return (
    <>
      <ChipPicker label="Category" name="category" options={options} seeds={seeds} value={value} onChange={setValue} />
      <output data-testid="value">{value}</output>
    </>
  );
}

const group = () => screen.getByRole('radiogroup', { name: 'Category' });
const chips = () => within(group()).getAllByRole('radio').map((chip) => chip.textContent);

describe('ChipPicker', () => {
  it('offers the 6 most used values, in the order given', () => {
    render(<Harness />);

    expect(chips()).toEqual(['Eat out', 'Coffee', 'Drinks', 'Groceries', 'Activity', 'Visit']);
  });

  it('picks a value with one tap and clears it with another', () => {
    render(<Harness />);

    fireEvent.click(screen.getByRole('radio', { name: 'Coffee' }));
    expect(screen.getByRole('radio', { name: 'Coffee' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByTestId('value')).toHaveTextContent('Coffee');

    fireEvent.click(screen.getByRole('radio', { name: 'Coffee' }));
    expect(screen.getByTestId('value')).toBeEmptyDOMElement();
  });

  it('keeps a saved value that is not in the top 6 selectable', () => {
    render(<Harness initial="Gift" />);

    expect(chips()[0]).toBe('Gift');
    expect(screen.getByRole('radio', { name: 'Gift' })).toHaveAttribute('aria-checked', 'true');
  });

  it('starts from the seeds when there is no history', () => {
    render(<Harness options={[]} seeds={['Eat out', 'Coffee']} />);

    expect(chips()).toEqual(['Eat out', 'Coffee']);
  });

  it('takes a new value from "+ New"', () => {
    render(<Harness />);

    fireEvent.click(screen.getByRole('button', { name: 'New category' }));
    const input = screen.getByLabelText('New category');
    expect(input).toHaveFocus();
    fireEvent.change(input, { target: { value: 'Picnic' } });

    expect(screen.getByTestId('value')).toHaveTextContent('Picnic');
    expect(within(group()).queryByRole('radio', { checked: true })).not.toBeInTheDocument();
  });

  it('gives every chip a 44px tap target', () => {
    render(<Harness />);

    for (const chip of within(group()).getAllByRole('radio')) expect(chip.className).toMatch(/\bmin-h-11\b/);
  });
});
