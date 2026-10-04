'use client';

import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { ChevronDown } from 'lucide-react';
import { Note } from '@/lib/graphql/types/note.types';
import { cn } from '@/lib/utils';
import { NoteCard } from './NoteCard';
import { getNoteMonthKey } from './dateUtils';

interface NotesTimelineViewProps {
  notes: Note[];
  onEdit: (note: Note) => void;
  onDelete: (noteId: string) => void;
  deletingId?: string | null;
  expandAll?: boolean;
}

interface MonthGroup {
  key: string;
  label: string;
  notes: Note[];
  wins: number;
}

const formatMonthLabel = (key: string) =>
  key === 'unknown' ? 'Undated' : format(new Date(`${key}-01T00:00:00`), 'MMMM yyyy');

export const groupNotesByMonth = (notes: Note[]): MonthGroup[] => {
  const groups = new Map<string, MonthGroup>();
  for (const note of notes) {
    const key = getNoteMonthKey(note.date);
    const group = groups.get(key) ?? { key, label: formatMonthLabel(key), notes: [], wins: 0 };
    group.notes.push(note);
    group.wins += note.accomplishments.length;
    groups.set(key, group);
  }
  return [...groups.values()].sort((a, b) => {
    if (a.key === 'unknown') return 1;
    if (b.key === 'unknown') return -1;
    return b.key.localeCompare(a.key);
  });
};

export function NotesTimelineView({ notes, onEdit, onDelete, deletingId, expandAll = false }: NotesTimelineViewProps) {
  const groups = useMemo(() => groupNotesByMonth(notes), [notes]);
  const [toggled, setToggled] = useState<Record<string, boolean>>({});

  const isOpen = (key: string, index: number) => expandAll || (toggled[key] ?? index === 0);

  return (
    <div className="space-y-3">
      {groups.map((group, index) => {
        const open = isOpen(group.key, index);
        const panelId = `notes-month-${group.key}`;
        return (
          <section key={group.key} className="rounded-3xl border border-border/60 bg-card/60">
            <button
              type="button"
              aria-expanded={open}
              aria-controls={panelId}
              onClick={() => setToggled((prev) => ({ ...prev, [group.key]: !open }))}
              className="flex w-full items-center justify-between gap-3 rounded-3xl px-4 py-3 text-left transition-colors hover:bg-muted/40 sm:px-5"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold">{group.label}</p>
                <p className="text-xs text-muted-foreground">
                  {group.notes.length} {group.notes.length === 1 ? 'checkpoint' : 'checkpoints'} · {group.wins} wins
                </p>
              </div>
              <ChevronDown
                className={cn('size-5 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')}
              />
            </button>
            {open && (
              <div
                id={panelId}
                className="grid grid-cols-1 gap-4 px-3 pb-3 sm:px-4 sm:pb-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
              >
                {group.notes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    deleting={deletingId === note.id}
                  />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
