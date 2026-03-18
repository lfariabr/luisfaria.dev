'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Note } from '@/lib/graphql/types/note.types';
import { formatSafeDate } from './dateUtils';

interface NoteCardProps {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (noteId: string) => void;
  deleting?: boolean;
}

export function NoteCard({ note, onEdit, onDelete, deleting = false }: NoteCardProps) {
  return (
    <Card>
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-lg">{note.title || 'Weekly update'}</CardTitle>
          <Badge variant="outline">{note.periodType === 'WEEKLY' ? 'Weekly' : 'Monthly'}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">{formatSafeDate(note.date, 'dd/MM/yyyy')}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {note.content ? <p className="whitespace-pre-wrap text-sm">{note.content}</p> : null}

        {note.accomplishments.length > 0 && (
          <div>
            <p className="mb-1 text-sm font-semibold">Main accomplishments</p>
            <ul className="list-disc pl-5 text-sm text-muted-foreground">
              {note.accomplishments.map((item, index) => (
                <li key={`accomplishment-${item}-${index}`}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {note.nextPlans.length > 0 && (
          <div>
            <p className="mb-1 text-sm font-semibold">Plans for next period</p>
            <ul className="list-disc pl-5 text-sm text-muted-foreground">
              {note.nextPlans.map((item, index) => (
                <li key={`plan-${item}-${index}`}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {note.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {note.tags.map((tag, index) => (
              <Badge key={`tag-${tag}-${index}`} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => onEdit(note)}>
            Edit
          </Button>
          <Button variant="destructive" onClick={() => onDelete(note.id)} disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
