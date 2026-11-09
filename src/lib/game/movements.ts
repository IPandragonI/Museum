import type { Rng } from "@/lib/rng";
import type { Artwork, Difficulty } from "@/lib/types";

/**
 * "Which Movement?" support: which movements may be offered together, and which wrong answers are plausible.
 * The goal is a question with exactly one defensible answer, so closely related movements are never mixed.
 */

const plain = (s: string): string =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** Words that do not identify a movement on their own ("American", "art", "school", "Early"…). */
const GENERIC = new Set([
  "art", "school", "period", "painting", "photography", "sculpture", "early", "late", "high", "northern", "american", "dutch", "golden", "age",
  "neo", "post", "pre", "modern", "second", "empire", "victorian", "documentary", "portrait", "century", "dynasty", "dynasties", "italian",
  "european", "kingdom", "new", "middle", "of", "the",
]);

/** Movements that overlap in time, place or style enough that a viewer could reasonably choose either. */
const OVERLAP_GROUPS: string[][] = [
  ["Baroque", "Dutch Golden Age", "Rococo", "Veduta painting", "Mannerism", "Northern Mannerism"],
  ["Realism", "American Realism", "Barbizon school", "Academic art", "Impressionism", "American Impressionism", "Hudson River School", "Luminism", "Tonalism", "Aestheticism", "Trompe-l'œil"],
  ["Romanticism", "Neoclassicism", "Hudson River School", "Sentimentalism", "Academic art", "Rococo", "Second Empire sculpture"],
  ["Impressionism", "Post-Impressionism", "Neo-Impressionism", "American Impressionism", "Fauvism", "Realism"],
  ["Symbolism", "Expressionism", "Post-Impressionism", "Fauvism", "Modernism", "Naïve art", "Neo-Impressionism", "Aestheticism", "Pre-Raphaelite"],
  ["High Renaissance", "Early Renaissance", "Northern Renaissance", "Venetian Renaissance", "Early Netherlandish", "Mannerism", "Northern Mannerism", "Danube school", "Late Gothic", "Medieval Italian painting", "Baroque"],
  ["Pictorialism", "Early photography", "Victorian photography", "Documentary photography", "19th-century portrait photography", "Realism"],
  ["Cubism", "Fauvism", "Expressionism", "Suprematism", "Modernism", "Post-Impressionism"],
];

const stems = (label: string): string[] => {
  const all = plain(label).split(" ").filter(Boolean);
  const kept = all.filter((w) => !GENERIC.has(w));
  return kept.length ? kept : all;
};

export function movementsRelated(a: string, b: string): boolean {
  if (a === b) return true;
  if (OVERLAP_GROUPS.some((g) => g.includes(a) && g.includes(b))) return true;
  const sb = new Set(stems(b));
  return stems(a).some((w) => sb.has(w));
}

export interface MovementStats {
  label: string;
  count: number;
  medianYear: number;
  minYear: number;
  maxYear: number;
  /** All works with this label are anonymous (a culture / dynasty, not an artists' movement). */
  cultural: boolean;
}

export function movementStats(artworks: Artwork[]): Map<string, MovementStats> {
  const groups = new Map<string, Artwork[]>();
  for (const a of artworks) if (a.movement) groups.set(a.movement, [...(groups.get(a.movement) ?? []), a]);
  const out = new Map<string, MovementStats>();
  for (const [label, list] of groups) {
    const years = list.map((a) => a.creationYear).sort((x, y) => x - y);
    out.set(label, {
      label,
      count: list.length,
      medianYear: years[Math.floor(years.length / 2)],
      minYear: years[0],
      maxYear: years[years.length - 1],
      cultural: list.every((a) => !a.artist),
    });
  }
  return out;
}

/** How well known the movement is to a general audience (drives the difficulty of "Which Movement?"). */
const EASY = new Set(["Impressionism", "Post-Impressionism", "Baroque", "Romanticism", "Realism", "Neoclassicism", "Rococo", "Expressionism", "Symbolism", "High Renaissance", "Early Renaissance", "Ukiyo-e", "Fauvism", "Cubism", "Egyptian art (New Kingdom)", "Egyptian art (Middle Kingdom)", "Roman art", "Ancient Greek art", "Gothic art"]);
const INTERMEDIATE = new Set(["Mannerism", "Northern Renaissance", "Dutch Golden Age", "Neo-Impressionism", "Pre-Raphaelite", "Romanesque art", "Naïve art", "Aestheticism", "Venetian Renaissance", "Early Netherlandish", "Hudson River School", "Barbizon school", "Academic art", "Pictorialism", "Archaic Greek art", "Etruscan art", "Modernism", "Suprematism", "Modern sculpture", "Early photography", "Qing dynasty art", "Ming dynasty art", "Tang dynasty art", "Song dynasty art"]);

export function movementDifficulty(label: string): Difficulty {
  return EASY.has(label) ? "easy" : INTERMEDIATE.has(label) ? "intermediate" : "expert";
}

/**
 * Three plausible wrong movements. Never related to the right answer, always the same kind (artists' movement vs
 * culture). Easy questions use far-away eras, expert ones the nearest eras.
 */
export function movementDistractors(stats: Map<string, MovementStats>, answer: Artwork, difficulty: Difficulty, rng: Rng, count = 3): string[] | null {
  const correct = answer.movement;
  const own = correct ? stats.get(correct) : undefined;
  if (!correct || !own) return null;
  const scored = [...stats.values()]
    .filter((s) => s.cultural === own.cultural && !movementsRelated(correct, s.label))
    .filter((s) => difficulty !== "easy" || answer.creationYear < s.minYear - 40 || answer.creationYear > s.maxYear + 40) // easy: clearly another era
    .map((s) => {
      const gap = Math.abs(s.medianYear - answer.creationYear);
      const fit = difficulty === "easy" ? Math.min(gap, 500) / 100 : difficulty === "intermediate" ? -Math.abs(gap - 150) / 100 : -gap / 100;
      return { s, score: fit + rng() * 1.2 };
    })
    .sort((x, y) => y.score - x.score);
  const out: string[] = [];
  for (const { s } of scored) {
    if (out.length === count) break;
    if (out.some((o) => movementsRelated(o, s.label))) continue; // wrong answers must differ from each other too
    out.push(s.label);
  }
  return out.length === count ? out : null;
}
