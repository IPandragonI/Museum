"use client";

import { useState } from "react";
import { ArtImage } from "@/components/ui/ArtImage";
import { mustArtwork } from "@/lib/data";
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
  const flow = useGameFlow({ total: questions.length, initial: initialAnswers, onProgress, onComplete });
  const [selected, setSelected] = useState<string | null>(null);

  const q = questions[flow.index];
  const art = mustArtwork(q.artworkId);
  const detail = art.detail!;
  const answered = flow.answered;
  const picked = answered ? (selected ?? String(flow.current?.answer)) : null;

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
  const { x, y, w, h } = detail.rect;

  return (
    <GameShell mode="detail" index={flow.index} total={questions.length} score={flow.score} exitHref={exitHref}>
      <div className="grid gap-8 lg:grid-cols-[1.25fr_1fr] lg:gap-12">
        <div>
          <div className="flex justify-center bg-surface p-3 sm:p-6">
            {!answered ? (
              <ArtImage key={"d" + art.id} src={detail.imageUrl} alt="A close-up detail cropped from a famous artwork" width={detail.width} height={detail.height} priority className="art-reveal h-auto object-contain" style={{ width: `min(100%, calc(60dvh * ${cropRatio}))`, aspectRatio: String(cropRatio) }} />
            ) : (
              <figure className="w-full">
                <div className="relative mx-auto overflow-hidden" style={{ aspectRatio: String(art.imageWidth / art.imageHeight), width: `min(100%, calc(56dvh * ${art.imageWidth / art.imageHeight}))` }}>
                  <ArtImage src={art.imageUrl} alt={`${art.title} in full, with the detail outlined`} width={art.imageWidth} height={art.imageHeight} className="art-reveal absolute inset-0 size-full object-fill" />
                  <div className="absolute border-2 border-accent shadow-[0_0_0_9999px_rgba(0,0,0,0.42)]" style={{ left: `${x * 100}%`, top: `${y * 100}%`, width: `${w * 100}%`, height: `${h * 100}%` }} aria-hidden />
                </div>
                <figcaption className="mt-3 text-center text-xs text-muted">The outlined area is the detail you were shown, cropped from the museum’s original image.</figcaption>
              </figure>
            )}
          </div>
          {!answered ? <p className="mt-4 text-sm text-muted">A real crop of the original image — nothing has been altered.</p> : null}
        </div>

        <div className="space-y-6">
          <div>
            <p className="eyebrow mb-3">Which artwork does this detail come from?</p>
            <ChoiceList label="Artwork titles" options={q.options} onSelect={choose} result={picked ? { selectedId: picked, correctId: q.correctId } : null} />
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
