'use client';

import { useEffect, useRef, useState } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { Loader2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { PlaceSelection } from './pinForm';

interface Suggestion {
  placeId: string;
  mainText: string;
  secondaryText: string;
  prediction: google.maps.places.PlacePrediction;
}

interface PlaceSearchProps {
  onSelect: (place: PlaceSelection) => void;
  /** Biases results toward what the map is showing. */
  bias?: google.maps.LatLngLiteral;
}

const DEBOUNCE_MS = 250;

const component = (place: google.maps.places.Place, type: string, short = false) => {
  const match = place.addressComponents?.find((c) => c.types.includes(type));
  return (short ? match?.shortText : match?.longText) ?? undefined;
};

/** Google Places (New) autocomplete with our own input and list, so it themes and tests like the rest of the form. */
export function PlaceSearch({ onSelect, bias }: PlaceSearchProps) {
  const places = useMapsLibrary('places');
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionToken = useRef<google.maps.places.AutocompleteSessionToken | null>(null);

  useEffect(() => {
    if (!places) return;
    const input = query.trim();
    if (input.length < 2) {
      setSuggestions([]);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      sessionToken.current ??= new places.AutocompleteSessionToken();
      try {
        const { suggestions: results } = await places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input,
          sessionToken: sessionToken.current,
          ...(bias && { locationBias: bias }),
        });
        if (cancelled) return;
        setError(null);
        setSuggestions(
          results.flatMap(({ placePrediction: p }) =>
            p
              ? [{ placeId: p.placeId, mainText: p.mainText?.text ?? p.text.text, secondaryText: p.secondaryText?.text ?? '', prediction: p }]
              : []
          )
        );
      } catch {
        if (!cancelled) setError('Place search is unavailable. Pick the spot on the map instead.');
      }
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [places, query, bias]);

  const choose = async (suggestion: Suggestion) => {
    setBusy(true);
    try {
      const place = suggestion.prediction.toPlace();
      await place.fetchFields({ fields: ['id', 'displayName', 'location', 'addressComponents'] });
      if (!place.location) throw new Error('Place has no location');
      onSelect({
        placeName: place.displayName ?? suggestion.mainText,
        lat: place.location.lat(),
        lng: place.location.lng(),
        city: component(place, 'locality') ?? component(place, 'postal_town'),
        countryCode: component(place, 'country', true),
        placeId: place.id,
      });
      setQuery('');
      setSuggestions([]);
      setError(null);
    } catch {
      setError('Could not load that place. Try again or pick it on the map.');
    } finally {
      // fetchFields ends the billing session; the next search starts a new one.
      sessionToken.current = null;
      setBusy(false);
    }
  };

  return (
    <div className="space-y-1">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          aria-label="Search for a place"
          placeholder={places ? 'Search Google Maps' : 'Loading place search...'}
          value={query}
          disabled={!places || busy}
          onChange={(event) => setQuery(event.target.value)}
          className="pl-9"
          autoComplete="off"
        />
        {busy && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
      </div>
      {suggestions.length > 0 && (
        <ul role="listbox" aria-label="Place suggestions" className="max-h-56 overflow-auto rounded-md border bg-popover text-sm shadow-sm">
          {suggestions.map((suggestion) => (
            <li key={suggestion.placeId} role="option" aria-selected={false}>
              <button
                type="button"
                onClick={() => void choose(suggestion)}
                className="w-full px-3 py-2 text-left transition-colors hover:bg-accent focus:bg-accent focus:outline-none"
              >
                <span className="block font-medium">{suggestion.mainText}</span>
                {suggestion.secondaryText && (
                  <span className="block text-xs text-muted-foreground">{suggestion.secondaryText}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
