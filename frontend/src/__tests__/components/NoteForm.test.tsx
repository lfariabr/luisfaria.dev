import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { NoteForm, parseListInput } from '@/components/notes/NoteForm';

describe('NoteForm', () => {
  it('omits empty hidden content on submit', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);

    render(<NoteForm onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole('button', { name: 'Create note' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Weekly update',
          content: undefined,
          periodType: 'WEEKLY',
          accomplishments: [],
          nextPlans: [],
          tags: [],
        })
      );
    });
  });

  it('splits list input by line, keeping commas inside a line', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);

    render(<NoteForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText('Accomplishments'), {
      target: { value: 'Double shift (Tue, Wed, Thu)\n- Gym 5x\n\n' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create note' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ accomplishments: ['Double shift (Tue, Wed, Thu)', 'Gym 5x'] })
      );
    });
  });

  it('prefills edit form one item per line', () => {
    render(
      <NoteForm
        onSubmit={jest.fn()}
        note={{
          id: 'n1',
          userId: 'u1',
          title: 'Week',
          date: '2026-03-15T00:00:00.000Z',
          periodType: 'WEEKLY',
          accomplishments: ['A, with comma', 'B'],
          nextPlans: [],
          tags: [],
          createdAt: '',
          updatedAt: '',
        }}
      />
    );

    expect(screen.getByLabelText('Accomplishments')).toHaveValue('A, with comma\nB');
  });
});

describe('parseListInput', () => {
  it('falls back to commas for single-line input', () => {
    expect(parseListInput('gym, savings ,  reading')).toEqual(['gym', 'savings', 'reading']);
  });

  it('keeps leading minus that is not a bullet', () => {
    expect(parseListInput('-5kg\nslept 8h')).toEqual(['-5kg', 'slept 8h']);
  });
});
