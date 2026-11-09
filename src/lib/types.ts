export type Category =
  | "painting"
  | "sculpture"
  | "photography"
  | "drawing"
  | "architecture"
  | "printmaking"
  | "decorative";

export type Difficulty = "easy" | "intermediate" | "expert";
export type GameMode = "guess" | "detail" | "artist" | "movement";
/** Mode value found in games saved before "Art Timeline" was replaced by "Which Movement?". */
export type StoredMode = GameMode | "timeline";

export interface SourceCredit {
  name: string;
  url: string | null;
  license: string;
}

export interface ImageVariant {
  url: string;
  /** Pixel width / height of this variant. */
  w: number;
  h: number;
  bytes: number;
}

export interface DetailCrop {
  /** null when the crop was rejected in review (the artwork is then not offered in Mystery Detail). */
  imageUrl: string | null;
  width: number;
  height: number;
  bytes?: number;
  /** Normalised rectangle (0..1) of the crop within the full artwork image — ties the crop to its artwork. */
  rect: { x: number; y: number; w: number; h: number };
  source: string;
  /** "reviewed": inspected by eye; "rejected": no suitable crop exists. */
  status: "reviewed" | "rejected";
}

export interface Artwork {
  id: string;
  title: string;
  alternativeTitles: string[];
  /** null for anonymous / culture-attributed works (never used in artist questions). */
  artist: string | null;
  artistNationality: string | null;
  artistBirthYear: number | null;
  artistDeathYear: number | null;
  artistBio: string | null;
  artistBioSource: SourceCredit | null;
  creationYear: number;
  /** Width of the date range in years (0 = exact year). */
  yearSpan: number;
  dateDisplay: string;
  category: Category;
  /** Work-level movement; null when no reliable label exists for this particular work. */
  movement: string | null;
  period: string;
  /** Difficulty is assessed per artwork AND per game mode. */
  difficulty: Record<GameMode, Difficulty>;
  /** Which modes may use this artwork (generic titles, imprecise dates, rejected crops are excluded). */
  quiz: Record<GameMode, boolean>;
  /** Editorial public-recognisability score 0–4 (see docs/audit/AUDIT.md). */
  recognizability: number;
  measurements: string | null;
  medium: string | null;
  culture: string | null;
  /** Largest variant (kept for convenience / metadata). */
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  /** Responsive WebP variants, smallest first, plus facts about the original. */
  images: { variants: ImageVariant[]; original: { w: number; h: number; format: string } };
  imageSource: string;
  detail: DetailCrop | null;
  description: string;
  descriptionSource: SourceCredit | null;
  interestingFacts: string[];
  museum: string;
  museumUrl: string;
  sourceUrl: string;
  license: string;
  tags: string[];
}

// ----------------------------------------------------------------- questions

export interface Choice {
  id: string;
  label: string;
}

export interface ChoiceQuestion {
  mode: "guess" | "detail" | "artist" | "movement";
  artworkId: string;
  options: Choice[];
  correctId: string;
}

export type Question = ChoiceQuestion;

// ------------------------------------------------------------------- results

export interface QuestionResult {
  /** Artworks involved in the question (one for every current mode). */
  artworkIds: string[];
  /** Artworks the player earned into the collection. */
  correctArtworkIds: string[];
  correct: boolean;
  points: number;
  maxPoints: number;
  /** Selected option id (legacy Timeline results stored the submitted order as an array). */
  answer: string | string[];
  /** Guess mode: whether the hint was used (it costs 25 points). */
  hint?: boolean;
  /** @deprecated reveal stage of the removed grid mechanic; only present in games saved before the redesign. */
  stage?: number;
}

export interface GameSession {
  id: string;
  mode: StoredMode;
  difficulty: Difficulty;
  kind: "free" | "daily";
  dailyDate?: string;
  startedAt: string;
  completedAt: string;
  completed: boolean;
  questions: QuestionResult[];
}

export interface CollectionEntry {
  artworkId: string;
  discoveredAt: string;
  mode: StoredMode;
  sessionId: string;
}

export type DailyModeStatus = "pending" | "in_progress" | "completed";

export interface DailyModeProgress {
  status: DailyModeStatus;
  answers: QuestionResult[];
  /** Whether the hint was opened on the in-flight "guess" question, so a reload can't undo it. */
  hint?: boolean;
  /** @deprecated grid reveal stage of games saved before the redesign. */
  stage?: number;
  sessionId?: string;
  completedAt?: string;
}

export interface DailyRecord {
  date: string;
  modes: Record<GameMode, DailyModeProgress>;
  completedAt?: string;
}
