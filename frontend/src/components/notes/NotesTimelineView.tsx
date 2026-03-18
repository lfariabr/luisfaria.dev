'use client';

import { Note } from '@/lib/graphql/types/note.types';
import { NoteCard } from './NoteCard';

interface NotesTimelineViewProps {
  notes: Note[];
  onEdit: (note: Note) => void;
  onDelete: (noteId: string) => void;
  deletingId?: string | null;
}

export function NotesTimelineView({ notes, onEdit, onDelete, deletingId }: NotesTimelineViewProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {notes.map((note) => (
        <NoteCard key={note.id} note={note} onEdit={onEdit} onDelete={onDelete} deleting={deletingId === note.id} />
      ))}
    </div>
  );
}
