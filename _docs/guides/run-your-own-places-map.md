# Run your own Places map

Places is a private Google Map of the places two people have been together. Each visit is a **Pin**: a date, a name, a spot on the map and, optionally, what you spent there. Pins at the same spot stack into one marker, and the page lists them as a timeline. One person is the ADMIN; the other is given the PARTNER role. Both can add and edit pins from their phones, and only the ADMIN can delete them.

This guide takes you from a spending spreadsheet to that map. It assumes you already run this repo locally: see **Getting Started** in the [README](../../README.md).

> **Privacy first.** Your pins are real places, dates and amounts. Keep the CSV out of git: `backend/scripts/pins*.csv` and `pins*.json` are ignored. Use made-up data in screenshots and examples, and never put home coordinates in a `NEXT_PUBLIC_*` variable, because those are bundled into the browser.

---

## 1. Google Cloud: one project, three APIs, two keys

1. Create a Google Cloud project and **link a billing account**. Maps Platform APIs, Places API (New) in particular, refuse requests without one, even inside the free monthly credit.
2. Enable three APIs:
   - **Maps JavaScript API**: the map itself
   - **Places API (New)**: the "Search Google Maps" box in the add/edit form
   - **Geocoding API**: the importer turns place names into coordinates
3. Create two API keys:

   | Key | Restrict to APIs | Application restriction | Goes in |
   |---|---|---|---|
   | Browser key | Maps JavaScript API, Places API (New) | HTTP referrers: your domain and `http://localhost:3000/*` | `frontend/.env.local` → `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` |
   | Server key | Geocoding API | None, or your server's IP | `backend/.env` → `GEOCODING_API_KEY` |

4. Create a **Map ID**: Google Maps Platform → Map Management → Create, type JavaScript. Markers use Advanced Markers, which need one. `DEMO_MAP_ID` works on localhost only.
5. Set a **budget alert** and per-day **quota caps** on the three APIs. A two-person map stays far inside the free credit, and caps keep a leaked key cheap.

```bash
# frontend/.env.local
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_browser_key
NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID=your_map_id

# backend/.env
GEOCODING_API_KEY=your_server_key
# Optional amber "home" marker, shown to ADMIN and PARTNER. Backend only, never NEXT_PUBLIC_.
RELATIONSHIP_HOME_LAT=
RELATIONSHIP_HOME_LNG=
RELATIONSHIP_HOME_LABEL="Home base"
```

## 2. Accounts: an ADMIN and a PARTNER

1. Register both accounts on the site.
2. Make yourself ADMIN. There is no UI for the first admin, so set it in MongoDB:
   ```js
   db.users.updateOne({ email: "you@example.com" }, { $set: { role: "ADMIN" } })
   ```
3. Sign in, open **Admin → Users**, and choose **Grant Partner Access** on the other account.

`/places` is visible only to ADMIN and PARTNER. Anyone else is sent home, and signed-out visitors go to login first.

## 3. From spreadsheet to CSV

Export your sheet as CSV with this header. Columns can be in any order:

```csv
date,placeName,amount,category,payment,city,countryCode,notes
2026-04-26,Corner Cafe,42.50,Eat out,Card,Sydney,AU,
2026-05-03,Harbour Bistro,18.00,Eat out,Card,Sydney,AU,anniversary
```

- `date` (YYYY-MM-DD), `placeName` and `amount` (positive) are required.
- `city` and `countryCode` help geocoding find the right branch of a chain.
- Optional `lat,lng` columns skip geocoding for that row. Use them for places Google gets wrong.
- Save it as `backend/scripts/pins.csv`.

## 4. Import: check, preview, write

```bash
cd backend
npx ts-node scripts/seed-pins.ts --input ./scripts/pins.csv --dry-run   # shape only: no Google, no database
npx ts-node scripts/seed-pins.ts --input ./scripts/pins.csv --preview   # geocodes, writes nothing
npx ts-node scripts/seed-pins.ts --input ./scripts/pins.csv             # writes to MONGODB_URI
```

`--preview` prints one line per row:

| Status | Meaning | What to do |
|---|---|---|
| `ok` | Google found an establishment | Nothing |
| `CHECK` | Partial match, or a suburb or street rather than a venue | Check it on Maps; add `lat,lng` if it is wrong |
| `FAIL` | Geocoding error, with Google's message | Usually the key or billing (step 1); otherwise add `lat,lng` |
| `MANUAL` | The row already has `lat,lng` | Nothing |

Right-click a spot in Google Maps to copy its coordinates.

The import **upserts on place name + date + amount**, so running it again with the same file inserts nothing. Add new rows to the sheet, export again, and re-run. Only `--replace` deletes existing pins first.

> **Check where `MONGODB_URI` points before the last command.** If `backend/.env` holds your production database, the import writes to production.

## 5. Use it

Open `/places` on your phone.

- **Add place:** search Google Maps or tap **Pick on map**, then set the date. The spend is optional, for visits where nothing was spent.
- **Repeat visits:** visits that share a Google place or the exact same coordinates stack on one marker with a count. Tap it to see every visit and edit each one.
- **Timeline:** shows the latest 3 visits, with **See more** for the rest.

## 6. Production: the Content-Security-Policy

If your server sends a CSP header (this repo's nginx does), it must allow Google's hosts. If it doesn't, the map or the place search fails quietly:

```
script-src  … https://maps.googleapis.com https://maps.gstatic.com
connect-src … https://maps.googleapis.com https://places.googleapis.com https://maps.gstatic.com
font-src    … https://maps.gstatic.com
img-src     … data: https:
worker-src  'self' blob:
```

The trap we hit: without `https://places.googleapis.com` in `connect-src`, the map loads, but search shows "Place search is unavailable. Pick the spot on the map instead." The browser console says only `xhr error, error code 6`. The key is fine, so a curl test passes.

## 7. Make it yours

Places was built for Sydney. To move it, change these:

| What | Where |
|---|---|
| Map's starting centre | `SYDNEY` in `frontend/src/components/relationship/RelationshipMap.tsx` |
| Currency and date format (`AUD`, `en-AU`) | `formatAmount` / `formatDate` in the same file, and the "Spent (AUD)" label in `PinFormDialog.tsx` |
| Fallback spot for `--allow-fallback` | `SYDNEY` in `backend/scripts/seed-pins.ts` |

## Where things live

| Piece | Path |
|---|---|
| Pin model and API | `backend/src/models/Pin.ts`, `backend/src/resolvers/pins/`, Shield rules in `backend/src/validation/shield.ts` |
| Importer | `backend/scripts/seed-pins.ts` |
| Page | `frontend/src/app/places/` |
| Map, form, search, stacking | `frontend/src/components/relationship/` |
| Domain terms (Pin, Place, Places map, Importer) | [`CONTEXT.md`](../../CONTEXT.md) |
| How it was built | [`v3.25-places.md`](../featureBreakdown/v3.25-places.md), [`v3.26-places-mobile.md`](../featureBreakdown/v3.26-places-mobile.md) |
