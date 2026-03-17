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
    expect(screen.getByText('Weekly checkpoint')).toBeInTheDocument();
    expect(screen.getByText('Unknown date')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Week/Month' }));

    expect(screen.getByText('By month')).toBeInTheDocument();
    expect(screen.getByText('By week')).toBeInTheDocument();
  });

  it('deletes a note from timeline action', async () => {
    render(<NotesPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => {
      expect(mockDeleteNote).toHaveBeenCalledWith('n1');
    });
  });
});
