export function formatDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Unknown date';

  return date.toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatAmount(amount: number) {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(Math.abs(amount));
}

/** Stands in for an amount while amounts are hidden; same width whatever the spend. */
export const HIDDEN_AMOUNT = '$••••';

export const displayAmount = (amount: number, hidden: boolean) => (hidden ? HIDDEN_AMOUNT : formatAmount(amount));
