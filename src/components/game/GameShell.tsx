"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { MODE_INFO } from "@/lib/game/config";
import type { GameMode } from "@/lib/types";

interface Props {
  mode: GameMode;
  /** 0-based index of the current question. */
  index: number;
  total: number;
  /** Points scored so far. */
  score: number;
  exitHref: string;
  unit?: string;
  children: React.ReactNode;
}

/** Shared frame for every game screen: back link, question counter, progress, score. */
export function GameShell({ mode, index, total, score, exitHref, children }: Props) {
  const info = MODE_INFO[mode];
  // Keep the player at the top when a new question appears.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [index]);
  const showCount = total > 1;
  return (
    <section aria-label={info.name} className="pt-2">
      <div className="flex items-center justify-between gap-4 py-3">
        <Link href={exitHref} className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-ink">
          <ArrowLeft size={16} aria-hidden /> Leave
        </Link>
        <p className="eyebrow hidden sm:block">{info.name}</p>
        <p className="text-sm tabular-nums" aria-live="polite">
          <span className="text-muted">Score </span>
          {score}
        </p>
      </div>
      {showCount ? (
        <div className="mb-6" role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={index + 1} aria-label={`Question ${index + 1} of ${total}`}>
          <div className="mb-2 flex items-baseline justify-between text-xs text-muted">
            <span className="eyebrow">
              Question {index + 1} / {total}
            </span>
          </div>
          <div className="flex gap-1">
            {Array.from({ length: total }, (_, i) => (
              <span key={i} className={`h-[3px] flex-1 transition-colors duration-500 ${i < index ? "bg-ink" : i === index ? "bg-accent" : "bg-line"}`} />
            ))}
          </div>
        </div>
      ) : (
        <div className="mb-6 h-px bg-line" />
      )}
      {children}
    </section>
  );
}
