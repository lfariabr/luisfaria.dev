'use client';

import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { APIProvider, Map, AdvancedMarker, InfoWindow } from '@vis.gl/react-google-maps';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, DollarSign, Home, MapPin, RefreshCw } from 'lucide-react';
import { GET_PINS, GET_HOME_LOCATION } from '@/lib/graphql/queries/pin.queries';
import type { Pin, PinsData, RelationshipHomeData } from '@/lib/graphql/types/pin.types';

const SYDNEY = { lat: -33.8688, lng: 151.2093 };

interface RelationshipMapProps {
  title?: string;
  subtitle?: string;
  headingLevel?: 1 | 2;
}

function formatDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Unknown date';

  return date.toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatAmount(amount: number) {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(Math.abs(amount));
}

export function RelationshipMap({
  title = 'Our Sydney Adventures',
  subtitle = 'Private read-only map of places visited together this year',
  headingLevel = 1,
}: RelationshipMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID ?? '';
  const { data, loading, error, refetch } = useQuery<PinsData>(GET_PINS);
  const { data: homeData } = useQuery<RelationshipHomeData>(GET_HOME_LOCATION, {
    errorPolicy: 'ignore',
  });
  const [activePin, setActivePin] = useState<Pin | null>(null);
  const [homeOpen, setHomeOpen] = useState(false);

  const pins = data?.pins ?? [];
  const home = homeData?.relationshipHomeLocation ?? null;
  const totalSpent = pins.reduce((sum, p) => sum + Math.abs(p.amount), 0);
  const latestPin = pins[0];
  const HeadingTag = headingLevel === 1 ? 'h1' : 'h2';

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <HeadingTag className="text-3xl font-bold tracking-tight">{title}</HeadingTag>
          <p className="text-muted-foreground">{subtitle}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[520px]">
          <Card className="px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <MapPin className="h-4 w-4 text-violet-500" />
              {loading ? 'Loading...' : `${pins.length} places`}
            </div>
          </Card>
          <Card className="px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <DollarSign className="h-4 w-4 text-emerald-500" />
              {loading ? 'Loading...' : formatAmount(totalSpent)}
            </div>
          </Card>
          <Card className="px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <CalendarDays className="h-4 w-4 text-sky-500" />
              {latestPin ? formatDate(latestPin.date) : loading ? 'Loading...' : 'No visits yet'}
            </div>
          </Card>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full border border-white bg-violet-500 shadow-sm" />
          Places visited
        </span>
        {home && (
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-full border border-white bg-amber-500 shadow-sm" />
            {home.label}
          </span>
        )}
        <span>Precise home address intentionally not shown.</span>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {error ? 'Failed to load pins' : 'Click a marker or list item to see details'}
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-hidden rounded-b-xl p-0">
            {loading ? (
              <div className="flex h-[520px] items-center justify-center bg-muted/40 text-sm text-muted-foreground">
                Loading relationship pins...
              </div>
            ) : error ? (
              <div className="flex h-[520px] flex-col items-center justify-center gap-3 px-6 text-center text-sm text-muted-foreground">
                <p>Unable to load pins from GraphQL.</p>
                <button
                  type="button"
                  onClick={() => {
                    setActivePin(null);
                    setHomeOpen(false);
                    try {
                      void Promise.resolve(refetch()).catch(() => undefined);
                    } catch {
                      // Keep retry failures inside the visible GraphQL error state.
                    }
                  }}
                  className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-foreground transition-colors hover:bg-accent"
                >
                  <RefreshCw className="h-4 w-4" />
                  Retry
                </button>
              </div>
            ) : !apiKey ? (
              <div className="flex h-[520px] items-center justify-center px-6 text-center text-sm text-muted-foreground">
                Set <code className="mx-1 rounded bg-muted px-1 font-mono">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to enable the map.
              </div>
            ) : !mapId ? (
              <div className="flex h-[520px] items-center justify-center px-6 text-center text-sm text-muted-foreground">
                Set <code className="mx-1 rounded bg-muted px-1 font-mono">NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID</code> (AdvancedMarker requires a Map ID with Advanced Markers enabled).
              </div>
            ) : (
              <APIProvider apiKey={apiKey}>
                <Map
                  style={{ width: '100%', height: 'min(68vh, 620px)', minHeight: '420px' }}
                  defaultCenter={SYDNEY}
                  defaultZoom={13}
                  mapId={mapId}
                  gestureHandling="cooperative"
                  disableDefaultUI={false}
                >
                  {pins.map((pin) => (
                    <AdvancedMarker
                      key={pin.id}
                      position={{ lat: pin.lat, lng: pin.lng }}
                      onClick={() => setActivePin(pin)}
                    >
                      <div className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-violet-500 shadow-md transition-transform hover:scale-110">
                        <MapPin className="h-4 w-4 text-white" />
                      </div>
                    </AdvancedMarker>
                  ))}

                  {home && (
                    <AdvancedMarker
                      position={{ lat: home.lat, lng: home.lng }}
                      onClick={() => setHomeOpen(true)}
                      zIndex={10}
                    >
                      <div
                        data-testid="home-marker"
                        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-amber-500 shadow-lg transition-transform hover:scale-110"
                        aria-label={home.label}
                      >
                        <Home className="h-4 w-4 text-white" />
                      </div>
                    </AdvancedMarker>
                  )}

                  {home && homeOpen && (
                    <InfoWindow
                      position={{ lat: home.lat, lng: home.lng }}
                      onCloseClick={() => setHomeOpen(false)}
                    >
                      <div className="min-w-[120px] p-1">
                        <p className="text-sm font-semibold">{home.label}</p>
                      </div>
                    </InfoWindow>
                  )}

                  {activePin && (
                    <InfoWindow
                      position={{ lat: activePin.lat, lng: activePin.lng }}
                      onCloseClick={() => setActivePin(null)}
                    >
                      <div className="min-w-[180px] p-1">
                        <p className="text-sm font-semibold">{activePin.placeName}</p>
                        <p className="mt-0.5 text-xs text-gray-500">{formatDate(activePin.date)}</p>
                        <p className="mt-1 text-sm font-medium text-emerald-600">
                          {formatAmount(activePin.amount)}
                        </p>
                        {(activePin.category || activePin.payment) && (
                          <p className="mt-1 text-xs text-gray-500">
                            {[activePin.category, activePin.payment].filter(Boolean).join(' · ')}
                          </p>
                        )}
                      </div>
                    </InfoWindow>
                  )}
                </Map>
              </APIProvider>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Visit timeline</CardTitle>
          </CardHeader>
          <CardContent className="max-h-[620px] space-y-2 overflow-auto">
            {loading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="h-16 animate-pulse rounded-lg bg-muted" />
              ))
            ) : pins.length === 0 ? (
              <p className="text-sm text-muted-foreground">No visits to list yet.</p>
            ) : (
              pins.map((pin) => (
                <button
                  type="button"
                  key={pin.id}
                  onClick={() => setActivePin(pin)}
                  className="w-full rounded-lg border p-3 text-left transition-colors hover:bg-accent"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{pin.placeName}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(pin.date)}</p>
                    </div>
                    <p className="text-sm font-semibold text-emerald-600">{formatAmount(pin.amount)}</p>
                  </div>
                  {(pin.category || pin.payment) && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {[pin.category, pin.payment].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </button>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
