'use client';

import { useEffect, useRef, useState } from 'react';
import { Crosshair, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useKeyboardInset } from '@/lib/hooks/useKeyboardInset';
import { NO_AUTOFILL } from './noAutofill';
import { PlaceChip } from './PlaceChip';
import { PlaceSearch } from './PlaceSearch';
import { applyPlaceSelection, validatePinForm, type PinFormErrors, type PinFormValues } from './pinForm';

interface PinFormDialogProps {
  open: boolean;
  mode: 'create' | 'edit';
  initialValues: PinFormValues;
  categories: string[];
  payments: string[];
  /** Place search and map picking both need the Maps API key and Map ID. */
  mapsEnabled: boolean;
  searchBias?: google.maps.LatLngLiteral;
  canDelete: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: PinFormValues) => Promise<void>;
  onDelete?: () => Promise<void>;
  /** Hands the current values back so the dialog can close while the map is tapped. */
  onPickOnMap: (values: PinFormValues) => void;
}

const fieldError = (message?: string) => message && <p className="text-xs text-destructive">{message}</p>;

// Grid items default to min-width: auto, and iOS Safari gives a date input a wide intrinsic
// width, so the Date cell overflowed into Spent. min-w-0 lets each cell shrink to its column.
const CELL = 'min-w-0 space-y-2';
// Without appearance-none iOS draws its own date control, which ignores the width and centres the text.
const DATE_INPUT = 'appearance-none [&::-webkit-date-and-time-value]:text-left';
// The iOS keyboard animates in for about this long; centring the field before it settles misses.
const KEYBOARD_SETTLE_MS = 300;

/**
 * Add or edit a pin. Mounted with a key per session, so initialValues seed state once.
 * Below `sm` it is a full-height sheet: the header and the Add place footer stay put and only
 * the fields scroll, and the sheet is inset to the area above the iOS keyboard.
 */
export function PinFormDialog({
  open,
  mode,
  initialValues,
  categories,
  payments,
  mapsEnabled,
  searchBias,
  canDelete,
  onOpenChange,
  onSubmit,
  onDelete,
  onPickOnMap,
}: PinFormDialogProps) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<PinFormErrors>({});
  const [saving, setSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [changingPlace, setChangingPlace] = useState(false);
  const inset = useKeyboardInset();
  const focusTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(focusTimer.current), []);

  const set = <K extends keyof PinFormValues>(key: K, value: PinFormValues[K]) =>
    setValues((current) => ({ ...current, [key]: value }));

  const run = async (action: () => Promise<void>) => {
    setSaving(true);
    setSubmitError(null);
    try {
      await action();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const found = validatePinForm(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    void run(() => onSubmit(values));
  };

  const centreFocusedField = (event: React.FocusEvent<HTMLFormElement>) => {
    const field = event.target;
    if (!(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement)) return;
    clearTimeout(focusTimer.current);
    focusTimer.current = setTimeout(() => field.scrollIntoView({ block: 'center' }), KEYBOARD_SETTLE_MS);
  };

  const hasLocation = values.lat !== null && values.lng !== null;

  // Change keeps the name: it is about where the place is, not what it is called.
  const clearLocation = () => {
    setValues((current) => ({ ...current, lat: null, lng: null, placeId: '', address: '', city: '', countryCode: '' }));
    setChangingPlace(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        style={{ '--kb-top': `${inset.top}px`, '--kb': `${inset.bottom}px` } as React.CSSProperties}
        className="flex max-h-[90dvh] flex-col gap-0 p-0 sm:max-w-lg max-sm:inset-x-0 max-sm:top-(--kb-top) max-sm:bottom-(--kb) max-sm:max-h-none max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-none max-sm:border-x-0"
      >
        <DialogHeader className="shrink-0 border-b px-6 pb-4 pr-12 pt-5">
          <DialogTitle>{mode === 'create' ? 'Add a place' : 'Edit place'}</DialogTitle>
          <DialogDescription>
            {mode === 'create' ? 'Search for it, or pick the spot on the map.' : 'Change what you need; the rest stays.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} onFocus={centreFocusedField} className="flex min-h-0 flex-1 flex-col" autoComplete="off" noValidate>
          <div data-testid="pin-form-body" className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-6 py-4">
            <div className="space-y-2">
              <Label>Location</Label>
              {hasLocation ? (
                <PlaceChip values={values} onChange={clearLocation} />
              ) : (
                <>
                  {mapsEnabled && (
                    <PlaceSearch
                      bias={searchBias}
                      autoFocus={changingPlace}
                      onSelect={(place) => setValues((current) => applyPlaceSelection(current, place))}
                    />
                  )}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="text-muted-foreground">No location yet</span>
                    <Button type="button" variant="outline" size="sm" disabled={!mapsEnabled} onClick={() => onPickOnMap(values)}>
                      <Crosshair className="mr-1 h-3.5 w-3.5" />
                      Pick on map
                    </Button>
                  </div>
                </>
              )}
              {fieldError(errors.location)}
            </div>

            <div className="space-y-2">
              <Label htmlFor="pin-place-name">Name</Label>
              <Input
                id="pin-place-name"
                name="place"
                enterKeyHint="next"
                {...NO_AUTOFILL}
                value={values.placeName}
                onChange={(event) => set('placeName', event.target.value)}
                maxLength={160}
              />
              {fieldError(errors.placeName)}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className={CELL}>
                <Label htmlFor="pin-date">Date</Label>
                <Input
                  id="pin-date"
                  name="visitDate"
                  type="date"
                  {...NO_AUTOFILL}
                  value={values.date}
                  onChange={(event) => set('date', event.target.value)}
                  className={DATE_INPUT}
                />
                {fieldError(errors.date)}
              </div>
              <div className={CELL}>
                <Label htmlFor="pin-amount">Spent (AUD)</Label>
                <div className="relative">
                  <span aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    $
                  </span>
                  <Input
                    id="pin-amount"
                    name="spent"
                    // Not type="number": Safari empties it when the keypad types a decimal comma.
                    type="text"
                    inputMode="decimal"
                    enterKeyHint="next"
                    placeholder="Optional"
                    className="pl-6"
                    {...NO_AUTOFILL}
                    value={values.amount}
                    onChange={(event) => set('amount', event.target.value)}
                  />
                </div>
                {fieldError(errors.amount)}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className={CELL}>
                <Label htmlFor="pin-category">Category</Label>
                <Input
                  id="pin-category"
                  name="category"
                  list="pin-category-options"
                  enterKeyHint="next"
                  {...NO_AUTOFILL}
                  value={values.category}
                  onChange={(event) => set('category', event.target.value)}
                  maxLength={80}
                />
                <datalist id="pin-category-options">
                  {categories.map((value) => (
                    <option key={value} value={value} />
                  ))}
                </datalist>
              </div>
              <div className={CELL}>
                <Label htmlFor="pin-paid-with">Payment</Label>
                <Input
                  id="pin-paid-with"
                  name="paidWith"
                  list="pin-paid-with-options"
                  enterKeyHint="done"
                  {...NO_AUTOFILL}
                  value={values.payment}
                  onChange={(event) => set('payment', event.target.value)}
                  maxLength={80}
                />
                <datalist id="pin-paid-with-options">
                  {payments.map((value) => (
                    <option key={value} value={value} />
                  ))}
                </datalist>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pin-notes">Notes</Label>
              <Textarea
                id="pin-notes"
                name="notes"
                rows={3}
                {...NO_AUTOFILL}
                value={values.notes}
                onChange={(event) => set('notes', event.target.value)}
                maxLength={500}
                placeholder="What made it worth remembering"
              />
            </div>

            {submitError && <p className="text-sm text-destructive">{submitError}</p>}
          </div>

          <DialogFooter className="shrink-0 gap-2 border-t px-6 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:justify-between">
            {mode === 'edit' && canDelete && onDelete ? (
              confirmingDelete ? (
                <div className="flex items-center gap-2">
                  <Button type="button" variant="destructive" size="sm" disabled={saving} onClick={() => void run(onDelete)}>
                    Delete for good
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmingDelete(false)}>
                    Keep
                  </Button>
                </div>
              ) : (
                <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => setConfirmingDelete(true)}>
                  <Trash2 className="mr-1 h-4 w-4" />
                  Delete
                </Button>
              )
            ) : (
              <span />
            )}
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === 'create' ? 'Add place' : 'Save changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
