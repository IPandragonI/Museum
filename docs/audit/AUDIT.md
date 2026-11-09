# MUSEUM — Artwork database audit (Phase 1)

Source of truth: the Cleveland Museum of Art Open Access records (re-fetched in full for every artwork, cached in
`scripts/.cache/records/`). Every image and every detail crop was inspected visually (14 contact sheets of crops
+ the full images). Machine-readable change log: [`changes.json`](changes.json). Decisions live in
[`scripts/curation.mjs`](../../scripts/curation.mjs) and `scripts/curation/crops.json`, applied by `scripts/curate.mjs`,
so the corrections are reproducible from the raw ingestion output.

## Summary

| | Count |
|---|---:|
| Artworks reviewed | **280** |
| Removed | **4** |
| Retained | **276** |
| Needed a correction (movement, category, title-mode exclusion, or crop rejected) – retained ones | **89** |
| Validated as-is (metadata and crop acceptable; difficulty still re-scored) | **187** |
| Main images broken / low-resolution | **0 / 0** (276 JPEGs; the smallest long edge of the museum originals is 1976 px) |
| Detail crops reviewed | **272** |
| – acceptable as first generated | 195 (of which 112 resized to match the new per-work difficulty) |
| – unusable (blank paper/mount, flat background, pure hatching) | 25 |
| – weak (generic drapery, skin, canvas grain) | 52 |
| – replaced with a better crop | 48 |
| – no better crop exists → artwork excluded from Mystery Detail | 29 |
| Artworks whose difficulty differs from the old artist-tier value in ≥1 mode | 182 |
| Artworks whose difficulty differs *between* modes | 173 |

## Findings

### Attribution, titles, dates (primary-source check)
* **Attribution:** all 225 attributed works (after the removals below) have exactly one creator with no qualifier in the museum record, and the creator string matches
  our artist field. No wrong attributions found. One *seed-matching* error was found: **Anton Raphael Mengs** (portrait of Infante Don Luis)
  had been matched by the substring "Raphael" and labelled *High Renaissance* → corrected to *Neoclassicism*.
* **Titles:** all titles are the museum's titles, unmodified. Problems are about *fitness as a quiz answer*, not accuracy:
  * 8 titles are object types or generic (`Sarcophagus`, `Staff of Office`, `Amphora Vase`, `Brush Washer`, `Horse Stable`, `Standing Buddha`,
    `Matchlock Musket`, `Self-Portrait`) → disabled in the two title-answer modes (Guess, Detail), still usable in Artist/Timeline.
  * Titles that occur more than once (e.g. three works called `Portrait of a Woman`, two `The Last Supper`) are excluded automatically as ambiguous.
  * Titles that contain a year (`… 1882`) or the artist's surname leak answers → excluded from Timeline / Artist respectively.
* **Artist names (found late, fixed):** for 24 works (about 15 artists) the museum record format made my first extraction keep the whole
  parenthetical in the *artist name* (e.g. "Gilbert Stuart (American, born The Thirteen Colonies, 1755–1828)"). That would have produced ugly,
  answer-leaking option labels. Names are now clean; nationality and life dates were recovered from the same parenthetical. Two biographies that
  contained nothing but dates (Frans Hals, Gertrude Käsebier) were dropped, catalogue shorthand "(q.v.)" and "Name Nationality, 1857-1927" headers
  were stripped from the rest. Two texts truncated at initials ("J. M. W. Turner", "J. H. Wade") were restored verbatim from the museum record.
* **Near-duplicates removed (3):** `147411` (same Ōkyo screens as `147410`), `148391` (right sheet of a triptych whose centre sheet is kept),
  `101360` (generic "Trial Piece"). **Unsuitable image removed (1):** `132646` (blank sheet).
* **Dates:** museum date fields agree with ours (midpoint of the museum's earliest/latest). 26 works are unsuitable for the Timeline
  (range > 25 years, vague wording such as "after", "probably", "or", "shortly after", or a year in the title) → Timeline-ineligible.
  Seven records have ranges of 40–58 years (e.g. `134843`, `155499`, `163543`); they stay in the other modes with the museum's wording shown.
  `109507` (Veronese, "after c. 1571") was kept but flagged: "after" may indicate a later copy; the museum record gives no qualifier, so it is not
  removed, only excluded from Timeline.
* **Descriptions:** none missing. Only 2 are short; all come from the museum's curatorial text. Known cosmetic quirk: some artist biographies keep
  catalogue shorthand such as "(q.v.)".

### Categories and architecture
* Categories: the museum "type" matched our category in 274/276 cases. Two corrections: Toulouse-Lautrec `173263` (oil and tempera on millboard,
  catalogued as a drawing) → painting; Hiroshige `148697` (set of woodblock-printed books) → printmaking.
* **Architecture: not a filter problem.** The Cleveland collection has *no* object type "Architecture" (0 results for Architecture/Architectural
  Element/Building among CC0 records with images). Architecture appears only as subject matter: temple photographs, Han-dynasty architectural models,
  "Architectural Canopy" sculptures, a few architectural drawings. These are photographs/sculptures/drawings of or about buildings, so forcing them into an
  *Architecture* category would be wrong. **Not added.** Recommendation for the future expansion: add a second CC0 source with real architectural records
  (e.g. Met Open Access, Wikimedia Commons, Europeana) rather than relabel objects.
* Final categories: painting 102, drawing 55, printmaking 50, sculpture 35, photography 17, decorative arts & objects 17, architecture 0.

### Movements (work-level)
* The old model assigned one movement per *artist*. Reviewed per work: **69 changes**.
  * 51 anonymous works carried a department label ("Medieval art", "Art of the Americas"); replaced by labels derived from the museum's own
    `culture` field (e.g. "Egyptian art (New Kingdom)", "Seljuq art", "Teotihuacan art"). `Jonah Swallowed` (280–90 CE) was labelled *Medieval* → *Early Christian art*;
    the Fayum-type portrait was labelled *Ancient Egyptian* → *Roman Egyptian art*.
  * 18 artist works: early/atypical works no longer inherit the mature style (Degas 1857/58 → Realism; Van Gogh 1883 → Realism; Renoir 1864 → Realism;
    Clodion 1803 → Neoclassicism; Veronese → Venetian Renaissance).
  * **10 works now have no movement (null)** where the label is genuinely contested for that work (Chardin, Stuart, Copley's 1812 drawing, Piranesi, Maillol's wood
    engravings, Hubert Robert). The UI shows the period instead. We did not guess.

### Difficulty (artwork-level, per mode)
The old system copied the artist's fame tier. New model (`scripts/curate.mjs`), per artwork and per mode:

| Mode | What makes it hard | Score |
|---|---|---|
| Guess the Artwork | recognising the *whole work* | work recognisability (0–4): curated score for ~60 works, else artist-tier default ± museum highlight, citations, "Portrait of/Study/Sketch/recto/verso" penalty |
| Mystery Detail | recognising a *close-up* | recognisability − 0.35 (a detail is harder than the whole) |
| Who Is the Artist? | naming the *creator* | artist fame, −1 if the medium is atypical for them (e.g. Rodin drawing, Dürer painting), ± work typicality |
| Art Timeline | placing it in *time* | ½ recognisability + ½ artist fame, −0.6 when the date range is > 15 years |

Result: 173 of 276 artworks sit at different levels in different modes (famous artist with an obscure sketch → Artist easy, Guess expert; iconic work by a lesser-known
artist → Guess easy, Artist intermediate). Museum citation/exhibition counts were examined and **rejected as a direct signal**: they measure scholarly
attention (Eakins's *Biglin Brothers*: 118 citations) rather than public recognition. Crop *window size* also follows the Detail difficulty.
Eligible pools: Guess 268, Detail 239, Artist 225, Timeline 250; the Connoisseur level has at least 57 works in every mode, enough for the daily challenge (13 distinct works).
The recognisability scores are my own editorial judgement (documented in `scripts/curation.mjs`), not measured data.

### Detail crops
The first pass (contrast energy) fails on prints and flat areas. A second heuristic (large-scale structure + moderate edge density, rejecting flat /
near-black / pure-texture windows) generated candidates for the 77 flagged crops; each was reviewed by eye: 48 accepted, 29 rejected. Rejected means the
artwork is *not offered* in Mystery Detail (status `rejected` in the data) instead of shipping a poor crop. Crops remain real crops of the museum image;
the rectangle is stored in the data, so the location can always be shown.
Honest limit: crop *selection* is still partly algorithmic; the 195 first-pass crops were reviewed visually but not individually hand-placed, and the 112
that were resized (same centre, new window) were not re-inspected one by one.

## Recommended corrections (priority) and status

| # | Correction | Status |
|---|---|---|
| 1 | Remove unusable / duplicate records (4) | done |
| 2 | Fix wrong movement (Mengs) and misleading artist-level movements | done (69) |
| 3 | Replace/disable unusable detail crops (25 bad, 52 weak) | done (48 replaced, 29 disabled) |
| 4 | Per-artwork, per-mode difficulty | done |
| 5 | Disable generic titles for title-answer modes; ambiguous dates for Timeline | done (8 / 26) |
| 6 | Category fixes (2) | done |
| 7 | Architecture coverage | **not possible with this source** – documented |
| 8 | Hand-curate the remaining auto crops; verify recognisability scores with outside data | open |
| 9 | Expand collection (explicitly out of scope for this phase) | not started |
