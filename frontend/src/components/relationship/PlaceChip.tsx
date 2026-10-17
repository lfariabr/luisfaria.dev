'use client';

import { MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PinFormValues } from './pinForm';

interface PlaceChipProps {
  values: PinFormValues;
  onChange: () => void;
}

/**
 * The place the form will save, as a person would name it: Google's short address for a
 * searched place, city and country for a saved pin, coordinates only for a bare map tap.
 */
export function PlaceChip({ values, onChange }: PlaceChipProps) {
  const where = values.address || [values.city, values.countryCode].filter(Boolean).join(', ');
  const title = where ? values.placeName.trim() || 'Selected place' : 'Pinned on map';
  const detail = where || `${values.lat?.toFixed(4)}, ${values.lng?.toFixed(4)}`;

  return (
    <div className="flex items-center gap-3 rounded-md border bg-muted/40 px-3 py-2">
      <MapPin className="h-4 w-4 shrink-0 text-emerald-600" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{title}</p>
        <p className="truncate text-xs text-muted-foreground">{detail}</p>
      </div>
      <Button type="button" variant="outline" size="sm" aria-label="Change place" onClick={onChange}>
        Change
      </Button>
    </div>
  );
}
