'use client';

import { CalendarDays, Pencil, Sparkles, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Note } from '@/lib/graphql/types/note.types';
import { formatSafeDate } from './dateUtils';

interface NoteCardProps {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (noteId: string) => void;
  deleting?: boolean;
}

export function NoteCard({ note, onEdit, onDelete, deleting = false }: NoteCardProps) {
  const isMonthly = note.periodType === 'MONTHLY';
  const title = note.title || (isMonthly ? 'Monthly update' : 'Weekly update');

  return (
    <Card
      className={cn(
        'group overflow-hidden border-border/60 bg-card/95 py-0 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl',
        isMonthly
          ? 'bg-gradient-to-br from-amber-500/[0.10] via-card to-card'
          : 'bg-gradient-to-br from-sky-500/[0.10] via-card to-card'
      )}
    >
      <div
        className={cn(
          'h-1.5 w-full',
          isMonthly
            ? 'bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400'
            : 'bg-gradient-to-r from-sky-400 via-cyan-400 to-emerald-400'
        )}
      />
      <CardHeader className="space-y-4 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-3">
            <Badge
              variant="outline"
              className={cn(
                'w-fit border-white/60 bg-white/70 px-3 py-1 text-[11px] uppercase tracking-[0.24em] shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5',
                isMonthly ? 'text-amber-700 dark:text-amber-200' : 'text-sky-700 dark:text-sky-200'
              )}
            >
              {isMonthly ? 'Monthly flashcard' : 'Weekly flashcard'}
            </Badge>
            <CardTitle className="text-xl leading-tight">{title}</CardTitle>
          </div>
          <div
            className={cn(
              'rounded-2xl border p-3 text-muted-foreground transition-colors group-hover:text-foreground',
              isMonthly ? 'border-amber-500/20 bg-amber-500/10' : 'border-sky-500/20 bg-sky-500/10'
            )}
          >
            <Sparkles className="size-5" />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1">
            <CalendarDays className="size-4" />
            {formatSafeDate(note.date, 'dd MMM yyyy')}
          </span>
          <Badge variant="secondary" className="px-3 py-1">
            {note.accomplishments.length} wins
          </Badge>
          <Badge variant="secondary" className="px-3 py-1">
            {note.nextPlans.length} next moves
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pb-6">
        {note.accomplishments.length > 0 && (
          <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.07] p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">
              Main accomplishments
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {note.accomplishments.map((item, index) => (
                <li key={`accomplishment-${item}-${index}`} className="flex gap-2">
                  <span className="mt-1 size-1.5 rounded-full bg-emerald-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {note.nextPlans.length > 0 && (
          <div className="rounded-2xl border border-sky-500/15 bg-sky-500/[0.07] p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-sky-700 dark:text-sky-300">
              Plans for next period
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {note.nextPlans.map((item, index) => (
                <li key={`plan-${item}-${index}`} className="flex gap-2">
                  <span className="mt-1 size-1.5 rounded-full bg-sky-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <Button variant="outline" className="flex-1 rounded-xl" onClick={() => onEdit(note)}>
            <Pencil className="size-4" />
            Edit
          </Button>
          <Button variant="destructive" className="flex-1 rounded-xl" onClick={() => onDelete(note.id)} disabled={deleting}>
            <Trash2 className="size-4" />
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
