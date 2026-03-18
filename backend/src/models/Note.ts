import mongoose, { Document, Schema } from 'mongoose';

export type NotePeriodType = 'WEEKLY' | 'MONTHLY';

export interface INote extends Document {
  userId: mongoose.Types.ObjectId;
  title?: string;
  content: string;
  date: Date;
  periodType: NotePeriodType;
  accomplishments: string[];
  nextPlans: string[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const NoteSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: { type: String, trim: true, default: 'Note update' },
    content: { type: String, required: true, trim: true },
    date: { type: Date, required: true, default: Date.now },
    periodType: {
      type: String,
      enum: ['WEEKLY', 'MONTHLY'],
      default: 'WEEKLY',
      required: true,
    },
    accomplishments: { type: [String], default: [] },
    nextPlans: { type: [String], default: [] },
    tags: { type: [String], default: [] },
  },
  { timestamps: true }
);

NoteSchema.index({ userId: 1, date: -1, createdAt: -1 });

export default mongoose.model<INote>('Note', NoteSchema);
