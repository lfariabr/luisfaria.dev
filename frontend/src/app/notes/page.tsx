'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layouts/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/lib/auth/AuthContext';
import { useNotes } from '@/lib/hooks/useNotes';
import { useNoteMutations } from '@/lib/hooks/useNoteMutations';
import { NoteForm } from '@/components/notes/NoteForm';
import { NotesTimelineView } from '@/components/notes/NotesTimelineView';
import { NotesPeriodView } from '@/components/notes/NotesPeriodView';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Note, NotePeriodType } from '@/lib/graphql/types/note.types';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';

export default function NotesPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [viewMode, setViewMode] = useState<'timeline' | 'period'>('timeline');
  const [periodType, setPeriodType] = useState<NotePeriodType | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [openCreate, setOpenCreate] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filters = useMemo(
    () => ({
      periodType,
      search: search.trim() || undefined,
    }),
    [periodType, search]
  );

  const shouldFetchNotes = !authLoading && isAuthenticated;
  const { notes, loading, error, refetch } = useNotes(filters, { skip: !shouldFetchNotes });
  const { createNote, updateNote, deleteNote, loading: mutationLoading } = useNoteMutations();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?redirect=/notes');
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading || !isAuthenticated) {
    return (
      <MainLayout>
        <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">Loading...</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Notes & Flashcards</h1>
            <p className="text-sm text-muted-foreground">
              Capture weekly/monthly checkpoints and visualize progress quickly.
            </p>
          </div>
          <Dialog open={openCreate} onOpenChange={setOpenCreate}>
            <DialogTrigger asChild>
              <Button>Create note</Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>New checkpoint</DialogTitle>
              </DialogHeader>
              <NoteForm
                loading={mutationLoading.create}
                onSubmit={async (input) => {
                  const created = await createNote(input);
                  if (created) {
                    await refetch();
                    setOpenCreate(false);
                  } else {
                    logger.warn('Create note mutation returned empty result');
                    toast.error('Failed to create note. Please try again.');
                  }
                }}
              />
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filters & views</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <input
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Search content/title..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <Select
              value={periodType ?? 'ALL'}
              onValueChange={(v) => setPeriodType((v === 'ALL' ? undefined : v) as NotePeriodType | undefined)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All periods" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All periods</SelectItem>
                <SelectItem value="WEEKLY">Weekly</SelectItem>
                <SelectItem value="MONTHLY">Monthly</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button variant={viewMode === 'timeline' ? 'default' : 'outline'} onClick={() => setViewMode('timeline')}>
                Timeline
              </Button>
              <Button variant={viewMode === 'period' ? 'default' : 'outline'} onClick={() => setViewMode('period')}>
                Week/Month
              </Button>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!loading && notes.length === 0 && (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No notes yet. Create your first weekly checkpoint.
            </CardContent>
          </Card>
        )}

        {loading && <p className="text-sm text-muted-foreground">Loading notes...</p>}

        {!loading && notes.length > 0 && (
          <>
            {viewMode === 'timeline' ? (
              <NotesTimelineView
                notes={notes}
                deletingId={deletingId}
                onEdit={(note) => setEditingNote(note)}
                onDelete={async (noteId) => {
                  setDeletingId(noteId);
                  try {
                    const deleted = await deleteNote(noteId);
                    if (deleted) {
                      await refetch();
                    } else {
                      logger.warn('Delete note mutation returned false', { noteId });
                    }
                  } finally {
                    setDeletingId(null);
                  }
                }}
              />
            ) : (
              <NotesPeriodView notes={notes} />
            )}
          </>
        )}
      </div>

      <Dialog open={Boolean(editingNote)} onOpenChange={(open) => !open && setEditingNote(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit checkpoint</DialogTitle>
          </DialogHeader>
          {editingNote && (
            <NoteForm
              note={editingNote}
              loading={mutationLoading.update}
              onSubmit={async (input) => {
                const updated = await updateNote(editingNote.id, input);
                if (updated) {
                  await refetch();
                  setEditingNote(null);
                } else {
                  logger.warn('Update note mutation returned empty result', { noteId: editingNote.id });
                  toast.error('Failed to update note. Please try again.');
                }
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
