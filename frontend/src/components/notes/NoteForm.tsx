'use client';

import { useEffect, useState } from 'react';
import { CalendarDays, Goal, Sparkles, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
    const defaultTitle = periodType === 'MONTHLY' ? 'Monthly update' : 'Weekly update';
    await onSubmit({
      title: title.trim() || defaultTitle,
      content,
      date: `${date}T00:00:00.000Z`,
      periodType,
      accomplishments: parseCsv(accomplishments),
      nextPlans: parseCsv(nextPlans),
      tags: parseCsv(tags),
    });
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="rounded-3xl border border-border/60 bg-gradient-to-br from-primary/[0.08] via-background to-background p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl border border-primary/15 bg-primary/10 p-3 text-primary">
            <Sparkles className="size-5" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold">Shape a checkpoint worth revisiting</p>
            <p className="text-sm text-muted-foreground">
              Keep it concise and specific so this card is useful when you scan it later.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="note-title">Title</Label>
          <Input
            id="note-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Weekly update"
            className="rounded-2xl"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="note-date" className="inline-flex items-center gap-2">
              <CalendarDays className="size-4" />
              Checkpoint date
            </Label>
            <Input
              id="note-date"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              required
              className="rounded-2xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="note-period">Period</Label>
            <Select value={periodType} onValueChange={(value) => setPeriodType(value as NotePeriodType)}>
              <SelectTrigger id="note-period" className="rounded-2xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="WEEKLY">Weekly</SelectItem>
                <SelectItem value="MONTHLY">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-emerald-500/15 bg-emerald-500/[0.06] p-4">
          <div className="mb-3 flex items-center gap-2">
            <Goal className="size-4 text-emerald-600 dark:text-emerald-300" />
            <Label htmlFor="note-accomplishments" className="text-sm font-semibold">
              Accomplishments
            </Label>
          </div>
          <Textarea
            id="note-accomplishments"
            value={accomplishments}
            onChange={(event) => setAccomplishments(event.target.value)}
            placeholder="gym consistency, savings goal, reading progress"
            className="min-h-[112px] rounded-2xl bg-background/90"
          />
          <p className="mt-2 text-xs text-muted-foreground">Comma-separated. Focus on the outcomes worth remembering.</p>
        </div>

        <div className="rounded-3xl border border-sky-500/15 bg-sky-500/[0.06] p-4">
          <div className="mb-3 flex items-center gap-2">
            <Target className="size-4 text-sky-600 dark:text-sky-300" />
            <Label htmlFor="note-plans" className="text-sm font-semibold">
              Plans for next week/month
            </Label>
          </div>
          <Textarea
            id="note-plans"
            value={nextPlans}
            onChange={(event) => setNextPlans(event.target.value)}
            placeholder="sleep routine, continue reading, keep budgeting"
            className="min-h-[112px] rounded-2xl bg-background/90"
          />
          <p className="mt-2 text-xs text-muted-foreground">Comma-separated. Keep the next moves concrete and small enough to act on.</p>
        </div>
      </div>

      <Button type="submit" disabled={loading} className="w-full rounded-2xl sm:w-auto">
        {loading ? 'Saving...' : note ? 'Save changes' : 'Create note'}
      </Button>
    </form>
  );
}
