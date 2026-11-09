import type { Difficulty, GameMode } from "@/lib/types";

export const MODES: GameMode[] = ["guess", "detail", "artist", "timeline"];
export const DIFFICULTIES: Difficulty[] = ["easy", "intermediate", "expert"];
export const DAILY_DIFFICULTY: Difficulty = "intermediate";

export interface ModeInfo {
  id: GameMode;
  name: string;
  short: string;
  rules: string[];
  freeCount: number;
  dailyCount: number;
  unit: string;
}

export const MODE_INFO: Record<GameMode, ModeInfo> = {
  guess: {
    id: "guess",
    name: "Guess the Artwork",
    short: "An artwork hides behind a 5 × 5 grid. Name it from as few reveals as you can.",
    rules: [
      "The artwork starts almost entirely hidden behind a grid.",
      "Reveal more of it whenever you like. Each reveal lowers the points on offer: 100, 75, 50, 25.",
      "Pick the right title out of four. A wrong answer scores nothing.",
    ],
    freeCount: 10,
    dailyCount: 3,
    unit: "questions",
  },
  detail: {
    id: "detail",
    name: "The Mystery Detail",
    short: "One real close-up cropped from a masterpiece. Which work does it come from?",
    rules: [
      "You are shown a genuine crop of the original image.",
      "Choose the title of the artwork it comes from.",
      "Afterwards you see exactly where the crop sits in the full work. 100 points for a correct answer.",
    ],
    freeCount: 10,
    dailyCount: 3,
    unit: "questions",
  },
  artist: {
    id: "artist",
    name: "Who Is the Artist?",
    short: "Paintings, sculpture, photographs and prints. Who made it?",
    rules: [
      "One artwork is displayed. It can be any kind of visual art.",
      "Choose its creator out of four plausible names.",
      "100 points for a correct answer, and you learn a little about the artist.",
    ],
    freeCount: 10,
    dailyCount: 3,
    unit: "questions",
  },
  timeline: {
    id: "timeline",
    name: "Art Timeline",
    short: "Put a handful of artworks in chronological order, oldest to newest.",
    rules: [
      "Drag the artworks (or use the arrow buttons) into order, oldest at the top.",
      "Rearrange as often as you like; nothing is penalised until you validate.",
      "Each artwork in its exact position earns an equal share of 100 points.",
    ],
    freeCount: 5,
    dailyCount: 4,
    unit: "artworks",
  },
};

export const DIFFICULTY_INFO: Record<Difficulty, { name: string; short: string; blurb: string }> = {
  easy: { name: "Discovery", short: "Easy", blurb: "Internationally famous artists and works." },
  intermediate: { name: "Connoisseur", short: "Intermediate", blurb: "Recognisable names, less obvious works." },
  expert: { name: "Expert", short: "Hard", blurb: "Lesser-known creators and tougher associations." },
};

/** Points available per reveal stage in "Guess the Artwork". */
export const STAGE_POINTS = [100, 75, 50, 25] as const;
export const MAX_POINTS_PER_QUESTION = 100;

/** Cells of the 5×5 grid visible at each of the four stages. Harder = less given away. */
export const REVEAL_STAGES: Record<Difficulty, readonly [number, number, number, number]> = {
  easy: [7, 12, 18, 25],
  intermediate: [5, 9, 14, 20],
  expert: [3, 6, 10, 15],
};

export const GRID_SIZE = 5;

/** Minimum year gap between artworks in a timeline, per difficulty. */
export const TIMELINE_MIN_GAP: Record<Difficulty, number> = { easy: 80, intermediate: 35, expert: 12 };

export function questionCount(mode: GameMode, daily: boolean): number {
  return daily ? MODE_INFO[mode].dailyCount : MODE_INFO[mode].freeCount;
}

export function isMode(v: string | null | undefined): v is GameMode {
  return !!v && (MODES as string[]).includes(v);
}
export function isDifficulty(v: string | null | undefined): v is Difficulty {
  return !!v && (DIFFICULTIES as string[]).includes(v);
}
