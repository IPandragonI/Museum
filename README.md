# MUSEUM — an art discovery game

Four game modes (Guess the Artwork, The Mystery Detail, Who Is the Artist?, Art Timeline), a deterministic
Daily Challenge and unlimited Free Play — entirely client-side, installable and offline-capable.

## Run

```bash
npm install
npm run dev        # development
npm run build      # static export into ./out (host anywhere)
npx serve out      # preview the production build (service worker only runs in production)
npm test           # vitest: scoring, daily determinism, question validity, streaks, stats
```

## Architecture

| Path | Responsibility |
|---|---|
| `src/lib/game/` | Pure game logic: `config`, `scoring`, `reveal` (grid order), `questions` (generation + distractors), `daily` (UTC seed, streaks) |
| `src/lib/rng.ts` | Seeded PRNG (xmur3 + mulberry32) — nothing reproducible uses `Math.random` |
| `src/lib/storage/` | IndexedDB (`idb`): sessions, collection, daily progress, recent history. `repo.ts` is the only API the UI uses |
| `src/lib/stats.ts` | Statistics derived from stored sessions — never stored or hardcoded |
| `src/data/artworks.json` | Curated dataset, bundled at build time |
| `src/components/` | UI: `game/` (one component per mode + shell/results), `home/`, `collection/`, `stats/`, `settings/`, `ui/` |
| `public/sw.js` | Service worker (precaches every route + its assets; images cached on demand or via Settings) |
| `scripts/` | `ingest.mjs` (data pipeline), `seeds.mjs` (who to look for), `icons.mjs` |

Scoring (one model everywhere): Guess 100/75/50/25 by reveal stage; Detail & Artist 100 or 0; Timeline
`round(100 × exactly-placed / n)`. Accuracy = points earned / points available. Daily max = 1000.

Daily challenge = `generateDailyChallenge(dataset, "YYYY-MM-DD" in UTC)`; the dataset is sorted by id first, so
the result depends only on the date. Artworks are not reused across the four modes. Intermediate difficulty only.

## Data sources & licensing

All 280 artworks come from the **Cleveland Museum of Art Open Access API** (https://openaccess-api.clevelandart.org),
records flagged `CC0`. Titles, artists, dates, descriptions, "did you know" facts and artist biographies are copied verbatim
from those records; each artwork stores its source URL and licence. Records are dropped when attribution is uncertain
(workshop of / attributed to / multiple creators), dates span > 60 years, titles are generic, or no educational text exists.
Art movements are an artist-level label from `scripts/seeds.mjs` (the API has none). Difficulty comes from artist fame tier
(seed list), not from random per-question changes.

Images are downloaded once by `npm run ingest` (about 50 MB in `public/art/`); the game never calls any API at runtime.
**Mystery Detail crops are real crops** of the museum's high-resolution image (rectangle stored in the data, so the
exact location is shown after answering). Window size shrinks and "obviousness" drops with difficulty.

Re-run: `npm run ingest` (network required; polite throttling built in). Edit `scripts/seeds.mjs` to change the selection.

## Known limitations

- Only paintings, drawings, prints, sculpture, photographs and some decorative arts: no architecture items passed the
  CC0/image/date filters in this collection.
- Detail crops are chosen by an image-energy heuristic, not by a human curator; a few may be less iconic than ideal.
- English only (no i18n layer). Single museum source; tier-3 coverage per artist is thin.
- Offline: the app shell caches automatically; artwork images cache as seen or in bulk via Settings → "Download artworks".
- Drag-and-drop is pointer-based (mouse/touch) with arrow-key and button fallbacks; not yet tested on physical devices.
- Statistics' "best score" compares by score ratio, so a 3-question daily game and a 10-question game are comparable.
