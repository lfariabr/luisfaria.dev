import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { NoteForm } from '@/components/notes/NoteForm';

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
});
