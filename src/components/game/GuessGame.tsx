"use client";

import { Eye } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { ArtImage } from "@/components/ui/ArtImage";
import { mustArtwork } from "@/lib/data";
import { GRID_SIZE, REVEAL_STAGES, STAGE_POINTS } from "@/lib/game/config";
import { revealedCells } from "@/lib/game/reveal";
import { guessPoints } from "@/lib/game/scoring";
import { playSound } from "@/lib/sound";
import type { ChoiceQuestion, Difficulty, QuestionResult } from "@/lib/types";
import { AnswerFeedback } from "./AnswerFeedback";
import { ChoiceList } from "./ChoiceList";
import { GameShell } from "./GameShell";
import { InfoPanel } from "./InfoPanel";
import { useGameFlow } from "./useGameFlow";

interface Props {
  questions: ChoiceQuestion[];
  difficulty: Difficulty;
  initialAnswers: QuestionResult[];
  initialStage?: number;
  exitHref: string;
  /** Persist progress (answers so far + current reveal stage). */
  onProgress?: (answers: QuestionResult[], stage?: number) => void;
  onComplete: (answers: QuestionResult[]) => void;
}

const CELLS = GRID_SIZE * GRID_SIZE;

export function GuessGame({ questions, difficulty, initialAnswers, initialStage, exitHref, onProgress, onComplete }: Props) {
  const [stage, setStage] = useState(Math.min(Math.max(initialStage ?? 1, 1), 4));
  const [selected, setSelected] = useState<string | null>(null);

  const progress = useCallback((a: QuestionResult[]) => onProgress?.(a, undefined), [onProgress]);
  const flow = useGameFlow({ total: questions.length, initial: initialAnswers, onProgress: progress, onComplete });

  const q = questions[flow.index];
  const art = mustArtwork(q.artworkId);
  const open = useMemo(() => revealedCells(art.id, difficulty, stage), [art.id, difficulty, stage]);
  const answered = flow.answered;

  const revealMore = () => {
    if (stage >= 4 || answered) return;
    const next = stage + 1;
    setStage(next);
    onProgress?.(flow.answers, next);
    playSound("reveal");
  };

  const choose = (id: string) => {
    const correct = id === q.correctId;
    setSelected(id);
    const points = correct ? guessPoints(stage) : 0;
    playSound(correct ? "correct" : "wrong");
    flow.submit({ artworkIds: [art.id], correctArtworkIds: correct ? [art.id] : [], correct, points, maxPoints: 100, answer: id, stage });
  };

  const goNext = () => {
    if (flow.isLast) {
      flow.next();
      return;
    }
    flow.next();
    setSelected(null);
    setStage(1);
    onProgress?.(flow.answers, 1);
    playSound("next");
  };

  const nextStagePoints = stage < 4 ? STAGE_POINTS[stage] : null;
  const ratio = art.imageWidth / art.imageHeight;

  return (
    <GameShell mode="guess" index={flow.index} total={questions.length} score={flow.score} exitHref={exitHref}>
      <div className="grid gap-8 lg:grid-cols-[1.25fr_1fr] lg:gap-12">
        <div>
          <div className="flex justify-center bg-surface p-3 sm:p-6">
            <div className="relative overflow-hidden" style={{ aspectRatio: String(ratio), width: `min(100%, calc(60dvh * ${ratio}))` }}>
              <ArtImage key={art.id} src={art.imageUrl} alt={answered ? `${art.title} by ${art.artist ?? "unknown artist"}` : "A hidden artwork, partly revealed behind a grid"} width={art.imageWidth} height={art.imageHeight} priority className="art-reveal absolute inset-0 size-full object-fill" />
              <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`, gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)` }} aria-hidden>
                {Array.from({ length: CELLS }, (_, i) => (
                  <div key={i} className="veil-cell" data-open={answered || open.has(i)} />
                ))}
              </div>
            </div>
          </div>
          {!answered ? (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted" aria-live="polite">
                Reveal {stage} of 4 · <span className="text-ink">{STAGE_POINTS[stage - 1]} points</span> for a correct answer · {open.size}/{CELLS} squares shown
              </p>
              <button type="button" onClick={revealMore} disabled={stage >= 4} className="btn btn-ghost">
                <Eye size={16} aria-hidden /> {stage >= 4 ? "Fully revealed" : `Reveal more (→ ${nextStagePoints} pts)`}
              </button>
            </div>
          ) : null}
          <p className="sr-only">{REVEAL_STAGES[difficulty][stage - 1]} squares are visible.</p>
        </div>

        <div className="space-y-6">
          <div>
            <p className="eyebrow mb-3">Which artwork is this?</p>
            <ChoiceList label="Artwork titles" options={q.options} onSelect={choose} result={answered && selected ? { selectedId: selected, correctId: q.correctId } : answered ? { selectedId: String(flow.current?.answer), correctId: q.correctId } : null} />
          </div>
          {flow.current ? (
            <>
              <AnswerFeedback correct={flow.current.correct} points={flow.current.points} correctLabel={art.title} isLast={flow.isLast} onNext={goNext} note={`Revealed at stage ${flow.current.stage ?? 1}. Added to your collection.`} />
              <InfoPanel artwork={art} />
            </>
          ) : null}
        </div>
      </div>
    </GameShell>
  );
}
