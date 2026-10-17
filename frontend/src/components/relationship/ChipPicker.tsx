'use client';

import { useId, useState } from 'react';
import { Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { NO_AUTOFILL } from './noAutofill';

interface ChipPickerProps {
  label: string;
  /** The text input's `name`, for the value typed under "+ New". */
  name: string;
  /** Past values, most used first. */
  options: string[];
  /** Offered only when there is no history yet. */
  seeds?: string[];
  value: string;
  onChange: (value: string) => void;
  enterKeyHint?: 'next' | 'done';
}

const TOP = 6;
const CHIP =
  'inline-flex min-h-11 shrink-0 items-center gap-1 rounded-full border px-4 text-sm whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

/**
 * One tap for a value used before, instead of typing it. The field is optional, so tapping
 * the selected chip clears it. A saved value outside the top few stays visible and selected.
 */
export function ChipPicker({ label, name, options, seeds = [], value, onChange, enterKeyHint = 'next' }: ChipPickerProps) {
  const labelId = useId();
  const [typing, setTyping] = useState(false);
  const offered = options.length > 0 ? options.slice(0, TOP) : seeds;
  const chips = value && !offered.includes(value) && !typing ? [value, ...offered] : offered;
  const newLabel = `New ${label.toLowerCase()}`;

  return (
    <div className="space-y-2">
      <span id={labelId} className="text-sm font-medium leading-none">
        {label}
      </span>
      <div role="radiogroup" aria-labelledby={labelId} className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {chips.map((chip) => {
          const checked = !typing && chip === value;
          return (
            <button
              key={chip}
              type="button"
              role="radio"
              aria-checked={checked}
              onClick={() => {
                setTyping(false);
                onChange(checked ? '' : chip);
              }}
              className={`${CHIP} ${checked ? 'border-violet-500 bg-violet-500/15 font-medium text-foreground' : 'bg-card text-muted-foreground hover:bg-accent'}`}
            >
              {chip}
            </button>
          );
        })}
        {!typing && (
          <button
            type="button"
            aria-label={newLabel}
            onClick={() => {
              setTyping(true);
              onChange('');
            }}
            className={`${CHIP} border-dashed bg-card text-muted-foreground hover:bg-accent`}
          >
            <Plus className="h-3.5 w-3.5" />
            New
          </button>
        )}
      </div>
      {typing && (
        <Input
          aria-label={newLabel}
          name={name}
          autoFocus
          enterKeyHint={enterKeyHint}
          maxLength={80}
          {...NO_AUTOFILL}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </div>
  );
}
