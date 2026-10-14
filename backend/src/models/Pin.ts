import mongoose, { Document, Schema } from 'mongoose';

export interface IPin extends Document {
  date: Date;
  placeName: string;
  amount: number;
  lat: number;
  lng: number;
  category?: string;
  payment?: string;
  city?: string;
  countryCode?: string;
  notes?: string;
  source?: string;
  placeId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PinSchema: Schema = new Schema(
  {
    date: { type: Date, required: true },
    placeName: { type: String, required: true, trim: true, maxlength: 160 },
    amount: { type: Number, required: true, min: [0, 'amount must be a positive spend'] },
    lat: { type: Number, required: true, min: -90, max: 90 },
    lng: { type: Number, required: true, min: -180, max: 180 },
    category: { type: String, trim: true, maxlength: 80 },
    payment: { type: String, trim: true, maxlength: 80 },
    city: { type: String, trim: true, maxlength: 80 },
    countryCode: {
      type: String,
      trim: true,
      uppercase: true,
      match: [/^[A-Z]{2}$/, 'countryCode must be ISO 3166-1 alpha-2 (two letters)'],
    },
    notes: { type: String, trim: true, maxlength: 500 },
    source: { type: String, trim: true, maxlength: 80 },
    placeId: { type: String, trim: true, maxlength: 255, index: true },
  },
  { timestamps: true }
);

PinSchema.index({ date: -1 });
PinSchema.index({ city: 1, date: -1 });
// Lookup for the importer's upsert. Not unique: two identical coffees on one day are real.
// Named explicitly so it never collides with the old unique index, which scripts/migrate-pins.ts drops.
export const PIN_LOOKUP_INDEX = 'pin_lookup_place_date_amount';
export const LEGACY_PIN_UNIQUE_INDEX = 'placeName_1_date_1_amount_1';
PinSchema.index({ placeName: 1, date: 1, amount: 1 }, { name: PIN_LOOKUP_INDEX });

export default mongoose.model<IPin>('Pin', PinSchema);
