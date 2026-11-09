"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { dataset } from "@/lib/data";
import { MIX_PER_MODE, MODES, isDifficulty } from "@/lib/game/config";
import { generateQuestions } from "@/lib/game/questions";
import { useI18n } from "@/lib/i18n/useI18n";
import { createRng, randomSeed } from "@/lib/rng";
import { useSettings } from "@/lib/settings";
import { addToCollection, getRecent, listCollection, pushRecent, saveSession } from "@/lib/storage/repo";
import type { ChoiceQuestion, Difficulty, GameMode, GameSession, QuestionResult } from "@/lib/types";
import { ArtistGame } from "./ArtistGame";
import { DetailGame } from "./DetailGame";
import { GuessGame } from "./GuessGame";
import { MovementGame } from "./MovementGame";
import { ResultsView } from "./ResultsView";

interface Block {
  mode: GameMode;
  questions: ChoiceQuestion[];
}
type Phase =
  | { kind: "loading" }
  | { kind: "empty" }
  | { kind: "playing"; blocks: Block[]; step: number; done: QuestionResult[]; seed: number }
  | { kind: "results"; results: QuestionResult[]; modes: GameMode[]; newIds: Set<string>; collection: Set<string> };

const uuid = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `s-${Date.now()}-${Math.random().toString(36).slice(2)}`);

/**
 * Mix: 3 questions of each game (Guess, Detail, Artist, Movement) in a row, never the same artwork twice.
 * Each block is saved as its own ordinary Free Play session in its own mode, so statistics, the collection and the
 * review list keep working exactly as usual. Free Play only: it is not part of the Daily Challenge.
 */
export function MixRunner() {
  const { t } = useI18n();
  const params = useSearchParams();
  const router = useRouter();
  const { timer } = useSettings();
  const diffParam = params.get("d");
  const difficulty: Difficulty = isDifficulty(diffParam) ? diffParam : "easy";
  const [phase, setPhase] = useState<Phase>({ kind: "loading" });
  const startedAt = useRef(new Date().toISOString());
  /** Artworks added to the collection by the blocks played so far (shown on the final screen). */
  const added = useRef(new Set<string>());

  const begin = useCallback(async () => {
    startedAt.current = new Date().toISOString();
    added.current = new Set();
    const seed = randomSeed();
    const used = new Set<string>();
    const blocks: Block[] = [];
    for (const [k, mode] of MODES.entries()) {
      const recent = new Set(await getRecent(mode));
      const questions = generateQuestions(dataset, mode, { count: MIX_PER_MODE, difficulty, recent, exclude: used }, createRng(seed + k * 7919)) as ChoiceQuestion[];
      questions.forEach((q) => used.add(q.artworkId));
      if (questions.length) blocks.push({ mode, questions });
    }
    if (!blocks.length) return setPhase({ kind: "empty" });
    setPhase({ kind: "playing", blocks, step: 0, done: [], seed });
  }, [difficulty]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- start the game on mount (reads IndexedDB first)
    void begin();
  }, [begin]);

  const onBlockComplete = useCallback(
    async (answers: QuestionResult[]) => {
      if (phase.kind !== "playing") return;
      const block = phase.blocks[phase.step];
      const done = [...phase.done, ...answers];
      const session: GameSession = {
        id: uuid(),
        mode: block.mode,
        difficulty,
        kind: "free",
        startedAt: startedAt.current,
        completedAt: new Date().toISOString(),
        completed: true,
        questions: answers,
      };
      try {
        await saveSession(session);
        (await addToCollection(answers.flatMap((a) => a.correctArtworkIds), block.mode, session.id)).forEach((id) => added.current.add(id));
        await pushRecent(block.mode, answers.flatMap((a) => a.artworkIds));
      } catch {
        // Storage unavailable (e.g. private mode): the game still goes on.
        answers.flatMap((a) => a.correctArtworkIds).forEach((id) => added.current.add(id));
      }
      if (phase.step + 1 < phase.blocks.length) {
        setPhase({ ...phase, step: phase.step + 1, done });
        return;
      }
      let collection = new Set<string>();
      try {
        collection = new Set((await listCollection()).map((c) => c.artworkId));
      } catch {
        /* ignore */
      }
      const modes = phase.blocks.flatMap((b) => b.questions.map(() => b.mode));
      setPhase({ kind: "results", results: done, modes, newIds: new Set(added.current), collection });
    },
    [phase, difficulty],
  );

  const replay = () => {
    setPhase({ kind: "loading" });
    void begin();
  };

  if (phase.kind === "loading")
    return (
      <p className="py-24 text-center text-sm text-muted" role="status">
        {t("game.loading")}
      </p>
    );
  if (phase.kind === "empty")
    return (
      <div className="py-24 text-center">
        <p className="display text-3xl">{t("game.empty.title")}</p>
        <button type="button" className="btn btn-ghost mt-6" onClick={() => router.push("/")}>
          {t("game.empty.back")}
        </button>
      </div>
    );
  if (phase.kind === "results")
    return <ResultsView mode="mix" rowModes={phase.modes} difficulty={difficulty} results={phase.results} newIds={phase.newIds} collectionIds={phase.collection} onReplay={replay} backHref="/" />;

  const block = phase.blocks[phase.step];
  const blockKey = `${phase.seed}-${phase.step}`;
  const common = { exitHref: "/", initialAnswers: [] as QuestionResult[], onComplete: onBlockComplete, timed: timer, questions: block.questions };
  return (
    <div>
      <p className="eyebrow pt-4">{t("mix.step", { n: phase.step + 1, total: phase.blocks.length })}</p>
      {block.mode === "guess" ? <GuessGame key={blockKey} {...common} typeahead={difficulty === "expert"} /> : null}
      {block.mode === "detail" ? <DetailGame key={blockKey} {...common} /> : null}
      {block.mode === "artist" ? <ArtistGame key={blockKey} {...common} /> : null}
      {block.mode === "movement" ? <MovementGame key={blockKey} {...common} /> : null}
    </div>
  );
}
