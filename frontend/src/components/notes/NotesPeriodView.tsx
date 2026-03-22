'use client';

import { format } from 'date-fns';
import { CalendarRange, Layers3 } from 'lucide-react';
import { Note } from '@/lib/graphql/types/note.types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatSafeDate, getNoteMonthKey, getNoteWeekKey } from './dateUtils';

interface NotesPeriodViewProps {
  notes: Note[];
}

export function NotesPeriodView({ notes }: NotesPeriodViewProps) {
  const monthly = notes.reduce<Record<string, Note[]>>((acc, note) => {
    const key = getNoteMonthKey(note.date);
    (acc[key] ??= []).push(note);
    return acc;
  }, {});

  const weekly = notes.reduce<Record<string, Note[]>>((acc, note) => {
    const key = getNoteWeekKey(note.date);
    (acc[key] ??= []).push(note);
    return acc;
  }, {});

  const sortPeriodKeys = (a: string, b: string) => {
    if (a === 'unknown') return 1;
    if (b === 'unknown') return -1;
    return b.localeCompare(a);
  };
  const monthEntries = Object.entries(monthly).sort((a, b) => sortPeriodKeys(a[0], b[0]));
  const weekEntries = Object.entries(weekly).sort((a, b) => sortPeriodKeys(a[0], b[0]));

  const renderGroup = (
    entries: [string, Note[]][],
    emptyLabel: string,
    formatLabel: (key: string) => string,
    badgeVariant: 'secondary' | 'outline'
  ) => {
    if (entries.length === 0) {
      return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
    }

    return entries.map(([key, groupNotes]) => {
      const groupLabel = groupNotes.every((note) => note.periodType === 'MONTHLY')
        ? 'Monthly'
        : groupNotes.every((note) => note.periodType === 'WEEKLY')
          ? 'Weekly'
          : 'Mixed';

      return (
        <section key={key} className="rounded-3xl border border-border/60 bg-background/80 p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">{formatLabel(key)}</p>
              <p className="text-xs text-muted-foreground">
                {groupNotes.length} {groupNotes.length === 1 ? 'checkpoint' : 'checkpoints'}
              </p>
            </div>
            <Badge variant={badgeVariant} className="px-3 py-1">
              {groupLabel}
            </Badge>
          </div>
          <div className="grid gap-2">
            {groupNotes.map((note) => (
              <div
                key={note.id}
                className="rounded-2xl border border-border/50 bg-card/90 px-3 py-3 transition-colors hover:border-border"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">
                    {note.title || (note.periodType === 'MONTHLY' ? 'Monthly update' : 'Weekly update')}
                  </p>
                  <span className="text-xs text-muted-foreground">{formatSafeDate(note.date, 'dd MMM')}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {note.accomplishments.slice(0, 2).map((item, index) => (
                    <Badge key={`${note.id}-accomplishment-${index}`} variant="secondary" className="max-w-full truncate">
                      {item}
                    </Badge>
                  ))}
                  {note.nextPlans.slice(0, 1).map((item, index) => (
                    <Badge key={`${note.id}-plan-${index}`} variant="outline" className="max-w-full truncate">
                      Next: {item}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      );
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="border-border/60 bg-gradient-to-br from-amber-500/[0.08] via-card to-card py-0 shadow-sm">
        <CardHeader className="border-b border-border/60 pb-5 pt-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3 text-amber-700 dark:text-amber-300">
              <CalendarRange className="size-5" />
            </div>
            <div>
              <CardTitle>By month</CardTitle>
              <p className="text-sm text-muted-foreground">Zoom out and review the larger arcs of progress.</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {renderGroup(
            monthEntries,
            'No monthly grouping available yet.',
            (key) => (key === 'unknown' ? 'Unknown month' : format(new Date(`${key}-01T00:00:00.000Z`), 'MMMM yyyy')),
            'secondary'
          )}
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-gradient-to-br from-sky-500/[0.08] via-card to-card py-0 shadow-sm">
        <CardHeader className="border-b border-border/60 pb-5 pt-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-sky-500/20 bg-sky-500/10 p-3 text-sky-700 dark:text-sky-300">
              <Layers3 className="size-5" />
            </div>
            <div>
              <CardTitle>By week</CardTitle>
              <p className="text-sm text-muted-foreground">Track short-cycle wins and next-step momentum.</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {renderGroup(weekEntries, 'No weekly grouping available yet.', (key) => (key === 'unknown' ? 'Unknown week' : key), 'outline')}
        </CardContent>
      </Card>
    </div>
  );
}
