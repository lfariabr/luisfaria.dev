import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import NotesPage from '@/app/notes/page';

const mockPush = jest.fn();
const mockDeleteNote = jest.fn().mockResolvedValue(true);

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock('@/components/layouts/MainLayout', () => ({
  MainLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('@/lib/auth/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    loading: false,
    status: 'authenticated',
  }),
}));

jest.mock('@/lib/hooks/useNotes', () => ({
  useNotes: () => ({
    notes: [
      {
        id: 'n1',
        userId: 'u1',
        title: 'Weekly checkpoint',
        content: 'Progress summary',
        date: 'invalid-date-from-api',
        periodType: 'WEEKLY',
        accomplishments: ['Gym 5x'],
        nextPlans: ['Sleep better'],
        tags: ['health'],
        createdAt: '2026-03-15T00:00:00.000Z',
        updatedAt: '2026-03-15T00:00:00.000Z',
      },
    ],
    loading: false,
    error: undefined,
    refetch: jest.fn().mockResolvedValue(undefined),
  }),
}));

jest.mock('@/lib/hooks/useNoteMutations', () => ({
  useNoteMutations: () => ({
    createNote: jest.fn(),
    updateNote: jest.fn(),
    deleteNote: mockDeleteNote,
    loading: { create: false, update: false, delete: false, any: false },
  }),
}));

describe('NotesPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders note content and switches to period view', () => {
    render(<NotesPage />);

    expect(screen.getByText('My Notes & Flashcards')).toBeInTheDocument();
    expect(screen.getByText('Private study cockpit')).toBeInTheDocument();
    expect(screen.getByText('Weekly checkpoint')).toBeInTheDocument();
    expect(screen.getByText('Unknown date')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Week/Month' }));

    expect(screen.getByText('By month')).toBeInTheDocument();
    expect(screen.getByText('By week')).toBeInTheDocument();
  });

  it('keeps unsaved edits when the notes list re-renders with fresh objects', () => {
    const { rerender } = render(<NotesPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    const title = screen.getByLabelText('Title');
    expect(title).toHaveValue('Weekly checkpoint');

    fireEvent.change(title, { target: { value: 'Unsaved title' } });
    // useNotes returns new note objects on every render, like an Apollo refetch
    rerender(<NotesPage />);

    expect(screen.getByLabelText('Title')).toHaveValue('Unsaved title');
  });

  it('asks for confirmation before deleting a note', async () => {
    render(<NotesPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    expect(screen.getByRole('dialog', { name: 'Delete this note?' })).toBeInTheDocument();
    expect(screen.getByText(/Weekly checkpoint.*will be permanently removed/)).toBeInTheDocument();
    expect(mockDeleteNote).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Delete note' }));

    await waitFor(() => {
      expect(mockDeleteNote).toHaveBeenCalledWith('n1');
    });
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('cancelling the confirmation keeps the note', async () => {
    render(<NotesPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(mockDeleteNote).not.toHaveBeenCalled();
    expect(screen.getByText('Weekly checkpoint')).toBeInTheDocument();
  });

  it('keeps the confirmation open when deletion fails', async () => {
    mockDeleteNote.mockResolvedValueOnce(false);
    render(<NotesPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete note' }));

    await waitFor(() => {
      expect(mockDeleteNote).toHaveBeenCalledWith('n1');
    });
    expect(screen.getByRole('dialog', { name: 'Delete this note?' })).toBeInTheDocument();
  });
});
