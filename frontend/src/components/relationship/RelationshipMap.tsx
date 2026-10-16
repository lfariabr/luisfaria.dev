'use client';

import { useMemo, useRef, useState, type ReactNode } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { APIProvider, Map, AdvancedMarker, InfoWindow } from '@vis.gl/react-google-maps';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, Crosshair, DollarSign, Eye, EyeOff, Home, MapPin, Pencil, Plus, RefreshCw, X } from 'lucide-react';
import { GET_PINS, GET_HOME_LOCATION } from '@/lib/graphql/queries/pin.queries';
import { CREATE_PIN, DELETE_PIN, UPDATE_PIN } from '@/lib/graphql/mutations/pin.mutations';
import type { Pin, PinsData, RelationshipHomeData } from '@/lib/graphql/types/pin.types';
import { useCanViewRelationshipPins, useIsAdmin } from '@/lib/auth/isAdmin';
import { PinFormDialog } from './PinFormDialog';
import { groupPinsByPlace } from './placeGroups';
import { displayAmount, formatDate } from './format';
import { useAmountsHidden } from './amountsVisibility';
import { PlacePopup, PlacePopupTitle } from './PlacePopup';
import {
  applyPlaceSelection,
  emptyPinFormValues,
  pinToFormValues,
  suggestionsFrom,
  toCreateInput,
  toUpdateInput,
  type PinFormValues,
} from './pinForm';

const SYDNEY = { lat: -33.8688, lng: 151.2093 };
// The timeline opens on the latest few visits; the rest sit behind See more.
const TIMELINE_PREVIEW = 3;

interface RelationshipMapProps {
  title?: string;
  subtitle?: string;
  headingLevel?: 1 | 2;
}

function StatPill({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs font-medium shadow-xs sm:text-sm">
      {icon}
      {children}
    </span>
  );
}

/** One add or edit session. `key` remounts the dialog so it reseeds from `values`. */
interface FormSession {
  key: number;
  mode: 'create' | 'edit';
  pin?: Pin;
  values: PinFormValues;
  /** Map centre when the form opened; biases place search toward what's on screen. */
  bias: google.maps.LatLngLiteral;
}

const refetchPins = { refetchQueries: [{ query: GET_PINS }], awaitRefetchQueries: true };

function MapsProvider({ apiKey, children }: { apiKey: string; children: ReactNode }) {
  return apiKey ? <APIProvider apiKey={apiKey}>{children}</APIProvider> : <>{children}</>;
}

export function RelationshipMap({
  title = 'Our Places',
  subtitle = "Places we've been together",
  headingLevel = 1,
}: RelationshipMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID ?? '';
  const { data, loading, error, refetch } = useQuery<PinsData>(GET_PINS);
  const { data: homeData } = useQuery<RelationshipHomeData>(GET_HOME_LOCATION, {
    errorPolicy: 'ignore',
  });
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [homeOpen, setHomeOpen] = useState(false);
  const [session, setSession] = useState<FormSession | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [picking, setPicking] = useState(false);
  const [showAllVisits, setShowAllVisits] = useState(false);
  const [amountsHidden, toggleAmounts] = useAmountsHidden();
  const mapCenter = useRef<google.maps.LatLngLiteral>(SYDNEY);
  const canEdit = useCanViewRelationshipPins();
  const isAdmin = useIsAdmin();
  const [createPin] = useMutation(CREATE_PIN, refetchPins);
  const [updatePin] = useMutation(UPDATE_PIN, refetchPins);
  const [deletePin] = useMutation(DELETE_PIN, refetchPins);

  const pins = useMemo(() => data?.pins ?? [], [data]);
  const places = useMemo(() => groupPinsByPlace(pins), [pins]);
  const activePlace = places.find((place) => place.key === activeKey) ?? null;
  const showPlaceOf = (pin: Pin) => setActiveKey(places.find((place) => place.visits.includes(pin))?.key ?? null);
  const home = homeData?.relationshipHomeLocation ?? null;
  const totalSpent = pins.reduce((sum, p) => sum + Math.abs(p.amount ?? 0), 0);
  const mapReady = Boolean(apiKey && mapId);

  const openForm = (mode: 'create' | 'edit', pin?: Pin) => {
    setActiveKey(null);
    setSession({
      key: Date.now(),
      mode,
      pin,
      values: pin ? pinToFormValues(pin) : emptyPinFormValues(),
      bias: mapCenter.current,
    });
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setPicking(false);
    setSession(null);
  };

  const startPicking = (values: PinFormValues) => {
    setSession((current) => current && { ...current, values });
    setFormOpen(false);
    setPicking(true);
  };

  const finishPicking = (latLng: google.maps.LatLngLiteral) => {
    setSession((current) => current && { ...current, key: Date.now(), values: applyPlaceSelection(current.values, latLng) });
    setPicking(false);
    setFormOpen(true);
  };

  const handleSubmit = async (values: PinFormValues) => {
    if (session?.mode === 'edit' && session.pin) {
      const input = toUpdateInput(session.pin, values);
      if (Object.keys(input).length > 0) await updatePin({ variables: { id: session.pin.id, input } });
    } else {
      await createPin({ variables: { input: toCreateInput(values) } });
    }
    closeForm();
  };

  const handleDelete = async () => {
    if (!session?.pin) return;
    await deletePin({ variables: { id: session.pin.id } });
    closeForm();
  };

  const draft = session && (picking || formOpen) ? session.values : null;
  const latestPin = pins[0];
  const timelineVisits = showAllVisits ? pins : pins.slice(0, TIMELINE_PREVIEW);
  const hiddenVisits = pins.length - TIMELINE_PREVIEW;
  const HeadingTag = headingLevel === 1 ? 'h1' : 'h2';

  return (
    <MapsProvider apiKey={apiKey}>
      <div className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <HeadingTag className="text-3xl font-bold tracking-tight">{title}</HeadingTag>
              <p className="text-muted-foreground">{subtitle}</p>
            </div>
            {canEdit && (
              <Button type="button" onClick={() => openForm('create')} disabled={loading || Boolean(error)} className="shrink-0">
                <Plus className="mr-1 h-4 w-4" />
                Add place
              </Button>
            )}
          </div>

          <div data-testid="place-stats" className="flex flex-wrap items-center gap-2">
            <StatPill icon={<MapPin className="h-3.5 w-3.5 text-violet-500" />}>
              {loading ? 'Loading...' : `${places.length} places · ${pins.length} visits`}
            </StatPill>
            <StatPill icon={<DollarSign className="h-3.5 w-3.5 text-emerald-500" />}>
              {loading ? 'Loading...' : displayAmount(totalSpent, amountsHidden)}
            </StatPill>
            <StatPill icon={<CalendarDays className="h-3.5 w-3.5 text-sky-500" />}>
              {latestPin ? formatDate(latestPin.date) : loading ? 'Loading...' : 'No visits yet'}
            </StatPill>
            <button
              type="button"
              onClick={toggleAmounts}
              aria-label={amountsHidden ? 'Show amounts' : 'Hide amounts'}
              title={amountsHidden ? 'Show amounts' : 'Hide amounts'}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full border bg-card text-muted-foreground shadow-xs transition-colors hover:bg-accent hover:text-foreground"
            >
              {amountsHidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
            {home && (
              <span className="flex items-center gap-1.5 px-1 text-xs text-muted-foreground">
                <span className="inline-block h-3 w-3 rounded-full border border-white bg-amber-500 shadow-sm" />
                {home.label}
              </span>
            )}
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <Card>
            <CardHeader>
              {picking ? (
                <div className="flex items-center justify-between gap-3 rounded-md bg-violet-500/10 px-3 py-2 text-sm text-violet-700 dark:text-violet-300">
                  <span className="flex items-center gap-2">
                    <Crosshair className="h-4 w-4" />
                    Tap the map where the place is
                  </span>
                  <Button type="button" variant="ghost" size="sm" onClick={() => { setPicking(false); setFormOpen(true); }}>
                    <X className="mr-1 h-4 w-4" />
                    Back to form
                  </Button>
                </div>
              ) : (
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {error ? (
                    'Failed to load pins'
                  ) : (
                    <>
                      <span className="sm:hidden">Tap a pin for details</span>
                      <span className="hidden sm:inline">Click a marker or list item to see details</span>
                    </>
                  )}
                </CardTitle>
              )}
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
                      setActiveKey(null);
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
                <Map
                  style={{ width: '100%', height: 'min(68vh, 620px)', minHeight: '420px' }}
                  defaultCenter={SYDNEY}
                  defaultZoom={13}
                  mapId={mapId}
                  gestureHandling="cooperative"
                  disableDefaultUI={false}
                  draggableCursor={picking ? 'crosshair' : undefined}
                  onCameraChanged={(event) => {
                    mapCenter.current = event.detail.center;
                  }}
                  onClick={(event) => {
                    if (picking && event.detail.latLng) finishPicking(event.detail.latLng);
                  }}
                >
                  {places.map((place) => (
                    <AdvancedMarker
                      key={place.key}
                      position={{ lat: place.lat, lng: place.lng }}
                      onClick={() => !picking && setActiveKey(place.key)}
                    >
                      <div className="relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-violet-500 shadow-md transition-transform hover:scale-110">
                        <MapPin className="h-4 w-4 text-white" />
                        {place.visits.length > 1 && (
                          <span
                            data-testid="visit-count"
                            className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-gray-900 px-1 text-[10px] font-bold text-white"
                          >
                            {place.visits.length}
                          </span>
                        )}
                      </div>
                    </AdvancedMarker>
                  ))}

                  {draft && draft.lat !== null && draft.lng !== null && (
                    <AdvancedMarker position={{ lat: draft.lat, lng: draft.lng }} zIndex={20}>
                      <div
                        data-testid="draft-marker"
                        className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-rose-500 shadow-lg"
                      >
                        <Plus className="h-4 w-4 text-white" />
                      </div>
                    </AdvancedMarker>
                  )}

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

                  {activePlace && (
                    <InfoWindow
                      position={{ lat: activePlace.lat, lng: activePlace.lng }}
                      onCloseClick={() => setActiveKey(null)}
                      headerContent={<PlacePopupTitle place={activePlace} />}
                    >
                      <PlacePopup place={activePlace} canEdit={canEdit} amountsHidden={amountsHidden} onEdit={(visit) => openForm('edit', visit)} />
                    </InfoWindow>
                  )}
                </Map>
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
                timelineVisits.map((pin) => (
                  <div key={pin.id} data-testid="timeline-visit" className="relative rounded-lg border transition-colors hover:bg-accent">
                    <button type="button" onClick={() => showPlaceOf(pin)} className="w-full p-3 pr-10 text-left">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium">{pin.placeName}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(pin.date)}</p>
                        </div>
                        {pin.amount != null && (
                          <p className="text-sm font-semibold text-emerald-600">{displayAmount(pin.amount, amountsHidden)}</p>
                        )}
                      </div>
                      {(pin.category || pin.payment) && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          {[pin.category, pin.payment].filter(Boolean).join(' · ')}
                        </p>
                      )}
                    </button>
                    {canEdit && (
                      <button
                        type="button"
                        aria-label={`Edit ${pin.placeName}`}
                        onClick={() => openForm('edit', pin)}
                        className="absolute bottom-2 right-2 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))
              )}
              {hiddenVisits > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => setShowAllVisits((current) => !current)}
                >
                  {showAllVisits ? 'Show less' : `See more (${hiddenVisits})`}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {session && (
          <PinFormDialog
            key={session.key}
            open={formOpen}
            mode={session.mode}
            initialValues={session.values}
            categories={suggestionsFrom(pins, 'category')}
            payments={suggestionsFrom(pins, 'payment')}
            mapsEnabled={mapReady}
            searchBias={session.bias}
            canDelete={isAdmin}
            onOpenChange={(open) => {
              if (!open) closeForm();
            }}
            onSubmit={handleSubmit}
            onDelete={handleDelete}
            onPickOnMap={startPicking}
          />
        )}
      </div>
    </MapsProvider>
  );
}
