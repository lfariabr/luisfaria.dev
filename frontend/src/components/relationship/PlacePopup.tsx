import { MapPin, Pencil } from 'lucide-react';
import type { Pin } from '@/lib/graphql/types/pin.types';
import { displayAmount, formatDate } from './format';
import type { PlaceGroup } from './placeGroups';

interface PlacePopupProps {
  place: PlaceGroup;
  canEdit: boolean;
  amountsHidden: boolean;
  onEdit: (visit: Pin) => void;
}

/** Title for the InfoWindow header, beside Google's close button. */
export function PlacePopupTitle({ place }: { place: PlaceGroup }) {
  return <h3 className="pr-1 text-base font-semibold leading-snug">{place.placeName}</h3>;
}

/** Where the place is and each visit's date and spend. Category, payment and notes stay in the edit form. */
export function PlacePopup({ place, canEdit, amountsHidden, onEdit }: PlacePopupProps) {
  const newest = place.visits[0];
  const location = [newest.city, newest.countryCode].filter(Boolean).join(', ');

  return (
    <div className="min-w-[200px] max-w-[260px] text-popover-foreground">
      {location && (
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3 shrink-0" />
          {location}
        </p>
      )}
      {place.visits.length > 1 && (
        <p className="mt-1 text-xs font-medium text-muted-foreground">
          {place.visits.length} visits
          {place.totalSpent > 0 && ` · ${displayAmount(place.totalSpent, amountsHidden)}`}
        </p>
      )}
      <ul className="mt-2 max-h-60 divide-y divide-border overflow-auto">
        {place.visits.map((visit) => (
          <li key={visit.id} className="flex items-center justify-between gap-3 py-1.5">
            <div className="min-w-0">
              <p className="text-sm">{formatDate(visit.date)}</p>
              {visit.placeName !== place.placeName && (
                <p className="truncate text-xs text-muted-foreground">as {visit.placeName}</p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {visit.amount != null && (
                <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{displayAmount(visit.amount, amountsHidden)}</span>
              )}
              {canEdit && (
                <button
                  type="button"
                  aria-label={`Edit ${visit.placeName} on ${formatDate(visit.date)}`}
                  onClick={() => onEdit(visit)}
                  className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
