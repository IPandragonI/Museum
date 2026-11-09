import { HINT_COST, MAX_POINTS_PER_QUESTION } from "./config";
import type { QuestionResult } from "@/lib/types";

/** Guess the Artwork: 100 points, or 75 if the hint was opened. A wrong answer scores 0 (see choicePoints). */
export function guessPoints(hintUsed: boolean): number {
  return MAX_POINTS_PER_QUESTION - (hintUsed ? HINT_COST : 0);
}

/** Detail & Artist modes: all or nothing. */
export function choicePoints(correct: boolean): number {
  return correct ? MAX_POINTS_PER_QUESTION : 0;
}

/** Number of artworks sitting in exactly the right slot. */
export function timelineCorrectPositions(submitted: readonly string[], correctOrder: readonly string[]): number {
  return submitted.reduce((n, id, i) => n + (id === correctOrder[i] ? 1 : 0), 0);
}

/** 100 for a perfect order, otherwise a proportional share. */
export function timelinePoints(correctPositions: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((MAX_POINTS_PER_QUESTION * correctPositions) / total);
}

export function sumPoints(results: readonly Pick<QuestionResult, "points">[]): number {
  return results.reduce((s, r) => s + r.points, 0);
}
export function sumMax(results: readonly Pick<QuestionResult, "maxPoints">[]): number {
  return results.reduce((s, r) => s + r.maxPoints, 0);
}
export function percent(part: number, whole: number): number {
  return whole > 0 ? Math.round((part / whole) * 100) : 0;
}
