"use client";

import { ArrowRight, Check, X } from "lucide-react";
import { useEffect, useRef } from "react";

interface Props {
  correct: boolean;
  points: number;
  correctLabel: string;
  isLast: boolean;
  onNext: () => void;
  /** Extra line, e.g. "Revealed at stage 2". */
  note?: string;
}

/** Subtle feedback + continue button. Focus moves to the button so keyboard users can press Enter. */
export function AnswerFeedback({ correct, points, correctLabel, isLast, onNext, note }: Props) {
  const btn = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    btn.current?.focus({ preventScroll: true });
  }, []);
  return (
    <div className="fade-up flex flex-wrap items-center justify-between gap-4 border-y border-line py-4" role="status">
      <div className="flex items-center gap-3">
        <span className={`grid size-9 place-items-center rounded-full ${correct ? "bg-good text-bg" : "bg-bad text-bg"}`} aria-hidden>
          {correct ? <Check size={18} strokeWidth={2.5} /> : <X size={18} strokeWidth={2.5} />}
        </span>
        <div>
          <p className="font-medium">{correct ? `Correct · +${points} points` : "Not quite · 0 points"}</p>
          <p className="text-sm text-muted">{correct ? (note ?? "Added to your collection.") : `It was ${correctLabel}.`}</p>
        </div>
      </div>
      <button ref={btn} type="button" onClick={onNext} className="btn btn-primary">
        {isLast ? "See results" : "Next"} <ArrowRight size={16} aria-hidden />
      </button>
    </div>
  );
}
