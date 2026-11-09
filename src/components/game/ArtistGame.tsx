"use client";

import { useEffect, useState } from "react";
import { ArtImage, preloadArtwork } from "@/components/ui/ArtImage";
import { getArtwork, mustArtwork } from "@/lib/data";
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
}

export function ArtistGame({ questions, initialAnswers, exitHref, onProgress, onComplete }: Props) {
  const i = useI18n();
  const { t } = i;
  const flow = useGameFlow({ total: questions.length, initial: initialAnswers, onProgress, onComplete });
  const [selected, setSelected] = useState<string | null>(null);

  const q = questions[flow.index];
  const art = mustArtwork(q.artworkId);
  const answered = flow.answered;
  const picked = answered ? (selected ?? String(flow.current?.answer)) : null;

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

  const goNext = () => {
    flow.next();
    if (!flow.isLast) {
      setSelected(null);
      playSound("next");
    }
  };

  const alt = t("artist.alt", { category: i.category(art.category), period: i.period(art.period) });

  return (
    <GameShell mode="artist" index={flow.index} total={questions.length} score={flow.score} exitHref={exitHref}>
      <div className="grid gap-8 lg:grid-cols-[1.25fr_1fr] lg:gap-12">
        <div>
          <div className="flex justify-center bg-surface p-3 sm:p-6">
            <ArtImage key={art.id} artwork={art} alt={answered ? `${art.title}, ${i.artist(art)}` : alt} sizes="(min-width:1024px) 52vw, 94vw" priority className="art-reveal h-auto max-h-[62dvh] w-auto max-w-full object-contain" />
          </div>
          <p className="mt-4 text-sm text-muted">
            {i.category(art.category)} · {i.period(art.period)}
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <p className="eyebrow mb-3">{t("artist.prompt")}</p>
            <ChoiceList label={t("artist.options")} options={q.options} onSelect={choose} result={picked ? { selectedId: picked, correctId: q.correctId } : null} />
          </div>
          {flow.current ? (
            <>
              <AnswerFeedback correct={flow.current.correct} points={flow.current.points} correctLabel={art.artist ?? ""} isLast={flow.isLast} onNext={goNext} />
              <InfoPanel artwork={art} showBio />
            </>
          ) : null}
        </div>
      </div>
    </GameShell>
  );
}
