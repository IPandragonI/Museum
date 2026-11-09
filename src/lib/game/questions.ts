import { TIMELINE_MIN_GAP, questionCount } from "./config";
import { createRng, shuffle, type Rng } from "@/lib/rng";
import type { Artwork, ChoiceQuestion, Choice, Difficulty, GameMode, Question, TimelineQuestion } from "@/lib/types";

export const norm = (s: string): string =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** Everything a generator needs to know about the dataset (precomputed once per dataset). */
export interface Dataset {
  artworks: Artwork[];
  byId: Map<string, Artwork>;
  /** Normalised titles shared by more than one artwork are ambiguous as answers. */
  ambiguousTitles: Set<string>;
}

export function createDataset(artworks: Artwork[]): Dataset {
  // Stable order: results must not depend on the order of the JSON file.
  const sorted = [...artworks].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const counts = new Map<string, number>();
  for (const a of sorted) counts.set(norm(a.title), (counts.get(norm(a.title)) ?? 0) + 1);
  const ambiguousTitles = new Set([...counts].filter(([, n]) => n > 1).map(([t]) => t));
  return { artworks: sorted, byId: new Map(sorted.map((a) => [a.id, a])), ambiguousTitles };
}

// ------------------------------------------------------------------ eligibility

export function hasUsableTitle(ds: Dataset, a: Artwork): boolean {
  return !ds.ambiguousTitles.has(norm(a.title));
}

export function eligibleFor(ds: Dataset, mode: GameMode, a: Artwork): boolean {
  // `a.quiz[mode]` encodes the audit decisions (generic titles, imprecise dates, rejected crops…).
  if (!a.quiz[mode]) return false;
  switch (mode) {
    case "guess":
      return hasUsableTitle(ds, a);
    case "detail":
      return !!a.detail?.imageUrl && a.detail.status !== "rejected" && hasUsableTitle(ds, a);
    case "artist":
      // the title must not give the creator away
      return !!a.artist && !norm(a.title).includes(norm(a.artist.split(" ").pop() ?? ""));
    case "timeline":
      return a.yearSpan <= 25;
  }
}

// ----------------------------------------------------------------- distractors

const STOP = new Set(["the", "a", "an", "of", "and", "with", "from", "in", "on", "at", "de", "la", "le"]);
const wordsCache = new Map<string, string[]>();
const words = (t: string): string[] => {
  let w = wordsCache.get(t);
  if (!w) {
    w = norm(t).split(" ").filter((x) => x && !STOP.has(x));
    wordsCache.set(t, w);
  }
  return w;
};

/** Titles a player could reasonably confuse: identical, nested, or sharing most significant words / a long series suffix. */
function titleRelated(a: string, b: string): boolean {
  const x = norm(a);
  const y = norm(b);
  if (x === y || x.includes(y) || y.includes(x)) return true;
  const wx = words(a);
  const wy = words(b);
  const shared = wx.filter((w) => wy.includes(w)).length;
  if (shared >= 3 && shared / Math.min(wx.length, wy.length) >= 0.5) return true; // e.g. "…from Thirty-Six Views of Mount Fuji"
  return wx.length >= 2 && wy.length >= 2 && wx[0] === wy[0] && wx[1] === wy[1]; // e.g. "Bacchanal with …"
}

function jitter(rng: Rng) {
  return rng() * 1.5;
}

/** Plausible wrong titles: similar category/period/movement, never the same or an overlapping title. */
export function titleDistractors(ds: Dataset, answer: Artwork, rng: Rng, count = 3): Artwork[] | null {
  const scored = ds.artworks
    .filter((o) => o.id !== answer.id && hasUsableTitle(ds, o) && !titleRelated(o.title, answer.title))
    .filter((o) => !answer.alternativeTitles.some((t) => titleRelated(o.title, t)))
    .map((o) => ({
      o,
      s:
        (o.category === answer.category ? 3 : 0) +
        (o.period === answer.period ? 2 : 0) +
        (o.movement === answer.movement ? 1 : 0) +
        (o.difficulty.guess === answer.difficulty.guess ? 1 : 0) +
        (o.artist && o.artist === answer.artist ? -2 : 0) + // avoid a cluster of one artist's works
        jitter(rng),
    }))
    .sort((x, y) => y.s - x.s);
  const out: Artwork[] = [];
  for (const { o } of scored) {
    if (out.length === count) break;
    if (out.some((p) => titleRelated(p.title, o.title))) continue;
    out.push(o);
  }
  return out.length === count ? out : null;
}

/** Plausible wrong artists: distinct people, similar era / nationality / medium. */
export function artistDistractors(ds: Dataset, answer: Artwork, rng: Rng, count = 3): string[] | null {
  const best = new Map<string, number>();
  for (const o of ds.artworks) {
    if (!o.artist || norm(o.artist) === norm(answer.artist ?? "")) continue;
    const near = o.artistBirthYear && answer.artistBirthYear ? Math.abs(o.artistBirthYear - answer.artistBirthYear) < 60 : Math.abs(o.creationYear - answer.creationYear) < 80;
    const s =
      (o.category === answer.category ? 3 : 0) +
      (near ? 3 : 0) +
      (o.artistNationality && o.artistNationality === answer.artistNationality ? 2 : 0) +
      (o.movement === answer.movement ? 1 : 0) +
      (o.difficulty.artist === answer.difficulty.artist ? 1 : 0) +
      jitter(rng);
    if (s > (best.get(o.artist) ?? -1)) best.set(o.artist, s);
  }
  const ordered = [...best].sort((a, b) => b[1] - a[1]).map(([n]) => n);
  const out: string[] = [];
  for (const name of ordered) {
    if (out.length === count) break;
    // same person under another spelling ("Rembrandt" vs "Rembrandt van Rijn") or a shared surname
    const n = norm(name);
    const ans = norm(answer.artist ?? "");
    if (n.includes(ans) || ans.includes(n)) continue;
    if (out.some((p) => norm(p).includes(n) || n.includes(norm(p)))) continue;
    out.push(name);
  }
  return out.length === count ? out : null;
}

// -------------------------------------------------------------------- questions

export function buildChoiceQuestion(ds: Dataset, mode: ChoiceQuestion["mode"], a: Artwork, rng: Rng): ChoiceQuestion | null {
  let options: Choice[];
  let correctId: string;
  if (mode === "artist") {
    if (!a.artist) return null;
    const wrong = artistDistractors(ds, a, rng);
    if (!wrong) return null;
    correctId = "artist:" + norm(a.artist);
    options = [{ id: correctId, label: a.artist }, ...wrong.map((n) => ({ id: "artist:" + norm(n), label: n }))];
  } else {
    if (!hasUsableTitle(ds, a)) return null;
    const wrong = titleDistractors(ds, a, rng);
    if (!wrong) return null;
    correctId = a.id;
    options = [{ id: a.id, label: a.title }, ...wrong.map((w) => ({ id: w.id, label: w.title }))];
  }
  // validity: 4 distinct options (by id and by label), exactly one correct
  if (new Set(options.map((o) => o.id)).size !== 4 || new Set(options.map((o) => norm(o.label))).size !== 4) return null;
  return { mode, artworkId: a.id, options: shuffle(options, rng), correctId };
}

export interface PickOptions {
  count: number;
  difficulty: Difficulty;
  /** Artworks that must not be used (e.g. already used elsewhere in today's challenge). */
  exclude?: ReadonlySet<string>;
  /** Recently played artworks — avoided when the pool allows. */
  recent?: ReadonlySet<string>;
}

/** Pool ordered by preference: exact difficulty first, then neighbours, then everything. */
function tieredPool(ds: Dataset, mode: GameMode, difficulty: Difficulty): Artwork[][] {
  const order: Difficulty[] = ["easy", "intermediate", "expert"];
  const idx = order.indexOf(difficulty);
  const eligible = ds.artworks.filter((a) => eligibleFor(ds, mode, a));
  const by = (d: Difficulty) => eligible.filter((a) => a.difficulty[mode] === d);
  const near = order.filter((_, i) => Math.abs(i - idx) === 1).flatMap(by);
  const far = order.filter((_, i) => Math.abs(i - idx) === 2).flatMap(by);
  return [by(difficulty), near, far];
}

function preferenceSort(items: Artwork[], rng: Rng, recent?: ReadonlySet<string>): Artwork[] {
  const shuffled = shuffle(items, rng);
  if (!recent?.size) return shuffled;
  return [...shuffled.filter((a) => !recent.has(a.id)), ...shuffled.filter((a) => recent.has(a.id))];
}

export function generateChoiceQuestions(ds: Dataset, mode: ChoiceQuestion["mode"], opts: PickOptions, rng: Rng): ChoiceQuestion[] {
  const tiers = tieredPool(ds, mode, opts.difficulty);
  const out: ChoiceQuestion[] = [];
  const used = new Set<string>();
  const perArtist = new Map<string, number>();
  const attempt = (candidates: Artwork[], respectExclude: boolean, maxPerArtist: number) => {
    for (const a of candidates) {
      if (out.length >= opts.count) return;
      if (used.has(a.id) || (respectExclude && opts.exclude?.has(a.id))) continue;
      if (a.artist && (perArtist.get(a.artist) ?? 0) >= maxPerArtist) continue;
      const q = buildChoiceQuestion(ds, mode, a, rng);
      if (!q) continue; // not enough good distractors -> choose another artwork
      out.push(q);
      used.add(a.id);
      if (a.artist) perArtist.set(a.artist, (perArtist.get(a.artist) ?? 0) + 1);
    }
  };
  for (const respectExclude of [true, false])
    for (const maxPerArtist of [1, 2, 99])
      for (const tier of tiers) {
        if (out.length >= opts.count) break;
        attempt(preferenceSort(tier, rng, opts.recent), respectExclude, maxPerArtist);
      }
  return out;
}

export function generateTimeline(ds: Dataset, opts: PickOptions, rng: Rng): TimelineQuestion | null {
  const tiers = tieredPool(ds, "timeline", opts.difficulty);
  const gap0 = TIMELINE_MIN_GAP[opts.difficulty];
  for (const respectExclude of [true, false]) {
    for (let gap = gap0; gap >= 5; gap = Math.floor(gap / 2)) {
      for (const tierCount of [1, 2, 3]) {
        const pool = preferenceSort(
          tiers.slice(0, tierCount).flat().filter((a) => !(respectExclude && opts.exclude?.has(a.id))),
          rng,
          opts.recent,
        );
        const picked: Artwork[] = [];
        for (const a of pool) {
          if (picked.length === opts.count) break;
          // far enough apart in time AND their date ranges can't overlap, so the order is unambiguous
          if (picked.some((p) => Math.abs(p.creationYear - a.creationYear) < Math.max(gap, (p.yearSpan + a.yearSpan) / 2 + 1))) continue;
          picked.push(a);
        }
        if (picked.length === opts.count) {
          let order = shuffle(picked, rng);
          // never present an already-sorted list
          const sorted = [...picked].sort((a, b) => a.creationYear - b.creationYear).map((a) => a.id);
          for (let k = 0; k < 6 && order.every((a, i) => a.id === sorted[i]); k++) order = shuffle(picked, rng);
          return { mode: "timeline", artworkIds: order.map((a) => a.id) };
        }
      }
    }
  }
  return null;
}

export function generateQuestions(ds: Dataset, mode: GameMode, opts: PickOptions, rng: Rng): Question[] {
  if (mode === "timeline") {
    const t = generateTimeline(ds, opts, rng);
    return t ? [t] : [];
  }
  return generateChoiceQuestions(ds, mode, opts, rng);
}

/** Free-play game: random seed, count by mode. */
export function generateFreePlay(ds: Dataset, mode: GameMode, difficulty: Difficulty, seed: number, recent?: ReadonlySet<string>): Question[] {
  return generateQuestions(ds, mode, { count: questionCount(mode, false), difficulty, recent }, createRng(seed));
}

/** Correct chronological order (oldest → newest); stable for ties via id. */
export function correctTimelineOrder(ds: Dataset, ids: readonly string[]): string[] {
  return [...ids].sort((a, b) => {
    const A = ds.byId.get(a)!;
    const B = ds.byId.get(b)!;
    return A.creationYear - B.creationYear || (a < b ? -1 : 1);
  });
}

export function questionArtworkIds(q: Question): string[] {
  return q.mode === "timeline" ? q.artworkIds : [q.artworkId];
}
