import { createRng } from "@/lib/rng";
import { GRID_SIZE, REVEAL_STAGES } from "./config";
import type { Difficulty } from "@/lib/types";

const N = GRID_SIZE;
const CELLS = N * N;
const isCenterBlock = (i: number) => {
  const r = Math.floor(i / N);
  const c = i % N;
  return r >= 1 && r <= 3 && c >= 1 && c <= 3;
};

/**
 * Deterministic reveal order of the 25 grid cells for an artwork.
 * Farthest-point sampling spreads reveals across the whole image, and the
 * central 3×3 block (where the main subject usually sits) is held back until
 * the first ten reveals have been spent on the outer ring.
 */
export function revealOrder(artworkId: string): number[] {
  const rng = createRng("reveal:" + artworkId);
  const picked: number[] = [];
  const remaining = new Set<number>(Array.from({ length: CELLS }, (_, i) => i));
  const dist = (a: number, b: number) => {
    const dr = Math.floor(a / N) - Math.floor(b / N);
    const dc = (a % N) - (b % N);
    return dr * dr + dc * dc;
  };
  while (remaining.size) {
    let candidates = [...remaining];
    if (picked.length < 10) {
      const ring = candidates.filter((c) => !isCenterBlock(c));
      if (ring.length) candidates = ring;
    }
    if (!picked.length) {
      const first = candidates[Math.floor(rng() * candidates.length)];
      picked.push(first);
      remaining.delete(first);
      continue;
    }
    let best = -1;
    let bestScore = -1;
    for (const c of candidates) {
      const d = Math.min(...picked.map((p) => dist(c, p)));
      const score = d + rng() * 0.5; // seeded tie-break
      if (score > bestScore) {
        bestScore = score;
        best = c;
      }
    }
    picked.push(best);
    remaining.delete(best);
  }
  return picked;
}

/** Set of revealed cell indices at a given stage (1-based). */
export function revealedCells(artworkId: string, difficulty: Difficulty, stage: number): Set<number> {
  const counts = REVEAL_STAGES[difficulty];
  const n = counts[Math.min(Math.max(stage, 1), counts.length) - 1];
  return new Set(revealOrder(artworkId).slice(0, n));
}
