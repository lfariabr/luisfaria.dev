import { ExternalLink, MapPin, Pencil, Star } from 'lucide-react';
import type { Pin } from '@/lib/graphql/types/pin.types';
import { displayAmount, formatDate } from './format';
import type { PlaceGroup } from './placeGroups';
import { usePlaceDetails } from './placeDetails';

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
  const google = usePlaceDetails(place.visits.find((visit) => visit.placeId)?.placeId);
  const location = google?.address ?? [newest.city, newest.countryCode].filter(Boolean).join(', ');

  return (
    <div className="min-w-[200px] max-w-[260px] text-popover-foreground">
      {google?.photo && (
        <figure className="mb-2">
          {/* Google photo URLs are short-lived and per-request; they must not go through next/image's cache.
              The site sends Referrer-Policy: no-referrer, but the browser key is restricted by referrer,
              so the photo request carries the origin (never the path) or Google refuses it. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={google.photo.url}
            alt={place.placeName}
            loading="lazy"
            referrerPolicy="origin"
            className="h-28 w-full rounded-md object-cover"
          />
          {google.photo.author && (
            <figcaption className="mt-0.5 truncate text-[10px] text-muted-foreground">
              Photo:{' '}
              {google.photo.author.url ? (
                <a href={google.photo.author.url} target="_blank" rel="noopener noreferrer" className="underline">
                  {google.photo.author.name}
                </a>
              ) : (
                google.photo.author.name
              )}
            </figcaption>
          )}
        </figure>
      )}
      {location && (
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3 shrink-0" />
          {location}
        </p>
      )}
      {(google?.rating !== undefined || google?.mapsUrl) && (
        <div className="mt-1 flex items-center justify-between gap-3 text-xs">
          {google.rating !== undefined ? (
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span className="font-medium">{google.rating.toFixed(1)}</span>
              {google.ratingCount !== undefined && (
                <span className="text-muted-foreground">({google.ratingCount.toLocaleString('en-AU')})</span>
              )}
            </span>
          ) : (
            <span />
          )}
          {google.mapsUrl && (
            <a
              href={google.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 font-medium text-violet-600 hover:underline dark:text-violet-400"
            >
              Google Maps
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
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
                  className="-my-3 -mr-3 inline-flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
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
