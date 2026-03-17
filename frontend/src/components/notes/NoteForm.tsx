'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Note, NoteInput, NotePeriodType } from '@/lib/graphql/types/note.types';
import { toDateInputValue } from './dateUtils';

interface NoteFormProps {
  note?: Note;
  loading?: boolean;
  onSubmit: (input: NoteInput) => Promise<void>;
}

const parseCsv = (value: string): string[] =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

export function NoteForm({ note, loading = false, onSubmit }: NoteFormProps) {
  const [title, setTitle] = useState(note?.title ?? '');
  const [content, setContent] = useState(note?.content ?? '');
  const [date, setDate] = useState(toDateInputValue(note?.date));
  const [periodType, setPeriodType] = useState<NotePeriodType>(note?.periodType ?? 'WEEKLY');
  const [accomplishments, setAccomplishments] = useState((note?.accomplishments ?? []).join(', '));
  const [nextPlans, setNextPlans] = useState((note?.nextPlans ?? []).join(', '));
  const [tags, setTags] = useState((note?.tags ?? []).join(', '));

  useEffect(() => {
    if (!note) return;
    setTitle(note.title ?? '');
    setContent(note.content ?? '');
    setDate(toDateInputValue(note.date));
    setPeriodType(note.periodType);
    setAccomplishments((note.accomplishments ?? []).join(', '));
    setNextPlans((note.nextPlans ?? []).join(', '));
    setTags((note.tags ?? []).join(', '));
  }, [note]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await onSubmit({
      title: title.trim() || 'Weekly update',
      content,
      date: new Date(date).toISOString(),
      periodType,
      accomplishments: parseCsv(accomplishments),
      nextPlans: parseCsv(nextPlans),
      tags: parseCsv(tags),
    });
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="note-title">Title</Label>
        <Input id="note-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Weekly update" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="note-content">Notes</Label>
        <Textarea
          id="note-content"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Write your notes..."
          className="min-h-[120px]"
          required
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="note-date">Checkpoint date</Label>
          <Input id="note-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="note-period">Period</Label>
          <select
            id="note-period"
            value={periodType}
            onChange={(event) => setPeriodType(event.target.value as NotePeriodType)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="WEEKLY">Weekly</option>
            <option value="MONTHLY">Monthly</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="note-accomplishments">Accomplishments (comma-separated)</Label>
        <Input
          id="note-accomplishments"
          value={accomplishments}
          onChange={(event) => setAccomplishments(event.target.value)}
          placeholder="gym consistency, savings goal, reading progress"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="note-plans">Plans for next week/month (comma-separated)</Label>
        <Input
          id="note-plans"
          value={nextPlans}
          onChange={(event) => setNextPlans(event.target.value)}
          placeholder="sleep routine, continue reading, keep budgeting"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="note-tags">Tags (comma-separated)</Label>
        <Input id="note-tags" value={tags} onChange={(event) => setTags(event.target.value)} placeholder="health, finance, mindset" />
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? 'Saving...' : note ? 'Save changes' : 'Create note'}
      </Button>
    </form>
  );
}
