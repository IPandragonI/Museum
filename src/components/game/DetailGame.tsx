"use client";

import { useEffect, useState } from "react";
import { ArtImage, PlainImage, preloadArtwork } from "@/components/ui/ArtImage";
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

export function DetailGame({ questions, initialAnswers, exitHref, onProgress, onComplete }: Props) {
  const i = useI18n();
  const { t } = i;
  const flow = useGameFlow({ total: questions.length, initial: initialAnswers, onProgress, onComplete });
  const [selected, setSelected] = useState<string | null>(null);

  const q = questions[flow.index];
  const art = mustArtwork(q.artworkId);
  const detail = art.detail!;
  const answered = flow.answered;
  const picked = answered ? (selected ?? String(flow.current?.answer)) : null;

  // Preload the next question's crop (small file) so it appears instantly.
  useEffect(() => {
    const next = questions[flow.index + 1];
    const url = next ? getArtwork(next.artworkId)?.detail?.imageUrl : null;
    if (url) new Image().src = url;
  }, [flow.index, questions]);
  // The full artwork is only needed after answering.
  useEffect(() => {
    if (!answered) preloadArtwork(art, 960);
  }, [answered, art]);

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

  const cropRatio = detail.width / detail.height;
  const fullRatio = art.imageWidth / art.imageHeight;
  const { x, y, w, h } = detail.rect;

  return (
    <GameShell mode="detail" index={flow.index} total={questions.length} score={flow.score} exitHref={exitHref}>
      <div className="grid gap-8 lg:grid-cols-[1.25fr_1fr] lg:gap-12">
        <div>
          <div className="flex justify-center bg-surface p-3 sm:p-6">
            {!answered ? (
              <PlainImage key={"d" + art.id} src={detail.imageUrl!} alt={t("detail.altCrop")} width={detail.width} height={detail.height} priority className="art-reveal h-auto object-contain" style={{ width: `min(100%, calc(60dvh * ${cropRatio}))`, aspectRatio: String(cropRatio) }} />
            ) : (
              <figure className="w-full">
                <div className="relative mx-auto overflow-hidden" style={{ aspectRatio: String(fullRatio), width: `min(100%, calc(56dvh * ${fullRatio}))` }}>
                  <ArtImage artwork={art} alt={t("detail.altFull", { title: art.title })} sizes="(min-width:1024px) 52vw, 94vw" className="art-reveal absolute inset-0 size-full object-fill" />
                  <div className="absolute border-2 border-accent shadow-[0_0_0_9999px_rgba(0,0,0,0.42)]" style={{ left: `${x * 100}%`, top: `${y * 100}%`, width: `${w * 100}%`, height: `${h * 100}%` }} aria-hidden />
                </div>
                <figcaption className="mt-3 text-center text-xs text-muted">{t("detail.caption")}</figcaption>
              </figure>
            )}
          </div>
          {!answered ? <p className="mt-4 text-sm text-muted">{t("detail.help")}</p> : null}
        </div>

        <div className="space-y-6">
          <div>
            <p className="eyebrow mb-3">{t("detail.prompt")}</p>
            <ChoiceList label={t("guess.optionsLabel")} options={q.options} onSelect={choose} result={picked ? { selectedId: picked, correctId: q.correctId } : null} />
          </div>
          {flow.current ? (
            <>
              <AnswerFeedback correct={flow.current.correct} points={flow.current.points} correctLabel={art.title} isLast={flow.isLast} onNext={goNext} />
              <InfoPanel artwork={art} />
            </>
          ) : null}
        </div>
      </div>
    </GameShell>
  );
}
