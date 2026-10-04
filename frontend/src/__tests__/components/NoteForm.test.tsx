import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { buildSuggestedTitle, NoteForm, parseListInput } from '@/components/notes/NoteForm';

describe('NoteForm', () => {
  it('omits empty hidden content on submit', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);

    render(<NoteForm onSubmit={onSubmit} />);
    fireEvent.change(screen.getByLabelText(/Checkpoint date/), { target: { value: '2026-10-05' } });

    fireEvent.click(screen.getByRole('button', { name: 'Create note' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Weekly update 05/10/2026',
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

  it('round-trips a single stored item containing commas when editing', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);

    render(
      <NoteForm
        onSubmit={onSubmit}
        note={{
          id: 'n1',
          userId: 'u1',
          title: 'Week',
          date: '2026-03-15T00:00:00.000Z',
          periodType: 'WEEKLY',
          accomplishments: ['Double shift (Tue, Wed, Thu)'],
          nextPlans: ['Read, rest'],
          tags: ['health', 'work'],
          createdAt: '',
          updatedAt: '',
        }}
      />
    );

    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Week renamed' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Week renamed',
          accomplishments: ['Double shift (Tue, Wed, Thu)'],
          nextPlans: ['Read, rest'],
          tags: ['health', 'work'],
        })
      );
    });
  });

  it('loads the new note when remounted with a different key', () => {
    const base = {
      userId: 'u1',
      date: '2026-03-15T00:00:00.000Z',
      periodType: 'WEEKLY' as const,
      accomplishments: [],
      nextPlans: [],
      tags: [],
      createdAt: '',
      updatedAt: '',
    };
    const { rerender } = render(
      <NoteForm key="n1" onSubmit={jest.fn()} note={{ ...base, id: 'n1', title: 'First' }} />
    );
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Edited first' } });

    rerender(<NoteForm key="n2" onSubmit={jest.fn()} note={{ ...base, id: 'n2', title: 'Second' }} />);

    expect(screen.getByLabelText('Title')).toHaveValue('Second');
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

describe('title autofill', () => {
  it('suggests a dated title as placeholder and fills it on Autofill', () => {
    render(<NoteForm onSubmit={jest.fn()} />);
    fireEvent.change(screen.getByLabelText(/Checkpoint date/), { target: { value: '2026-10-05' } });

    const title = screen.getByLabelText('Title');
    expect(title).toHaveAttribute('placeholder', 'Weekly update 05/10/2026');

    fireEvent.click(screen.getByRole('button', { name: 'Autofill' }));
    expect(title).toHaveValue('Weekly update 05/10/2026');
    expect(screen.queryByRole('button', { name: 'Autofill' })).not.toBeInTheDocument();
  });

  it('builds weekly and monthly suggestions from the date input', () => {
    expect(buildSuggestedTitle('WEEKLY', '2026-10-05')).toBe('Weekly update 05/10/2026');
    expect(buildSuggestedTitle('MONTHLY', '2026-09-30')).toBe('Monthly update 30/09/2026');
    expect(buildSuggestedTitle('WEEKLY', '')).toBe('Weekly update');
  });
});

describe('parseListInput', () => {
  it('falls back to commas for single-line input', () => {
    expect(parseListInput('gym, savings ,  reading')).toEqual(['gym', 'savings', 'reading']);
  });

  it('never splits on commas when the fallback is disabled', () => {
    expect(parseListInput('Tue, Wed, Thu', { commaFallback: false })).toEqual(['Tue, Wed, Thu']);
  });

  it('keeps leading minus that is not a bullet', () => {
    expect(parseListInput('-5kg\nslept 8h')).toEqual(['-5kg', 'slept 8h']);
  });
});
