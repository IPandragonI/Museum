import type { Difficulty, GameMode } from "@/lib/types";

export const MODES: GameMode[] = ["guess", "detail", "artist", "movement"];
export const DIFFICULTIES: Difficulty[] = ["easy", "intermediate", "expert"];
export const DAILY_DIFFICULTY: Difficulty = "intermediate";

export interface ModeInfo {
  id: GameMode;
  freeCount: number;
  dailyCount: number;
  /** Plural-aware unit key for `tn()`: "unit.questions" or "unit.artworks". */
  unit: "unit.questions" | "unit.artworks";
}

/** Structure only. All user-facing text (names, rules, difficulty labels) lives in the i18n catalogs. */
export const MODE_INFO: Record<GameMode, ModeInfo> = {
  guess: { id: "guess", freeCount: 10, dailyCount: 3, unit: "unit.questions" },
  detail: { id: "detail", freeCount: 10, dailyCount: 3, unit: "unit.questions" },
  artist: { id: "artist", freeCount: 10, dailyCount: 3, unit: "unit.questions" },
  movement: { id: "movement", freeCount: 10, dailyCount: 3, unit: "unit.questions" },
};

/** Every question is worth 100 points. */
export const MAX_POINTS_PER_QUESTION = 100;
/** Guess the Artwork: opening the optional hint costs 25 points (a correct answer is then worth 75). */
export const HINT_COST = 25;

/** Optional Free Play countdown. Running out of time counts as a wrong answer; points are otherwise unchanged. */
export const TIMER_SECONDS = 20;
/** Questions per game mode in a "Mix" game (4 modes × 3 = 12). */
export const MIX_PER_MODE = 3;

export function questionCount(mode: GameMode, daily: boolean): number {
  return daily ? MODE_INFO[mode].dailyCount : MODE_INFO[mode].freeCount;
}

export function isMode(v: string | null | undefined): v is GameMode {
  return !!v && (MODES as string[]).includes(v);
}
export function isDifficulty(v: string | null | undefined): v is Difficulty {
  return !!v && (DIFFICULTIES as string[]).includes(v);
}
