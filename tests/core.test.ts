import { describe, expect, it } from "vitest";
import { dataset } from "@/lib/data";
import { DIFFICULTIES, HINT_COST } from "@/lib/game/config";
import { computeStreaks, emptyDailyRecord, generateDailyChallenge, isDailyComplete, previousDate, utcDateString } from "@/lib/game/daily";
import { correctTimelineOrder, generateFreePlay, generateQuestions, questionArtworkIds } from "@/lib/game/questions";
import { guessPoints, timelineCorrectPositions, timelinePoints } from "@/lib/game/scoring";
import { createRng } from "@/lib/rng";
import { computeStats } from "@/lib/stats";
import fs from "node:fs";
import path from "node:path";
import { en } from "@/lib/i18n/en";
import { fr } from "@/lib/i18n/fr";
import { dateLabel, movementLabel, t, tn } from "@/lib/i18n";
import type { ChoiceQuestion, DailyRecord, GameSession, TimelineQuestion } from "@/lib/types";

describe("dataset quality", () => {
  it("has a meaningful number of unique artworks with valid core fields", () => {
    expect(dataset.artworks.length).toBeGreaterThanOrEqual(150);
    const ids = new Set(dataset.artworks.map((a) => a.id));
    expect(ids.size).toBe(dataset.artworks.length);
    for (const a of dataset.artworks) {
      expect(a.title.length).toBeGreaterThan(2);
      expect(Number.isFinite(a.creationYear)).toBe(true);
      expect(a.imageUrl.startsWith("/art/")).toBe(true);
      expect(a.images.variants.length).toBe(3);
      expect(a.images.variants.every((v) => v.bytes > 0 && v.url.startsWith(`/art/${a.id}/`))).toBe(true);
      expect(Object.keys(a.difficulty).sort()).toEqual(["artist", "detail", "guess", "timeline"]);
      expect(a.license).toMatch(/CC0|public domain/i);
      if (a.detail && a.detail.status !== "rejected") {
        // the crop belongs to its own artwork: same folder
        expect(a.detail.imageUrl).toBe(`/art/${a.id}/detail.webp`);
        const { x, y, w, h } = a.detail.rect;
        expect(x).toBeGreaterThanOrEqual(0);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(x + w).toBeLessThanOrEqual(1.001);
        expect(y + h).toBeLessThanOrEqual(1.001);
      }
    }
  });
});

describe("scoring", () => {
  it("guess: 100 points, or 75 when the optional hint was used", () => {
    expect(guessPoints(false)).toBe(100);
    expect(guessPoints(true)).toBe(100 - HINT_COST);
    expect(HINT_COST).toBe(25);
  });
  it("timeline: exact positions only, proportional credit, 100 for perfect", () => {
    const correct = ["a", "b", "c", "d", "e"];
    expect(timelineCorrectPositions(["a", "b", "c", "d", "e"], correct)).toBe(5);
    expect(timelineCorrectPositions(["b", "a", "c", "d", "e"], correct)).toBe(3);
    expect(timelinePoints(5, 5)).toBe(100);
    expect(timelinePoints(3, 5)).toBe(60);
    expect(timelinePoints(0, 4)).toBe(0);
    expect(timelinePoints(1, 4)).toBe(25);
  });
});

describe("question generation", () => {
  it("builds valid multiple-choice questions in every mode and difficulty", () => {
    for (const mode of ["guess", "detail", "artist"] as const) {
      for (const difficulty of DIFFICULTIES) {
        for (let seed = 1; seed <= 15; seed++) {
          const qs = generateQuestions(dataset, mode, { count: 10, difficulty }, createRng(seed)) as ChoiceQuestion[];
          expect(qs.length).toBeGreaterThanOrEqual(8);
          const seen = new Set<string>();
          for (const q of qs) {
            expect(q.options).toHaveLength(4);
            expect(new Set(q.options.map((o) => o.id)).size).toBe(4);
            expect(new Set(q.options.map((o) => o.label.toLowerCase())).size).toBe(4);
            expect(q.options.filter((o) => o.id === q.correctId)).toHaveLength(1);
            const art = dataset.byId.get(q.artworkId)!;
            const correct = q.options.find((o) => o.id === q.correctId)!;
            expect(correct.label).toBe(mode === "artist" ? art.artist : art.title);
            if (mode === "detail") expect(art.detail).not.toBeNull();
            expect(seen.has(q.artworkId)).toBe(false); // no repeats inside a game
            seen.add(q.artworkId);
          }
        }
      }
    }
  }, 30_000);

  it("timelines have distinct, well-separated years and are never pre-sorted", () => {
    for (const difficulty of DIFFICULTIES) {
      for (let seed = 1; seed <= 25; seed++) {
        const [q] = generateQuestions(dataset, "timeline", { count: 5, difficulty }, createRng(seed)) as TimelineQuestion[];
        expect(q.artworkIds).toHaveLength(5);
        const years = q.artworkIds.map((id) => dataset.byId.get(id)!.creationYear);
        expect(new Set(years).size).toBe(5);
        const sorted = correctTimelineOrder(dataset, q.artworkIds);
        expect(sorted).not.toEqual(q.artworkIds);
        const ys = sorted.map((id) => dataset.byId.get(id)!.creationYear);
        expect(ys).toEqual([...ys].sort((a, b) => a - b));
      }
    }
  });

  it("free play avoids recently played artworks when the pool allows", () => {
    const first = generateFreePlay(dataset, "artist", "easy", 42) as ChoiceQuestion[];
    const recent = new Set(first.map((q) => q.artworkId));
    const second = generateFreePlay(dataset, "artist", "easy", 43, recent) as ChoiceQuestion[];
    expect(second.some((q) => recent.has(q.artworkId))).toBe(false);
  });
});

describe("daily challenge", () => {
  const date = "2026-11-09";
  it("is deterministic for a given date and differs across dates", () => {
    const a = generateDailyChallenge(dataset, date);
    const b = generateDailyChallenge(dataset, date);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(JSON.stringify(generateDailyChallenge(dataset, "2026-11-10"))).not.toBe(JSON.stringify(a));
  });

  it("has the specified composition and never reuses an artwork across modes", () => {
    for (const d of ["2026-01-01", "2026-06-15", date, "2027-02-28"]) {
      const c = generateDailyChallenge(dataset, d);
      expect(c.guess).toHaveLength(3);
      expect(c.detail).toHaveLength(3);
      expect(c.artist).toHaveLength(3);
      expect(c.timeline).toHaveLength(1);
      expect((c.timeline[0] as TimelineQuestion).artworkIds).toHaveLength(4);
      const ids = Object.values(c).flatMap((qs) => qs.flatMap(questionArtworkIds));
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("uses only intermediate-difficulty artworks where the pool allows", () => {
    const c = generateDailyChallenge(dataset, date);
    const ids = Object.values(c).flatMap((qs) => qs.flatMap(questionArtworkIds));
    const modes = ["guess", "detail", "artist", "timeline"] as const;
    const intermediate = modes.flatMap((m) => c[m].flatMap(questionArtworkIds).filter((id) => dataset.byId.get(id)!.difficulty[m] === "intermediate"));
    expect(intermediate.length / ids.length).toBeGreaterThan(0.8);
  });

  it("uses UTC dates", () => {
    expect(utcDateString(new Date("2026-11-09T23:59:59-05:00"))).toBe("2026-11-10");
    expect(previousDate("2026-03-01")).toBe("2026-02-28");
  });
});

describe("daily streaks", () => {
  it("counts consecutive completed days, forgiving an unfinished today", () => {
    const today = "2026-11-09";
    expect(computeStreaks([], today)).toEqual({ current: 0, best: 0, lastCompleted: null });
    expect(computeStreaks(["2026-11-08", "2026-11-07", "2026-11-06"], today)).toMatchObject({ current: 3, best: 3 });
    expect(computeStreaks(["2026-11-09", "2026-11-08"], today).current).toBe(2);
    expect(computeStreaks(["2026-11-06", "2026-11-05"], today).current).toBe(0); // missed yesterday
    expect(computeStreaks(["2026-10-01", "2026-10-02", "2026-10-03", "2026-11-08"], today)).toMatchObject({ current: 1, best: 3, lastCompleted: "2026-11-08" });
  });
  it("a day is complete only when all four modes are", () => {
    const rec: DailyRecord = emptyDailyRecord("2026-11-09");
    expect(isDailyComplete(rec)).toBe(false);
    for (const m of ["guess", "detail", "artist"] as const) rec.modes[m].status = "completed";
    expect(isDailyComplete(rec)).toBe(false);
    rec.modes.timeline.status = "completed";
    expect(isDailyComplete(rec)).toBe(true);
  });
});

describe("statistics", () => {
  const session = (over: Partial<GameSession>, pts: number[]): GameSession => ({
    id: Math.random().toString(),
    mode: "guess",
    difficulty: "easy",
    kind: "free",
    startedAt: "2026-11-09T10:00:00Z",
    completedAt: "2026-11-09T10:05:00Z",
    completed: true,
    questions: pts.map((p) => ({ artworkIds: ["a"], correctArtworkIds: p ? ["a"] : [], correct: p > 0, points: p, maxPoints: 100, answer: "x" })),
    ...over,
  });
  it("derives everything from stored sessions", () => {
    const stats = computeStats([session({}, [100, 0, 50, 100]), session({ mode: "artist", difficulty: "expert" }, [100, 0])], [], "2026-11-09");
    expect(stats.gamesPlayed).toBe(2);
    expect(stats.questionsAnswered).toBe(6);
    expect(stats.accuracy).toBe(Math.round((350 / 600) * 100));
    expect(stats.accuracyByMode.guess).toBe(63);
    expect(stats.accuracyByMode.detail).toBeNull();
    expect(stats.accuracyByDifficulty.expert).toBe(50);
    expect(stats.bestScore.guess).toEqual({ points: 250, max: 400 });
  });
});

describe("localisation", () => {
  it("French defines every English key, with the same {placeholders}", () => {
    const keys = Object.keys(en) as (keyof typeof en)[];
    expect(Object.keys(fr).sort()).toEqual([...keys].sort());
    const ph = (x: string) => (x.match(/\{\w+\}/g) ?? []).sort().join();
    for (const k of keys) expect(ph(fr[k]), k).toBe(ph(en[k]));
  });
  it("interpolates, pluralises and applies French typography", () => {
    expect(t("en", "game.correct", { points: 75 })).toBe("Correct · +75 points");
    expect(tn("fr", "res.added", 1)).toBe("1 œuvre ajoutée à votre collection.");
    expect(tn("fr", "res.added", 3)).toBe("3 œuvres ajoutées à votre collection.");
    expect(tn("en", "res.added", 1)).toBe("1 artwork added to your collection.");
    expect(t("fr", "guess.prompt")).toBe("Quelle est cette œuvre ?");
  });
  it("translates art vocabulary, falling back to the original wording", () => {
    expect(movementLabel("fr", "Impressionism")).toBe("Impressionnisme");
    expect(movementLabel("fr", "Some unlisted movement")).toBe("Some unlisted movement");
    expect(movementLabel("en", null)).toBeNull();
    expect(dateLabel("fr", "c. 1750–55")).toBe("vers 1750–55");
    expect(dateLabel("fr", "525–500 BCE")).toBe("525–500 av. J.-C.");
    expect(dateLabel("fr", "early 1830s")).toBe("début des années 1830");
    expect(dateLabel("en", "c. 1750–55")).toBe("c. 1750–55");
  });
  it("every movement in the data has a French label", () => {
    const missing = [...new Set(dataset.artworks.map((a) => a.movement).filter((m): m is string => !!m))].filter((m) => movementLabel("fr", m) === m && !/^(Baroque|Rococo|Ukiyo-e)$/.test(m));
    expect(missing).toEqual([]);
  });
  it("French artwork translations are structurally valid", () => {
    const tr = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../src/data/translations.fr.json"), "utf8"));
    for (const [id, v] of Object.entries<{ description: string; didYouKnow?: string[] }>(tr.artworks)) {
      const a = dataset.byId.get(id);
      expect(a, id).toBeDefined();
      expect(v.description.length).toBeGreaterThan(20);
      expect(v.didYouKnow?.length ?? 0, id).toBe(a!.interestingFacts.length);
    }
  });
  it("every artwork description, fact and displayed biography has a French translation", () => {
    const tr = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../src/data/translations.fr.json"), "utf8"));
    const missing = dataset.artworks.filter((a) => !tr.artworks[a.id]?.description).map((a) => a.id);
    expect(missing).toEqual([]);
    const noBio = [...new Set(dataset.artworks.filter((a) => a.artistBio && !tr.artists[a.artist!] && !tr.artworks[a.id]?.artistBio).map((a) => a.artist))];
    expect(noBio).toEqual([]);
  });
  it("the daily challenge cannot depend on the language: game logic never imports the i18n layer", () => {
    const dir = path.resolve(__dirname, "../src/lib/game");
    for (const f of fs.readdirSync(dir)) expect(fs.readFileSync(path.join(dir, f), "utf8"), f).not.toMatch(/from\s+["'][^"']*(i18n|settings)|localStorage/);
  });
});

describe("compatibility with games saved before the redesign", () => {
  it("statistics still read old guess results that carry a reveal `stage` and partial points", () => {
    const old: GameSession = {
      id: "old",
      mode: "guess",
      difficulty: "easy",
      kind: "free",
      startedAt: "2026-11-01T10:00:00Z",
      completedAt: "2026-11-01T10:05:00Z",
      completed: true,
      questions: [
        { artworkIds: ["a"], correctArtworkIds: ["a"], correct: true, points: 50, maxPoints: 100, answer: "a", stage: 3 },
        { artworkIds: ["b"], correctArtworkIds: [], correct: false, points: 0, maxPoints: 100, answer: "x", stage: 1 },
      ],
    };
    const stats = computeStats([old], [], "2026-11-09");
    expect(stats.gamesPlayed).toBe(1);
    expect(stats.accuracy).toBe(25);
  });
});
