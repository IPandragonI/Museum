"use client";

import { useEffect, useMemo, useState } from "react";
import { ArtImage, preloadArtwork } from "@/components/ui/ArtImage";
import { getArtwork, mustArtwork } from "@/lib/data";
import { TIMER_SECONDS } from "@/lib/game/config";
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
  exitHref: string;
  onProgress?: (answers: QuestionResult[]) => void;
  onComplete: (answers: QuestionResult[]) => void;
  /** Free Play countdown enabled in Settings. */
  timed?: boolean;
}

function MovementNotes({ right, wrong }: { right: { name: string; note: string | null }; wrong: { name: string; note: string | null } | null }) {
  if (!right.note && !wrong?.note) return null;
  return (
    <div className="fade-up space-y-3 border-l-2 border-accent pl-4 text-sm">
      {right.note ? (
        <p>
          <strong className="font-medium">{right.name}.</strong> {right.note}
        </p>
      ) : null}
      {wrong?.note ? (
        <p className="text-muted">
          <strong className="font-medium">{wrong.name}.</strong> {wrong.note}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Which Movement?: an artwork is shown; choose its artistic movement out of four.
 * The question itself holds English movement names (so the daily challenge is identical in every language);
 * this component only localises how they are displayed.
 */
export function MovementGame({ questions, initialAnswers, exitHref, onProgress, onComplete, timed }: Props) {
  const i = useI18n();
  const { t } = i;
  const flow = useGameFlow({ total: questions.length, initial: initialAnswers, onProgress, onComplete });
  const [selected, setSelected] = useState<string | null>(null);

  const q = questions[flow.index];
  const art = mustArtwork(q.artworkId);
  const answered = flow.answered;
  const picked = answered ? (selected ?? String(flow.current?.answer)) : null;

  // show movement names in the active language (ids and order stay language-free)
  const options = useMemo(() => q.options.map((o) => ({ ...o, label: i.movement(o.label) ?? o.label })), [q.options, i]);
  const correctLabel = options.find((o) => o.id === q.correctId)?.label ?? "";
  // what the movements are, so a wrong answer teaches something (the right one, and the one that was chosen)
  const optionNote = (id: string) => {
    const english = q.options.find((o) => o.id === id)?.label ?? null;
    return { name: options.find((o) => o.id === id)?.label ?? "", note: i.movementNote(english) };
  };

  useEffect(() => {
    const next = questions[flow.index + 1];
    if (next) preloadArtwork(getArtwork(next.artworkId));
  }, [flow.index, questions]);

  const choose = (id: string) => {
    const correct = id === q.correctId;
    setSelected(id);
    playSound(correct ? "correct" : "wrong");
    flow.submit({ artworkIds: [art.id], correctArtworkIds: correct ? [art.id] : [], correct, points: correct ? 100 : 0, maxPoints: 100, answer: id });
  };

  const expire = (artworkId: string) => {
    playSound("wrong");
    flow.timeout(artworkId);
  };

  const goNext = () => {
    flow.next();
    if (!flow.isLast) {
      setSelected(null);
      playSound("next");
    }
  };

  return (
    <GameShell
      mode="movement"
      index={flow.index}
      total={questions.length}
      score={flow.score}
      streak={flow.streak}
      timer={timed ? { seconds: TIMER_SECONDS, active: !answered, onExpire: () => expire(art.id) } : undefined}
      exitHref={exitHref}
    >
      <div className="grid gap-8 lg:grid-cols-[1.25fr_1fr] lg:gap-12">
        <div>
          <div className="flex justify-center bg-surface p-3 sm:p-6">
            <ArtImage key={art.id} artwork={art} alt={answered ? `${art.title}, ${i.artist(art)}` : t("movement.alt", { category: i.category(art.category), period: i.period(art.period) })} sizes="(min-width:1024px) 52vw, 94vw" priority className="art-reveal h-auto max-h-[62dvh] w-auto max-w-full object-contain" />
          </div>
          <p className="mt-4 text-sm text-muted">{t("movement.hint")}</p>
        </div>

        <div className="space-y-6">
          <div>
            <p className="eyebrow mb-3">{t("movement.prompt")}</p>
            <ChoiceList label={t("movement.options")} options={options} onSelect={choose} result={picked ? { selectedId: picked, correctId: q.correctId } : null} />
          </div>
          {flow.current ? (
            <>
              <AnswerFeedback correct={flow.current.correct} points={flow.current.points} correctLabel={correctLabel} isLast={flow.isLast} onNext={goNext} />
              <MovementNotes right={optionNote(q.correctId)} wrong={flow.current.correct || !picked ? null : optionNote(picked)} />
              <InfoPanel artwork={art} />
            </>
          ) : null}
        </div>
      </div>
    </GameShell>
  );
}
