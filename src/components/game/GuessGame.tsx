"use client";

import { Lightbulb } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { ArtImage, preloadArtwork } from "@/components/ui/ArtImage";
import { getArtwork, mustArtwork } from "@/lib/data";
import { HINT_COST } from "@/lib/game/config";
import { guessPoints } from "@/lib/game/scoring";
import { useI18n } from "@/lib/i18n/useI18n";
import { playSound } from "@/lib/sound";
import type { ChoiceQuestion, QuestionResult } from "@/lib/types";
import { AnswerFeedback } from "./AnswerFeedback";
import { ChoiceList } from "./ChoiceList";
import { GameShell } from "./GameShell";
import { InfoPanel } from "./InfoPanel";
import { useGameFlow } from "./useGameFlow";

interface Props {
  questions: ChoiceQuestion[];
  initialAnswers: QuestionResult[];
  /** The hint had already been opened on the current question (restored from a saved daily game). */
  initialHint?: boolean;
  exitHref: string;
  /** Persist progress (answers so far + whether the hint is open on the current question). */
  onProgress?: (answers: QuestionResult[], hint?: boolean) => void;
  onComplete: (answers: QuestionResult[]) => void;
}

/**
 * Guess the Artwork: the complete artwork is on screen from the start (nothing hidden).
 * Pick one of four titles and validate. One optional hint costs 25 points (100 → 75).
 */
export function GuessGame({ questions, initialAnswers, initialHint, exitHref, onProgress, onComplete }: Props) {
  const i = useI18n();
  const { t } = i;
  const [hint, setHint] = useState(!!initialHint);
  const [picked, setPicked] = useState<string | null>(null);

  const progress = useCallback((a: QuestionResult[]) => onProgress?.(a, false), [onProgress]);
  const flow = useGameFlow({ total: questions.length, initial: initialAnswers, onProgress: progress, onComplete });

  const q = questions[flow.index];
  const art = mustArtwork(q.artworkId);
  const answered = flow.answered;
  const shownPick = answered ? (picked ?? String(flow.current?.answer)) : picked;

  // Warm the cache for the next artwork while the player studies this one.
  useEffect(() => {
    const next = questions[flow.index + 1];
    if (next) preloadArtwork(getArtwork(next.artworkId));
  }, [flow.index, questions]);

  const openHint = () => {
    if (hint || answered) return;
    setHint(true);
    onProgress?.(flow.answers, true);
    playSound("reveal");
  };

  const validate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!picked || answered) return;
    const correct = picked === q.correctId;
    const points = correct ? guessPoints(hint) : 0;
    playSound(correct ? "correct" : "wrong");
    flow.submit({ artworkIds: [art.id], correctArtworkIds: correct ? [art.id] : [], correct, points, maxPoints: 100, answer: picked, hint });
  };

  const goNext = () => {
    flow.next();
    if (flow.isLast) return;
    setPicked(null);
    setHint(false);
    onProgress?.(flow.answers, false);
    playSound("next");
  };

  const worth = guessPoints(hint);

  return (
    <GameShell mode="guess" index={flow.index} total={questions.length} score={flow.score} exitHref={exitHref}>
      <div className="grid gap-8 lg:grid-cols-[1.25fr_1fr] lg:gap-12">
        <figure>
          <div className="flex justify-center bg-surface p-3 sm:p-6">
            <ArtImage
              key={art.id}
              artwork={art}
              alt={answered ? i.t("guess.altRevealed", { title: art.title, artist: i.artist(art) }) : i.t("guess.alt", { category: i.category(art.category), period: i.period(art.period) })}
              sizes="(min-width:1024px) 52vw, 94vw"
              priority
              className="art-reveal h-auto max-h-[62dvh] w-auto max-w-full object-contain"
            />
          </div>
        </figure>

        <div className="space-y-6">
          <form onSubmit={validate} className="space-y-5">
            <div>
              <p className="eyebrow mb-3" id="guess-prompt">
                {t("guess.prompt")}
              </p>
              <ChoiceList variant="select" label={t("guess.optionsLabel")} name={`guess-${flow.index}`} options={q.options} value={shownPick} onValueChange={setPicked} result={answered && shownPick ? { selectedId: shownPick, correctId: q.correctId } : null} />
            </div>

            {!answered ? (
              <>
                <div className="flex flex-wrap items-center gap-3">
                  <button type="submit" disabled={!picked} className="btn btn-primary" aria-describedby="guess-value">
                    {t("guess.validate")}
                  </button>
                  <button type="button" onClick={openHint} disabled={hint} className="btn btn-ghost">
                    <Lightbulb size={16} aria-hidden /> {t("guess.hint.open", { cost: HINT_COST })}
                  </button>
                </div>
                <p id="guess-value" className="text-sm text-muted" aria-live="polite">
                  {picked ? t("guess.value", { points: worth }) : t("guess.pickFirst")}
                </p>
                {hint ? (
                  <div className="fade-up border-l-2 border-accent pl-4" role="status">
                    <p className="eyebrow !text-accent">{t("guess.hint.title")}</p>
                    <p className="mt-1">{t("guess.hint.text", { category: i.category(art.category), period: i.period(art.period) })}</p>
                    <p className="mt-1 text-sm text-muted">{t("guess.hint.used", { points: worth })}</p>
                  </div>
                ) : null}
              </>
            ) : null}
          </form>

          {flow.current ? (
            <>
              <AnswerFeedback correct={flow.current.correct} points={flow.current.points} correctLabel={art.title} isLast={flow.isLast} onNext={goNext} note={flow.current.hint ? t("game.addedHint") : undefined} />
              <InfoPanel artwork={art} />
            </>
          ) : null}
        </div>
      </div>
    </GameShell>
  );
}
