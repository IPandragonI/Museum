import { DIFFICULTIES, MODES } from "@/lib/game/config";
import { computeStreaks, isDailyComplete, type StreakInfo } from "@/lib/game/daily";
import { percent, sumMax, sumPoints } from "@/lib/game/scoring";
import type { DailyRecord, Difficulty, GameMode, GameSession } from "@/lib/types";

export interface Tally {
  points: number;
  max: number;
  /** Fully correct questions. */
  correct: number;
  questions: number;
}

export interface Stats {
  gamesPlayed: number;
  questionsAnswered: number;
  accuracy: number;
  bestScore: Record<GameMode, { points: number; max: number } | null>;
  accuracyByMode: Record<GameMode, number | null>;
  accuracyByDifficulty: Record<Difficulty, number | null>;
  streak: StreakInfo;
}

const emptyTally = (): Tally => ({ points: 0, max: 0, correct: 0, questions: 0 });

/**
 * Accuracy = share of available points earned. This works for every mode (reveal-stage
 * scoring in "Guess the Artwork", partial credit in the timeline) with one consistent model.
 */
function addSession(t: Tally, s: GameSession) {
  t.points += sumPoints(s.questions);
  t.max += sumMax(s.questions);
  t.correct += s.questions.filter((q) => q.correct).length;
  t.questions += s.questions.length;
}

/** Everything is derived from the stored sessions and daily records; nothing is cached. */
export function computeStats(sessions: GameSession[], dailyRecords: DailyRecord[], today: string): Stats {
  const done = sessions.filter((s) => s.completed);
  const total = emptyTally();
  const byMode = Object.fromEntries(MODES.map((m) => [m, emptyTally()])) as Record<GameMode, Tally>;
  const byDiff = Object.fromEntries(DIFFICULTIES.map((d) => [d, emptyTally()])) as Record<Difficulty, Tally>;
  const best = Object.fromEntries(MODES.map((m) => [m, null])) as Stats["bestScore"];

  for (const s of done) {
    addSession(total, s);
    addSession(byDiff[s.difficulty], s);
    // Games saved under the removed "Art Timeline" mode still count in the totals and per-difficulty figures,
    // but have no row of their own in the per-mode tables.
    if (!(MODES as string[]).includes(s.mode)) continue;
    const mode = s.mode as GameMode;
    addSession(byMode[mode], s);
    const pts = sumPoints(s.questions);
    const max = sumMax(s.questions);
    const b = best[mode];
    // compare by ratio so daily (3 questions) and free (10) games are comparable within a mode
    if (!b || pts / max > b.points / b.max || (pts / max === b.points / b.max && max > b.max)) best[mode] = { points: pts, max };
  }

  const pct = (t: Tally) => (t.max ? percent(t.points, t.max) : null);
  return {
    gamesPlayed: done.length,
    questionsAnswered: total.questions,
    accuracy: percent(total.points, total.max),
    bestScore: best,
    accuracyByMode: Object.fromEntries(MODES.map((m) => [m, pct(byMode[m])])) as Stats["accuracyByMode"],
    accuracyByDifficulty: Object.fromEntries(DIFFICULTIES.map((d) => [d, pct(byDiff[d])])) as Stats["accuracyByDifficulty"],
    streak: computeStreaks(
      dailyRecords.filter((r) => isDailyComplete(r)).map((r) => r.date),
      today,
    ),
  };
}
