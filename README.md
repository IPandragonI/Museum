# MUSEUM — a bilingual art discovery game (FR / EN)

Four game modes (Guess the Artwork, The Mystery Detail, Who Is the Artist?, Which Movement?), a deterministic Daily Challenge and unlimited
Free Play — entirely client-side, installable, offline-capable, French by default.

## Run

```bash
npm install
npm run dev        # development (copies the data to public/data first)
npm run build      # static export into ./out (host anywhere)
npx serve out      # preview the production build (the service worker only runs in production)
npm test           # vitest (scoring, daily determinism, question validity, hint/review/mastery logic, streaks, stats, i18n, compatibility)
```

Data pipeline (network needed, only when you want to change the collection):

```bash
node scripts/ingest.mjs select && node scripts/audit-fetch.mjs   # pick + re-fetch the museum records
node scripts/images-fetch.mjs                                    # cache 2600px working copies (once)
npm run curate && node scripts/images.mjs && npm run curate   # curation → WebP variants → merge
node scripts/merge-translations.mjs                              # French texts → src/data/translations.fr.json
```

## Architecture

| Path | Responsibility |
|---|---|
| `src/lib/game/` | Pure game logic: `config`, `scoring`, `questions` (generation, distractors, per-mode difficulty), `daily` (UTC seed, streaks). **Never imports the i18n layer** (a test enforces it), so questions/answers cannot depend on the language |
| `src/lib/i18n/` | `en.ts` (key set) → `fr.ts` (typed against it: a missing translation fails the build), `glossary.ts` (movements, periods, media, date phrasing), `index.ts` (`t`, `tn`, number/date/size formatting), `useI18n.ts` (the only hook components use) |
| `src/data/artworks.json` | Curated dataset (English museum text, untouched) · `translations.fr.json` French descriptions/facts/biographies keyed by artwork / artist. Source of truth for scripts and tests |
| `public/data/*.json` | Minified copies written by `scripts/sync-data.mjs` (runs before `dev` and `build`). The app **fetches** them once at runtime (`DataGate`) instead of bundling ~1.1 MB of JSON in every page; the service worker pre-caches them |
| `src/lib/storage/` | IndexedDB (`idb`): sessions, collection, daily progress, recent history |
| `src/lib/offline.ts` | Offline package: download with progress, resume, storage figures, removal |
| `public/sw.js` | Service worker: app shell precache, art cache with nearest-size fallback |
| `scripts/` | Ingestion, audit, curation (`curation.mjs`), crops, images, translation merge |
| `docs/audit/` | `AUDIT.md` (Phase 1 report) and `changes.json` (machine-readable change log) |

**Scoring** (one model everywhere): Guess 100, or 75 with the optional hint; Detail, Artist and Movement 100 or 0.
Daily max = 1200 (4 games × 3 questions). Streaks and the optional countdown never change points, so scores stay comparable between
Daily and Free Play. Old saved games remain valid in statistics.

**Game features**
- *Guess the Artwork*: four titles, immediate validation. The hint removes two wrong titles (−25 points). **Expert** Free Play removes the
  options: the player types the title and picks it from suggestions (the hint then names the artist).
- *Which Movement?*: each answer is followed by a one-line explanation of the right movement (and of the wrong pick) in French and English.
- *Review*: after a game, or from Statistics, replay only the artworks whose last attempt in that mode was wrong (they leave the list once answered correctly).
- *Mix*: 3 questions from each of the four games in one Free Play run (each block is saved as a normal session in its own mode).
- *Mastery* (Statistics): weakest / strongest movements and artists (≥ 3 answers), from your own games on this device.
- *Countdown* (Settings, off by default): 20 s per question in Free Play, never in the Daily Challenge; a displayed streak counter.
- *Artist distractors* also draw on ~110 famous reference artists who may have no work in the collection (`src/lib/game/artists.ts`), wrong answers only.

**Difficulty** is per artwork *and* per mode (see the audit): recognisability of the work, of a close-up of it, of its creator, and how well known its movement is.

**Localization**: language lives in Settings (persisted, default French). `useI18n()` hands components `t`, `tn`, formatters and localised art vocabulary;
components contain no language conditionals. Artwork titles and artist names are never translated. Museum texts show the French translation when one
exists and fall back to the English original otherwise.

## Data sources & licensing

390 artworks: 276 from the **Cleveland Museum of Art Open Access API** (CC0) and 114 very famous public-domain works added with
`scripts/ingest-famous.mjs` from **Wikidata, Wikimedia Commons and Wikipedia** (Mona Lisa, The Starry Night, Liberty Leading the People…). The famous
works are admitted only if the creator died before 1956 and Commons lists the image as public domain; their texts are Wikipedia summaries (CC BY-SA 4.0,
credited in each artwork's detail view, French from fr.wikipedia). Cleveland details: Titles, artists, dates, descriptions, facts and
biographies are the museum's own English text; French translations are stored alongside, never replacing the originals. Each artwork keeps its source URL
and licence. Images are the museum's open-access images, converted to WebP (480/960/1280 px long edge); detail crops are real crops of the original,
with the crop rectangle stored in the data. See `docs/audit/AUDIT.md` for what was checked, corrected and removed.

**Credits & licences** are on `/credits/` (linked from the footer of every page). **Updates**: a new deploy installs a waiting service worker
and the app shows "new version available"; the player chooses when to reload, so a game in progress is never swapped silently.

## Difficulty calibration (honest note)

Difficulty per artwork and per mode is an editorial heuristic (recognisability of the work, of a close-up, of its creator, fame of its
movement). The app has no backend and therefore **no aggregate player data**; the shipped ratings have not been validated against real play.
What exists instead: Statistics shows *your* accuracy per difficulty (a quick check that "Easy" really is easier for you), and Review/Mastery
adapt to what *you* miss. If you want crowd calibration, a backend would be needed.

## Known limitations

See the end of the implementation report in the project history; the short version:
- French translations: all 276 descriptions/"did you know" facts and all 34 artist biographies were translated by hand (not machine-translated and
  not reviewed by a professional translator); references to other works inside a text use the established French title where one exists. The English
  originals are untouched and are the automatic fallback.
- No architecture works: the Cleveland collection has no architecture object type (audit §Categories).
- Crop selection is partly algorithmic (every crop was reviewed by eye; not all hand-placed). Recognisability scores are editorial judgement.
- Not tested on physical phones/tablets or with a real screen reader; checked with scripted keyboard/ARIA inspection and device emulation.
