import { DAILY_DIFFICULTY, MODES, questionCount } from "./config";
import { generateQuestions, questionArtworkIds, type Dataset } from "./questions";
import { createRng } from "@/lib/rng";
import type { DailyModeProgress, DailyRecord, GameMode, Question, QuestionResult } from "@/lib/types";

/** Calendar date in UTC, e.g. "2026-11-09". Everyone on Earth gets the same one at the same instant. */
export function utcDateString(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10);
}

export function previousDate(date: string): string {
  const d = new Date(date + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() - 1);
  return utcDateString(d);
}

export function formatDateLong(date: string): string {
  return new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(date + "T00:00:00Z"),
  );
}

export type DailyChallenge = Record<GameMode, Question[]>;

/**
 * Deterministic daily selection. Depends only on the date and the dataset
 * (sorted by id), never on Math.random, the device or the timezone.
 * Artworks are never reused across modes when the dataset allows it.
 */
export function generateDailyChallenge(ds: Dataset, date: string): DailyChallenge {
  const used = new Set<string>();
  const out = {} as DailyChallenge;
  for (const mode of MODES) {
    const rng = createRng(`museum-daily:${date}:${mode}`);
    const questions = generateQuestions(ds, mode, { count: questionCount(mode, true), difficulty: DAILY_DIFFICULTY, exclude: used }, rng);
    out[mode] = questions;
    for (const q of questions) for (const id of questionArtworkIds(q)) used.add(id);
  }
  return out;
}

const blank = (): DailyModeProgress => ({ status: "pending", answers: [] });

export function emptyDailyRecord(date: string): DailyRecord {
  return { date, modes: Object.fromEntries(MODES.map((m) => [m, blank()])) as DailyRecord["modes"] };
}

/** A finished legacy "Art Timeline" game becomes equivalent finished "Which Movement?" results (same points, same max). */
function convertLegacyTimeline(r: QuestionResult | undefined): QuestionResult[] {
  if (!r || r.artworkIds.length === 0) return [];
  const n = r.artworkIds.length;
  const each = Math.round(100 / n);
  return r.artworkIds.map((id) => {
    const ok = r.correctArtworkIds.includes(id);
    return { artworkIds: [id], correctArtworkIds: ok ? [id] : [], correct: ok, points: ok ? each : 0, maxPoints: each, answer: "legacy-timeline" };
  });
}

/**
 * Completes and migrates a stored daily record so older data keeps working: modes added later are filled in as
 * pending, and a completed legacy "timeline" game counts as the completed "movement" game (streaks stay intact).
 */
export function normalizeDailyRecord(raw: DailyRecord): DailyRecord {
  const legacy = (raw.modes as unknown as Record<string, DailyModeProgress | undefined>).timeline;
  const modes = { ...raw.modes } as DailyRecord["modes"];
  for (const m of MODES) {
    if (!modes[m]) {
      modes[m] = m === "movement" && legacy?.status === "completed" ? { ...legacy, answers: convertLegacyTimeline(legacy.answers[0]) } : blank();
    }
  }
  return { ...raw, modes };
}

export function isDailyComplete(r: DailyRecord | undefined | null): boolean {
  return !!r && MODES.every((m) => r.modes[m].status === "completed");
}

export function dailyProgress(r: DailyRecord | undefined | null): { done: number; total: number } {
  return { done: r ? MODES.filter((m) => r.modes[m].status === "completed").length : 0, total: MODES.length };
}

export interface StreakInfo {
  current: number;
  best: number;
  lastCompleted: string | null;
}

/** Streaks from the set of fully completed daily dates. Today not yet completed doesn't break a streak. */
export function computeStreaks(completedDates: Iterable<string>, today: string): StreakInfo {
  const set = new Set(completedDates);
  const sorted = [...set].sort();
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of sorted) {
    run = prev && previousDate(d) === prev ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  let current = 0;
  let cursor = set.has(today) ? today : previousDate(today);
  while (set.has(cursor)) {
    current++;
    cursor = previousDate(cursor);
  }
  return { current, best, lastCompleted: sorted.length ? sorted[sorted.length - 1] : null };
}
