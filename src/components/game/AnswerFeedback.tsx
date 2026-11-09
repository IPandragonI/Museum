"use client";

import { ArrowRight, Check, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { useI18n } from "@/lib/i18n/useI18n";

interface Props {
  correct: boolean;
  points: number;
  correctLabel: string;
  isLast: boolean;
  onNext: () => void;
  /** Replaces the default "Added to your collection" line. */
  note?: string;
}

/** Feedback (icon + words + colour) and continue button. Focus moves to the button so keyboard users can press Enter. */
export function AnswerFeedback({ correct, points, correctLabel, isLast, onNext, note }: Props) {
  const { t } = useI18n();
  const btn = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    btn.current?.focus({ preventScroll: true });
  }, []);
  return (
    <div className="fade-up flex flex-wrap items-center justify-between gap-4 border-y border-line py-4" role="status">
      <div className="flex items-center gap-3">
        <span className={`grid size-10 place-items-center rounded-full ${correct ? "bg-good text-bg" : "bg-bad text-bg"}`} aria-hidden>
          {correct ? <Check size={20} strokeWidth={2.5} /> : <X size={20} strokeWidth={2.5} />}
        </span>
        <div>
          <p className="font-medium">{correct ? t("game.correct", { points }) : t("game.wrong")}</p>
          <p className="text-sm text-muted">{correct ? (note ?? t("game.added")) : t("game.itWas", { answer: correctLabel })}</p>
        </div>
      </div>
      <button ref={btn} type="button" onClick={onNext} className="btn btn-primary">
        {isLast ? t("game.seeResults") : t("game.next")} <ArrowRight size={16} aria-hidden />
      </button>
    </div>
  );
}
