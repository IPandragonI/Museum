export type Category =
  | "painting"
  | "sculpture"
  | "photography"
  | "drawing"
  | "architecture"
  | "printmaking"
  | "decorative";

export type Difficulty = "easy" | "intermediate" | "expert";
export type GameMode = "guess" | "detail" | "artist" | "timeline";

export interface SourceCredit {
  name: string;
  url: string | null;
  license: string;
}

export interface DetailCrop {
  imageUrl: string;
  width: number;
  height: number;
  /** Normalised rectangle (0..1) of the crop within the full artwork image. */
  rect: { x: number; y: number; w: number; h: number };
  source: string;
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
  movement: string;
  period: string;
  difficulty: Difficulty;
  medium: string | null;
  culture: string | null;
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
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
  mode: "guess" | "detail" | "artist";
  artworkId: string;
  options: Choice[];
  correctId: string;
}

export interface TimelineQuestion {
  mode: "timeline";
  /** Artwork ids in the (shuffled) order shown to the player at the start. */
  artworkIds: string[];
}

export type Question = ChoiceQuestion | TimelineQuestion;

// ------------------------------------------------------------------- results

export interface QuestionResult {
  /** Artworks involved in the question (1 for choice modes, 4-5 for timeline). */
  artworkIds: string[];
  /** Artworks the player earned into the collection. */
  correctArtworkIds: string[];
  correct: boolean;
  points: number;
  maxPoints: number;
  /** Selected option id, or the submitted order for timeline. */
  answer: string | string[];
  /** Reveal stage used (guess mode only). */
  stage?: number;
}

export interface GameSession {
  id: string;
  mode: GameMode;
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
  mode: GameMode;
  sessionId: string;
}

export type DailyModeStatus = "pending" | "in_progress" | "completed";

export interface DailyModeProgress {
  status: DailyModeStatus;
  answers: QuestionResult[];
  /** Current reveal stage of the in-flight "guess" question, so a reload can't reset it. */
  stage?: number;
  sessionId?: string;
  completedAt?: string;
}

export interface DailyRecord {
  date: string;
  modes: Record<GameMode, DailyModeProgress>;
  completedAt?: string;
}
