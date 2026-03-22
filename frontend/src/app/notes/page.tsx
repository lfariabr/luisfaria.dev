'use client';

import { useEffect, useMemo, useState } from 'react';
import { BookOpenText, CalendarRange, LayoutGrid, Plus, Search, Sparkles, TimerReset } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layouts/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
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
import { cn } from '@/lib/utils';
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
  const totalAccomplishments = useMemo(
    () => notes.reduce((count, note) => count + note.accomplishments.length, 0),
    [notes]
  );
  const totalPlans = useMemo(() => notes.reduce((count, note) => count + note.nextPlans.length, 0), [notes]);
  const monthlyCount = useMemo(() => notes.filter((note) => note.periodType === 'MONTHLY').length, [notes]);
  const weeklyCount = useMemo(() => notes.length - monthlyCount, [notes.length, monthlyCount]);

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
        <section className="overflow-hidden rounded-[2rem] border border-border/60 bg-gradient-to-br from-sky-500/[0.16] via-background to-amber-500/[0.12] shadow-sm">
          <div className="grid gap-8 px-6 py-8 lg:grid-cols-[minmax(0,1.25fr)_360px] lg:px-8 lg:py-10">
            <div className="space-y-6">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/60 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-foreground/80 backdrop-blur dark:border-white/10 dark:bg-white/5">
                <Sparkles className="size-4" />
                Private study cockpit
              </div>
              <div className="space-y-4">
                <h1 className="text-4xl font-black tracking-tight sm:text-5xl">My Notes & Flashcards</h1>
                <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
                  Review your weekly and monthly checkpoints in a premium workspace built for quick scanning, cleaner recall,
                  and sharper next moves.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Dialog open={openCreate} onOpenChange={setOpenCreate}>
                  <DialogTrigger asChild>
                    <Button className="rounded-full px-5">
                      <Plus className="size-4" />
                      Create note
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-h-[90vh] overflow-y-auto border-border/60 bg-background/95 sm:max-w-2xl">
                    <DialogHeader className="space-y-2">
                      <DialogTitle>New checkpoint</DialogTitle>
                      <DialogDescription>Capture what mattered, then define what comes next.</DialogDescription>
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
                <Button
                  variant="outline"
                  className="rounded-full border-white/60 bg-white/60 px-5 backdrop-blur dark:border-white/10 dark:bg-white/5"
                  onClick={() => setViewMode(viewMode === 'timeline' ? 'period' : 'timeline')}
                >
                  {viewMode === 'timeline' ? <CalendarRange className="size-4" /> : <LayoutGrid className="size-4" />}
                  {viewMode === 'timeline' ? 'Switch to grouped view' : 'Switch to timeline'}
                </Button>
              </div>
            </div>

            <Card className="border-white/50 bg-white/75 py-0 shadow-lg backdrop-blur dark:border-white/10 dark:bg-white/6">
              <CardHeader className="border-b border-border/50 pb-5 pt-6">
                <CardTitle className="text-lg">At a glance</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 py-6 sm:grid-cols-2">
                <div className="rounded-2xl border border-border/60 bg-background/85 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Checkpoints</p>
                  <p className="mt-2 text-3xl font-bold">{notes.length}</p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/85 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Accomplishments</p>
                  <p className="mt-2 text-3xl font-bold">{totalAccomplishments}</p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/85 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Weekly cards</p>
                  <p className="mt-2 text-3xl font-bold">{weeklyCount}</p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/85 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Next moves</p>
                  <p className="mt-2 text-3xl font-bold">{totalPlans}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <Card className="border-border/60 bg-card/95 py-0 shadow-sm">
          <CardContent className="grid gap-4 px-5 py-5 md:grid-cols-[minmax(0,1.4fr)_220px_auto] md:items-center">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-11 w-full rounded-2xl pl-11 pr-4"
                placeholder="Search content or title"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label="Search content or title"
              />
            </label>
            <Select
              value={periodType ?? 'ALL'}
              onValueChange={(v) => setPeriodType((v === 'ALL' ? undefined : v) as NotePeriodType | undefined)}
            >
              <SelectTrigger className="h-11 w-full rounded-2xl">
                <SelectValue placeholder="All periods" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All periods</SelectItem>
                <SelectItem value="WEEKLY">Weekly</SelectItem>
                <SelectItem value="MONTHLY">Monthly</SelectItem>
              </SelectContent>
            </Select>
            <div className="grid grid-cols-2 gap-2 rounded-2xl border border-border/60 bg-muted/50 p-1">
              <Button
                variant="ghost"
                className={cn(
                  'h-10 rounded-xl',
                  viewMode === 'timeline' && 'bg-background shadow-sm hover:bg-background'
                )}
                onClick={() => setViewMode('timeline')}
              >
                <BookOpenText className="size-4" />
                Timeline
              </Button>
              <Button
                variant="ghost"
                className={cn(
                  'h-10 rounded-xl',
                  viewMode === 'period' && 'bg-background shadow-sm hover:bg-background'
                )}
                onClick={() => setViewMode('period')}
              >
                <CalendarRange className="size-4" />
                Week/Month
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap items-center justify-between gap-3 px-1">
          <div>
            <p className="text-sm font-semibold">
              {loading ? 'Preparing your workspace...' : `${notes.length} cards ready to review`}
            </p>
            <p className="text-sm text-muted-foreground">
              {viewMode === 'timeline'
                ? 'Browse each checkpoint as a polished flashcard.'
                : 'Compare momentum across weeks and months.'}
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-4 py-2 text-sm text-muted-foreground">
            <TimerReset className="size-4" />
            {periodType ? `${periodType.toLowerCase()} notes only` : 'All periods visible'}
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!loading && notes.length === 0 && (
          <Card className="overflow-hidden border-dashed border-border/70 bg-gradient-to-br from-muted/50 to-background py-0">
            <CardContent className="flex flex-col items-center justify-center gap-4 px-6 py-14 text-center">
              <div className="rounded-full border border-border/60 bg-background p-4 shadow-sm">
                <Sparkles className="size-6 text-primary" />
              </div>
              <div className="space-y-2">
                <p className="text-lg font-semibold">No notes yet. Create your first weekly checkpoint.</p>
                <p className="max-w-md text-sm text-muted-foreground">
                  Start with one clear flashcard-style checkpoint and this space will turn into a fast review surface.
                </p>
              </div>
              <Button className="rounded-full px-5" onClick={() => setOpenCreate(true)}>
                <Plus className="size-4" />
                Create note
              </Button>
            </CardContent>
          </Card>
        )}

        {loading && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Card key={`loading-${index}`} className="animate-pulse border-border/60 py-0">
                <div className="h-1.5 w-full bg-muted" />
                <CardHeader className="space-y-4">
                  <div className="h-6 w-28 rounded-full bg-muted" />
                  <div className="space-y-2">
                    <div className="h-6 w-2/3 rounded bg-muted" />
                    <div className="h-4 w-1/2 rounded bg-muted" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pb-6">
                  <div className="h-24 rounded-2xl bg-muted" />
                  <div className="h-24 rounded-2xl bg-muted" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

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
        <DialogContent className="max-h-[90vh] overflow-y-auto border-border/60 bg-background/95 sm:max-w-2xl">
          <DialogHeader className="space-y-2">
            <DialogTitle>Edit checkpoint</DialogTitle>
            <DialogDescription>Refine the card so the next review is cleaner and more useful.</DialogDescription>
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
