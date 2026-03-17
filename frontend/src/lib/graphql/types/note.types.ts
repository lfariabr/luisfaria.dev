export type NotePeriodType = 'WEEKLY' | 'MONTHLY';

export interface Note {
  id: string;
  userId: string;
  title?: string;
  content: string;
  date: string;
  periodType: NotePeriodType;
  accomplishments: string[];
  nextPlans: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface NoteInput {
  title?: string;
  content: string;
  date?: string;
  periodType?: NotePeriodType;
  accomplishments?: string[];
  nextPlans?: string[];
  tags?: string[];
}

export interface NoteUpdateInput {
  title?: string;
  content?: string;
  date?: string;
  periodType?: NotePeriodType;
  accomplishments?: string[];
  nextPlans?: string[];
  tags?: string[];
}

export interface MyNotesVars {
  periodType?: NotePeriodType;
  year?: number;
  month?: number;
  search?: string;
  tag?: string;
  limit?: number;
  offset?: number;
}

export interface MyNotesData {
  myNotes: Note[];
}
