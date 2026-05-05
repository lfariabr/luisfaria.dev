## Goal

Make the pins GraphQL domain safe and maintainable with explicit validation, typed resolver context, and production-ready model constraints.

## Work

- Add a Zod `pinInputSchema` for `PinInput`.
- Validate date, place name, amount, latitude, longitude, optional category/payment/city/country/notes/source.
- Wire `createPin` through GraphQL Shield with `and(isAdmin, validatePinInput)`.
- Replace resolver `any` context with a typed minimum context.
- Wrap pin resolver DB calls with the shared error-handler pattern.
- Extend the Pin model with `city`, `countryCode`, `notes`, and `source`.
- Add coordinate bounds, string max lengths, city/date index, and duplicate guard index.

## Acceptance Criteria

- Anonymous and USER role requests remain blocked.
- ADMIN can create a valid pin.
- Invalid dates, empty names, impossible coordinates, and malformed country codes are rejected.
- Pins query returns newest dates first.
- Backend build passes.

## Verification

- `cd backend && npx jest src/__tests__/integration/pinResolvers.test.ts --runInBand`
- `cd backend && npm run build`
