'use client';

import { useState } from 'react';
import { Crosshair, Loader2, MapPin, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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

/**
 * Add or edit a pin. Mounted with a key per session, so initialValues seed state once.
 * Below `sm` the dialog docks to the bottom edge like a sheet.
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

  const hasLocation = values.lat !== null && values.lng !== null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto max-sm:bottom-0 max-sm:top-auto max-sm:max-w-none max-sm:translate-y-0 max-sm:rounded-b-none sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Add a place' : 'Edit place'}</DialogTitle>
          <DialogDescription>
            {mode === 'create' ? 'Search for it, or pick the spot on the map.' : 'Change what you need; the rest stays.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label>Location</Label>
            {mapsEnabled && (
              <PlaceSearch bias={searchBias} onSelect={(place) => setValues((current) => applyPlaceSelection(current, place))} />
            )}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className={hasLocation ? 'flex items-center gap-1 text-emerald-600' : 'text-muted-foreground'}>
                {hasLocation ? (
                  <>
                    <MapPin className="h-3.5 w-3.5" />
                    {values.placeId ? 'Google place' : 'Picked on map'} ({values.lat?.toFixed(4)}, {values.lng?.toFixed(4)})
                  </>
                ) : (
                  'No location yet'
                )}
              </span>
              <Button type="button" variant="outline" size="sm" disabled={!mapsEnabled} onClick={() => onPickOnMap(values)}>
                <Crosshair className="mr-1 h-3.5 w-3.5" />
                Pick on map
              </Button>
            </div>
            {fieldError(errors.location)}
          </div>

          <div className="space-y-2">
            <Label htmlFor="pin-place-name">Name</Label>
            <Input
              id="pin-place-name"
              value={values.placeName}
              onChange={(event) => set('placeName', event.target.value)}
              maxLength={160}
            />
            {fieldError(errors.placeName)}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="pin-date">Date</Label>
              <Input id="pin-date" type="date" value={values.date} onChange={(event) => set('date', event.target.value)} />
              {fieldError(errors.date)}
            </div>
            <div className="space-y-2">
              <Label htmlFor="pin-amount">Spent (AUD)</Label>
              <Input
                id="pin-amount"
                type="number"
                inputMode="decimal"
                min="0.01"
                step="0.01"
                placeholder="Optional"
                value={values.amount}
                onChange={(event) => set('amount', event.target.value)}
              />
              {fieldError(errors.amount)}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="pin-category">Category</Label>
              <Input
                id="pin-category"
                list="pin-category-options"
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
            <div className="space-y-2">
              <Label htmlFor="pin-payment">Payment</Label>
              <Input
                id="pin-payment"
                list="pin-payment-options"
                value={values.payment}
                onChange={(event) => set('payment', event.target.value)}
                maxLength={80}
              />
              <datalist id="pin-payment-options">
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
              rows={3}
              value={values.notes}
              onChange={(event) => set('notes', event.target.value)}
              maxLength={500}
              placeholder="What made it worth remembering"
            />
          </div>

          {submitError && <p className="text-sm text-destructive">{submitError}</p>}

          <DialogFooter className="gap-2 sm:justify-between">
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
