"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { dataset } from "@/lib/data";
import { DAILY_DIFFICULTY, DIFFICULTY_INFO, MODE_INFO, isDifficulty, questionCount } from "@/lib/game/config";
import { generateDailyChallenge, utcDateString } from "@/lib/game/daily";
import { generateFreePlay } from "@/lib/game/questions";
import { randomSeed } from "@/lib/rng";
import { addToCollection, completeDailyMode, getDaily, getRecent, listCollection, pushRecent, saveDailyProgress, saveSession } from "@/lib/storage/repo";
import type { ChoiceQuestion, Difficulty, GameMode, GameSession, Question, QuestionResult, TimelineQuestion } from "@/lib/types";
import { ArtistGame } from "./ArtistGame";
import { DetailGame } from "./DetailGame";
import { GuessGame } from "./GuessGame";
import { Intro } from "./Intro";
import { ResultsView } from "./ResultsView";
import { TimelineGame } from "./TimelineGame";

type Phase =
  | { kind: "loading" }
  | { kind: "empty" }
  | { kind: "intro" }
  | { kind: "playing"; questions: Question[]; initial: QuestionResult[]; stage?: number; seed: number }
  | { kind: "results"; results: QuestionResult[]; newIds: Set<string>; collection: Set<string> };

const uuid = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `s-${Date.now()}-${Math.random().toString(36).slice(2)}`);

export function GameRunner({ mode }: { mode: GameMode }) {
  const params = useSearchParams();
  const router = useRouter();
  const daily = params.get("daily") === "1";
  const diffParam = params.get("d");
  const difficulty: Difficulty = daily ? DAILY_DIFFICULTY : isDifficulty(diffParam) ? diffParam : "easy";
  const skipIntro = params.get("start") === "1";
  const [phase, setPhase] = useState<Phase>({ kind: "loading" });
  const startedAt = useRef(new Date().toISOString());
  const date = useRef(utcDateString());
  const exitHref = daily ? "/daily/" : "/";

  const begin = useCallback(async () => {
    startedAt.current = new Date().toISOString();
    if (daily) {
      date.current = utcDateString();
      const rec = await getDaily(date.current);
      const progress = rec.modes[mode];
      if (progress.status === "completed") {
        const collection = new Set((await listCollection()).map((c) => c.artworkId));
        setPhase({ kind: "results", results: progress.answers, newIds: new Set(), collection });
        return;
      }
      const questions = generateDailyChallenge(dataset, date.current)[mode];
      if (!questions.length) return setPhase({ kind: "empty" });
      setPhase({ kind: "playing", questions, initial: progress.answers, stage: progress.stage, seed: 0 });
    } else {
      const seed = randomSeed();
      const recent = new Set(await getRecent(mode));
      const questions = generateFreePlay(dataset, mode, difficulty, seed, recent);
      if (!questions.length) return setPhase({ kind: "empty" });
      setPhase({ kind: "playing", questions, initial: [], seed });
    }
  }, [daily, mode, difficulty]);

  // Decide between intro and immediate start (initial load from local storage).
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    let seen = false;
    try {
      seen = JSON.parse(localStorage.getItem("museum:rules-seen") ?? "[]").includes(mode);
    } catch {
      /* ignore */
    }
    if (skipIntro || daily || seen) void begin();
    else setPhase({ kind: "intro" });
  }, [begin, mode, skipIntro, daily]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const markRulesSeen = () => {
    try {
      const seen: string[] = JSON.parse(localStorage.getItem("museum:rules-seen") ?? "[]");
      if (!seen.includes(mode)) localStorage.setItem("museum:rules-seen", JSON.stringify([...seen, mode]));
    } catch {
      /* ignore */
    }
  };

  const onProgress = useCallback(
    (answers: QuestionResult[], stage?: number) => {
      if (daily) void saveDailyProgress(date.current, mode, answers, stage);
    },
    [daily, mode],
  );

  const onComplete = useCallback(
    async (answers: QuestionResult[]) => {
      const session: GameSession = {
        id: uuid(),
        mode,
        difficulty,
        kind: daily ? "daily" : "free",
        dailyDate: daily ? date.current : undefined,
        startedAt: startedAt.current,
        completedAt: new Date().toISOString(),
        completed: true,
        questions: answers,
      };
      try {
        await saveSession(session);
        const newIds = await addToCollection(answers.flatMap((a) => a.correctArtworkIds), mode, session.id);
        if (daily) await completeDailyMode(date.current, mode, answers, session.id);
        else await pushRecent(mode, answers.flatMap((a) => a.artworkIds));
        const collection = new Set((await listCollection()).map((c) => c.artworkId));
        setPhase({ kind: "results", results: answers, newIds: new Set(newIds), collection });
      } catch {
        // Storage unavailable (e.g. private mode): still show the results.
        setPhase({ kind: "results", results: answers, newIds: new Set(answers.flatMap((a) => a.correctArtworkIds)), collection: new Set() });
      }
    },
    [mode, difficulty, daily],
  );

  const replay = () => {
    setPhase({ kind: "loading" });
    void begin();
  };

  if (phase.kind === "loading") return <p className="py-24 text-center text-sm text-muted" role="status">Hanging the artworks…</p>;
  if (phase.kind === "empty")
    return (
      <div className="py-24 text-center">
        <p className="display text-3xl">Not enough artworks for this game yet.</p>
        <button type="button" className="btn btn-ghost mt-6" onClick={() => router.push("/")}>
          Back home
        </button>
      </div>
    );
  if (phase.kind === "intro")
    return (
      <Intro
        mode={mode}
        difficulty={difficulty}
        count={questionCount(mode, false)}
        onStart={(d) => {
          markRulesSeen();
          router.replace(`/play/${mode}/?d=${d}&start=1`);
        }}
      />
    );
  if (phase.kind === "results")
    return <ResultsView mode={mode} difficulty={difficulty} results={phase.results} newIds={phase.newIds} collectionIds={phase.collection} daily={daily} onReplay={replay} backHref={exitHref} />;

  // playing
  const common = { exitHref, onComplete, initialAnswers: phase.initial };
  return (
    <div key={phase.seed}>
      {mode === "guess" ? <GuessGame {...common} questions={phase.questions as ChoiceQuestion[]} difficulty={difficulty} initialStage={phase.stage} onProgress={onProgress} /> : null}
      {mode === "detail" ? <DetailGame {...common} questions={phase.questions as ChoiceQuestion[]} onProgress={onProgress} /> : null}
      {mode === "artist" ? <ArtistGame {...common} questions={phase.questions as ChoiceQuestion[]} onProgress={onProgress} /> : null}
      {mode === "timeline" ? <TimelineGame exitHref={exitHref} onComplete={onComplete} question={phase.questions[0] as TimelineQuestion} /> : null}
      <p className="sr-only">
        {MODE_INFO[mode].name}, {daily ? "daily challenge" : DIFFICULTY_INFO[difficulty].name}
      </p>
    </div>
  );
}
