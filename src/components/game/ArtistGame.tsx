"use client";

import { useState } from "react";
import { ArtImage } from "@/components/ui/ArtImage";
import { CATEGORY_LABEL, mustArtwork } from "@/lib/data";
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
  const flow = useGameFlow({ total: questions.length, initial: initialAnswers, onProgress, onComplete });
  const [selected, setSelected] = useState<string | null>(null);

  const q = questions[flow.index];
  const art = mustArtwork(q.artworkId);
  const answered = flow.answered;
  const picked = answered ? (selected ?? String(flow.current?.answer)) : null;
  const ratio = art.imageWidth / art.imageHeight;

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

  return (
    <GameShell mode="artist" index={flow.index} total={questions.length} score={flow.score} exitHref={exitHref}>
      <div className="grid gap-8 lg:grid-cols-[1.25fr_1fr] lg:gap-12">
        <div>
          <div className="flex justify-center bg-surface p-3 sm:p-6">
            <ArtImage key={art.id} src={art.imageUrl} alt={`Artwork to identify: a ${CATEGORY_LABEL[art.category].toLowerCase()}${answered ? `, ${art.title}` : ""}`} width={art.imageWidth} height={art.imageHeight} priority className="art-reveal h-auto object-contain" style={{ width: `min(100%, calc(62dvh * ${ratio}))`, aspectRatio: String(ratio) }} />
          </div>
          <p className="mt-4 text-sm text-muted">
            {CATEGORY_LABEL[art.category]} · {art.period}
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <p className="eyebrow mb-3">Who made this?</p>
            <ChoiceList label="Artists" options={q.options} onSelect={choose} result={picked ? { selectedId: picked, correctId: q.correctId } : null} />
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
