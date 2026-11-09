import { DIFFICULTIES, MODES } from "@/lib/game/config";
import { computeStreaks, isDailyComplete, type StreakInfo } from "@/lib/game/daily";
import { sameArtist } from "@/lib/game/questions";
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

/**
 * Artworks whose most recent attempt in `mode` was wrong, oldest miss first. Answering one correctly later removes
 * it from the list (a light "spaced repetition": you review what is still not learned).
 */
export function missedArtworks(sessions: GameSession[], mode: GameMode): string[] {
  const last = new Map<string, boolean>();
  const done = sessions.filter((s) => s.completed && s.mode === mode).sort((a, b) => (a.completedAt ?? "").localeCompare(b.completedAt ?? ""));
  for (const s of done)
    for (const q of s.questions) {
      const id = q.artworkIds[0];
      if (id) {
        last.delete(id); // re-insert so the order follows the latest attempt
        last.set(id, q.correct);
      }
    }
  return [...last].filter(([, ok]) => !ok).map(([id]) => id);
}

export interface MasteryRow {
  label: string;
  answered: number;
  correct: number;
  /** Share of correct answers, 0–100. */
  pct: number;
}

/**
 * How well each movement and each artist is known, from every answered question (all modes). Spelling variants of
 * one artist ("Francisco Goya" / "Francisco de Goya") are merged. Rows are sorted weakest first.
 */
export function computeMastery(sessions: GameSession[], lookup: (artworkId: string) => { movement: string | null; artist: string | null } | undefined): { movements: MasteryRow[]; artists: MasteryRow[] } {
  const movements = new Map<string, { answered: number; correct: number }>();
  const artists = new Map<string, { answered: number; correct: number }>();
  const bump = (m: Map<string, { answered: number; correct: number }>, key: string, ok: boolean) => {
    const e = m.get(key) ?? { answered: 0, correct: 0 };
    e.answered++;
    if (ok) e.correct++;
    m.set(key, e);
  };
  for (const s of sessions) {
    if (!s.completed) continue;
    for (const q of s.questions) {
      const a = lookup(q.artworkIds[0]);
      if (!a) continue;
      if (a.movement) bump(movements, a.movement, q.correct);
      if (a.artist) {
        const same = [...artists.keys()].find((k) => sameArtist(k, a.artist as string));
        bump(artists, same ?? a.artist, q.correct);
      }
    }
  }
  const rows = (m: Map<string, { answered: number; correct: number }>): MasteryRow[] =>
    [...m]
      .map(([label, e]) => ({ label, answered: e.answered, correct: e.correct, pct: Math.round((e.correct / e.answered) * 100) }))
      .sort((x, y) => x.pct - y.pct || y.answered - x.answered || x.label.localeCompare(y.label));
  return { movements: rows(movements), artists: rows(artists) };
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
