/**
 * Spread on every input in the pin form. iOS Safari read the form as a card form and offered
 * saved cards and "Amex" in Spent; the data attributes keep 1Password and LastPass out too.
 */
export const NO_AUTOFILL = {
  autoComplete: 'off',
  'data-1p-ignore': true,
  'data-lpignore': 'true',
} as const;
