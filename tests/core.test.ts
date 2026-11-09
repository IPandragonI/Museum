import { describe, expect, it } from "vitest";
import { dataset } from "@/lib/data";
import { DIFFICULTIES, REVEAL_STAGES } from "@/lib/game/config";
import { computeStreaks, emptyDailyRecord, generateDailyChallenge, isDailyComplete, previousDate, utcDateString } from "@/lib/game/daily";
import { correctTimelineOrder, generateFreePlay, generateQuestions, questionArtworkIds } from "@/lib/game/questions";
import { revealOrder, revealedCells } from "@/lib/game/reveal";
import { guessPoints, timelineCorrectPositions, timelinePoints } from "@/lib/game/scoring";
import { createRng } from "@/lib/rng";
import { computeStats } from "@/lib/stats";
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
      expect(a.license).toMatch(/CC0/);
      if (a.detail) {
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
  it("guess points follow the reveal stage", () => {
    expect([1, 2, 3, 4].map(guessPoints)).toEqual([100, 75, 50, 25]);
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

describe("reveal order", () => {
  it("is a deterministic permutation of the 25 cells, sparing the centre early", () => {
    const o = revealOrder("cma-1");
    expect(o).toEqual(revealOrder("cma-1"));
    expect([...o].sort((a, b) => a - b)).toEqual(Array.from({ length: 25 }, (_, i) => i));
    const centre = new Set([6, 7, 8, 11, 12, 13, 16, 17, 18]);
    expect(o.slice(0, 10).some((c) => centre.has(c))).toBe(false);
    expect(revealOrder("cma-2")).not.toEqual(o);
  });
  it("reveals grow by stage for every difficulty", () => {
    for (const d of DIFFICULTIES) {
      const sizes = [1, 2, 3, 4].map((s) => revealedCells("x", d, s).size);
      expect(sizes).toEqual([...REVEAL_STAGES[d]]);
    }
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
  });

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
    const intermediate = ids.filter((id) => dataset.byId.get(id)!.difficulty === "intermediate");
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
