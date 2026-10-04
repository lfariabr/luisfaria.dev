import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { NotesTimelineView } from '@/components/notes/NotesTimelineView';
import { Note } from '@/lib/graphql/types/note.types';

const makeNote = (id: string, title: string, date: string): Note => ({
  id,
  userId: 'u1',
  title,
  date,
  periodType: 'WEEKLY',
  accomplishments: ['win'],
  nextPlans: [],
  tags: [],
  createdAt: date,
  updatedAt: date,
});

const notes = [
  makeNote('n1', 'Mid March', '2026-03-15T12:00:00.000Z'),
  makeNote('n2', 'Early March', '2026-03-08T12:00:00.000Z'),
  makeNote('n3', 'Late Feb', '2026-02-22T12:00:00.000Z'),
];

describe('NotesTimelineView', () => {
  it('groups by month, opening only the latest month', () => {
    render(<NotesTimelineView notes={notes} onEdit={jest.fn()} onDelete={jest.fn()} />);

    expect(screen.getByRole('button', { name: /March 2026/ })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: /February 2026/ })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText('2 checkpoints · 2 wins')).toBeInTheDocument();
    expect(screen.getByText('Mid March')).toBeInTheDocument();
    expect(screen.queryByText('Late Feb')).not.toBeInTheDocument();
  });

  it('toggles a month open and closed', () => {
    render(<NotesTimelineView notes={notes} onEdit={jest.fn()} onDelete={jest.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /February 2026/ }));
    expect(screen.getByText('Late Feb')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /March 2026/ }));
    expect(screen.queryByText('Mid March')).not.toBeInTheDocument();
  });

  it('expands every month when expandAll is set', () => {
    render(<NotesTimelineView notes={notes} onEdit={jest.fn()} onDelete={jest.fn()} expandAll />);

    expect(screen.getByText('Mid March')).toBeInTheDocument();
    expect(screen.getByText('Late Feb')).toBeInTheDocument();
  });
});
