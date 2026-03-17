'use client';

import { format } from 'date-fns';
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
    acc[key] = [...(acc[key] ?? []), note];
    return acc;
  }, {});

  const weekly = notes.reduce<Record<string, Note[]>>((acc, note) => {
    const key = getNoteWeekKey(note.date);
    acc[key] = [...(acc[key] ?? []), note];
    return acc;
  }, {});

  const sortPeriodKeys = (a: string, b: string) => {
    if (a === 'unknown') return 1;
    if (b === 'unknown') return -1;
    return b.localeCompare(a);
  };
  const monthEntries = Object.entries(monthly).sort((a, b) => sortPeriodKeys(a[0], b[0]));
  const weekEntries = Object.entries(weekly).sort((a, b) => sortPeriodKeys(a[0], b[0]));

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>By month</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {monthEntries.map(([key, groupNotes]) => (
            <div key={key} className="space-y-2">
              <p className="text-sm font-semibold">
                {key === 'unknown' ? 'Unknown month' : format(new Date(`${key}-01T00:00:00.000Z`), 'MMMM yyyy')}
              </p>
              <div className="flex flex-wrap gap-2">
                {groupNotes.map((note) => (
                  <Badge key={note.id} variant="secondary">
                    {note.title || formatSafeDate(note.date, 'dd/MM')}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>By week</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {weekEntries.map(([key, groupNotes]) => (
            <div key={key} className="space-y-2">
              <p className="text-sm font-semibold">{key === 'unknown' ? 'Unknown week' : key}</p>
              <div className="flex flex-wrap gap-2">
                {groupNotes.map((note) => (
                  <Badge key={note.id} variant="outline">
                    {note.title || formatSafeDate(note.date, 'dd/MM')}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
