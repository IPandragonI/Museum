"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { dataset } from "@/lib/data";
import { DAILY_DIFFICULTY, isDifficulty, questionCount } from "@/lib/game/config";
import { useI18n } from "@/lib/i18n/useI18n";
import { generateDailyChallenge, utcDateString } from "@/lib/game/daily";
import { generateFreePlay, questionArtworkIds } from "@/lib/game/questions";
import { randomSeed } from "@/lib/rng";
import { useSettings } from "@/lib/settings";
import { missedArtworks } from "@/lib/stats";
import { addToCollection, completeDailyMode, getDaily, getRecent, listCollection, listSessions, pushRecent, saveDailyProgress, saveSession } from "@/lib/storage/repo";
import type { ChoiceQuestion, Difficulty, GameMode, GameSession, Question, QuestionResult } from "@/lib/types";
import { ArtistGame } from "./ArtistGame";
import { DetailGame } from "./DetailGame";
import { GuessGame } from "./GuessGame";
import { Intro } from "./Intro";
import { ResultsView } from "./ResultsView";
import { MovementGame } from "./MovementGame";

type Phase =
  | { kind: "loading" }
  | { kind: "empty"; review?: boolean }
  | { kind: "intro" }
  | { kind: "playing"; questions: Question[]; initial: QuestionResult[]; hint?: boolean; seed: number }
  | { kind: "results"; results: QuestionResult[]; newIds: Set<string>; collection: Set<string>; reviewCount: number };

const uuid = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `s-${Date.now()}-${Math.random().toString(36).slice(2)}`);

export function GameRunner({ mode }: { mode: GameMode }) {
  const { t } = useI18n();
  const params = useSearchParams();
  const router = useRouter();
  const daily = params.get("daily") === "1";
  const diffParam = params.get("d");
  const difficulty: Difficulty = daily ? DAILY_DIFFICULTY : isDifficulty(diffParam) ? diffParam : "easy";
  const skipIntro = params.get("start") === "1";
  /** "Review" replays only the artworks whose last attempt in this mode was wrong. */
  const review = !daily && params.get("review") === "1";
  const { timer } = useSettings();
  const timed = !daily && timer; // the Daily Challenge is never timed, so everyone plays it under the same conditions
  const typeahead = mode === "guess" && !daily && !review && difficulty === "expert";
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
        setPhase({ kind: "results", results: progress.answers, newIds: new Set(), collection, reviewCount: 0 });
        return;
      }
      const questions = generateDailyChallenge(dataset, date.current)[mode];
      if (!questions.length) return setPhase({ kind: "empty" });
      // A saved game made against an older dataset may no longer match today's questions: keep it only if every
      // saved answer still belongs to the question at the same position, otherwise start this mode afresh.
      const consistent = progress.answers.every((ans, k) => questions[k] && [...ans.artworkIds].sort().join() === [...questionArtworkIds(questions[k])].sort().join());
      setPhase({ kind: "playing", questions, initial: consistent ? progress.answers : [], hint: consistent ? progress.hint : false, seed: 0 });
    } else {
      const seed = randomSeed();
      if (review) {
        const only = new Set(missedArtworks(await listSessions(), mode));
        const questions = only.size ? generateFreePlay(dataset, mode, difficulty, seed, undefined, only) : [];
        if (!questions.length) return setPhase({ kind: "empty", review: true });
        return setPhase({ kind: "playing", questions, initial: [], seed });
      }
      const recent = new Set(await getRecent(mode));
      const questions = generateFreePlay(dataset, mode, difficulty, seed, recent);
      if (!questions.length) return setPhase({ kind: "empty" });
      setPhase({ kind: "playing", questions, initial: [], seed });
    }
  }, [daily, mode, difficulty, review]);

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
    (answers: QuestionResult[], hint?: boolean) => {
      if (daily) void saveDailyProgress(date.current, mode, answers, hint);
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
        const reviewCount = daily ? 0 : missedArtworks(await listSessions(), mode).length;
        setPhase({ kind: "results", results: answers, newIds: new Set(newIds), collection, reviewCount });
      } catch {
        // Storage unavailable (e.g. private mode): still show the results.
        setPhase({ kind: "results", results: answers, newIds: new Set(answers.flatMap((a) => a.correctArtworkIds)), collection: new Set(), reviewCount: 0 });
      }
    },
    [mode, difficulty, daily],
  );

  const replay = () => {
    setPhase({ kind: "loading" });
    void begin();
  };

  if (phase.kind === "loading") return <p className="py-24 text-center text-sm text-muted" role="status">{t("game.loading")}</p>;
  if (phase.kind === "empty")
    return (
      <div className="py-24 text-center">
        <p className="display text-3xl">{phase.review ? t("review.empty") : t("game.empty.title")}</p>
        <button type="button" className="btn btn-ghost mt-6" onClick={() => router.push("/")}>
          {t("game.empty.back")}
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
    return (
      <ResultsView
        mode={mode}
        difficulty={difficulty}
        results={phase.results}
        newIds={phase.newIds}
        collectionIds={phase.collection}
        daily={daily}
        onReplay={replay}
        backHref={exitHref}
        reviewHref={phase.reviewCount > 0 ? `/play/${mode}/?review=1&start=1&d=${difficulty}` : undefined}
        reviewCount={phase.reviewCount}
      />
    );

  // playing
  const common = { exitHref, onComplete, initialAnswers: phase.initial, timed };
  return (
    <div key={phase.seed}>
      {mode === "guess" ? <GuessGame {...common} questions={phase.questions as ChoiceQuestion[]} initialHint={phase.hint} onProgress={onProgress} typeahead={typeahead} /> : null}
      {mode === "detail" ? <DetailGame {...common} questions={phase.questions as ChoiceQuestion[]} onProgress={onProgress} /> : null}
      {mode === "artist" ? <ArtistGame {...common} questions={phase.questions as ChoiceQuestion[]} onProgress={onProgress} /> : null}
      {mode === "movement" ? <MovementGame {...common} questions={phase.questions as ChoiceQuestion[]} onProgress={onProgress} /> : null}
      <p className="sr-only">
        {t(`mode.${mode}.name`)}, {daily ? t("game.srKind.daily") : t(`diff.${difficulty}.name`)}
      </p>
    </div>
  );
}
