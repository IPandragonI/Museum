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
/** Consecutive correct answers ending at the latest one. Display only: points are never changed by streaks. */
export function currentStreak(results: readonly Pick<QuestionResult, "correct">[]): number {
  let n = 0;
  for (let i = results.length - 1; i >= 0 && results[i].correct; i--) n++;
  return n;
}
/** Longest run of correct answers in a game. */
export function bestStreak(results: readonly Pick<QuestionResult, "correct">[]): number {
  let best = 0;
  let run = 0;
  for (const r of results) {
    run = r.correct ? run + 1 : 0;
    best = Math.max(best, run);
  }
  return best;
}
export function percent(part: number, whole: number): number {
  return whole > 0 ? Math.round((part / whole) * 100) : 0;
}
