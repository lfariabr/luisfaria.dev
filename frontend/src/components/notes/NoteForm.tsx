'use client';

import { useEffect, useState } from 'react';
import { CalendarDays, Goal, Sparkles, Target, WandSparkles } from 'lucide-react';
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

// One item per line. When creating, single-line input may fall back to comma-separated for quick entry;
// editing never splits on commas, since stored items are prefilled one per line and may contain commas.
export const parseListInput = (value: string, { commaFallback = true } = {}): string[] =>
  value
    .split(commaFallback && !/\r?\n/.test(value) ? ',' : /\r?\n/)
    .map((item) => item.replace(/^\s*[-•*]\s+/, '').trim())
    .filter(Boolean);

const toListInput = (items: string[] | undefined) => (items ?? []).join('\n');

// e.g. "Weekly update 05/10/2026", built from the checkpoint date (defaults to today).
export const buildSuggestedTitle = (periodType: NotePeriodType, dateInputValue: string) => {
  const [year, month, day] = dateInputValue.split('-');
  const label = periodType === 'MONTHLY' ? 'Monthly update' : 'Weekly update';
  return year && month && day ? `${label} ${day}/${month}/${year}` : label;
};

export function NoteForm({ note, loading = false, onSubmit }: NoteFormProps) {
  const [title, setTitle] = useState(note?.title ?? '');
  const [content, setContent] = useState(note?.content ?? '');
  const [date, setDate] = useState(toDateInputValue(note?.date));
  const [periodType, setPeriodType] = useState<NotePeriodType>(note?.periodType ?? 'WEEKLY');
  const [accomplishments, setAccomplishments] = useState(toListInput(note?.accomplishments));
  const [nextPlans, setNextPlans] = useState(toListInput(note?.nextPlans));
  const [tags, setTags] = useState(toListInput(note?.tags));

  useEffect(() => {
    if (!note) return;
    setTitle(note.title ?? '');
    setContent(note.content ?? '');
    setDate(toDateInputValue(note.date));
    setPeriodType(note.periodType);
    setAccomplishments(toListInput(note.accomplishments));
    setNextPlans(toListInput(note.nextPlans));
    setTags(toListInput(note.tags));
  }, [note]);

  const suggestedTitle = buildSuggestedTitle(periodType, date);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalizedContent = content.trim() || undefined;
    const listOptions = { commaFallback: !note };

    await onSubmit({
      title: title.trim() || suggestedTitle,
      content: normalizedContent,
      date: `${date}T00:00:00.000Z`,
      periodType,
      accomplishments: parseListInput(accomplishments, listOptions),
      nextPlans: parseListInput(nextPlans, listOptions),
      tags: parseListInput(tags, listOptions),
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
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="note-title">Title</Label>
            {title !== suggestedTitle && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setTitle(suggestedTitle)}
                className="h-7 rounded-full px-2.5 text-xs text-primary"
              >
                <WandSparkles className="size-3.5" />
                Autofill
              </Button>
            )}
          </div>
          <Input
            id="note-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={suggestedTitle}
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
            placeholder={'Gym 5x this week\nHit savings goal\nFinished chapter 4'}
            className="min-h-[140px] rounded-2xl bg-background/90 leading-relaxed"
          />
          <p className="mt-2 text-xs text-muted-foreground">One per line. Focus on the outcomes worth remembering.</p>
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
            placeholder={'Fix sleep routine\nRead 30 pages\nKeep budgeting'}
            className="min-h-[140px] rounded-2xl bg-background/90 leading-relaxed"
          />
          <p className="mt-2 text-xs text-muted-foreground">One per line. Keep the next moves concrete and small enough to act on.</p>
        </div>
      </div>

      <Button type="submit" disabled={loading} className="w-full rounded-2xl sm:w-auto">
        {loading ? 'Saving...' : note ? 'Save changes' : 'Create note'}
      </Button>
    </form>
  );
}
