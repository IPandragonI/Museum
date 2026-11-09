import { HINT_COST, MAX_POINTS_PER_QUESTION } from "./config";
import type { QuestionResult } from "@/lib/types";

/** Guess the Artwork: 100 points, or 75 if the hint was opened. A wrong answer scores 0 (see choicePoints). */
export function guessPoints(hintUsed: boolean): number {
  return MAX_POINTS_PER_QUESTION - (hintUsed ? HINT_COST : 0);
}

/** Detail, Artist and Movement modes: all or nothing. */
export function choicePoints(correct: boolean): number {
  return correct ? MAX_POINTS_PER_QUESTION : 0;
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
