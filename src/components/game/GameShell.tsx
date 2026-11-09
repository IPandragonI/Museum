"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { useI18n } from "@/lib/i18n/useI18n";
import type { GameMode } from "@/lib/types";

interface Props {
  mode: GameMode;
  /** 0-based index of the current question. */
  index: number;
  total: number;
  /** Points scored so far. */
  score: number;
  exitHref: string;
  children: React.ReactNode;
}

/** Shared frame for every game screen: back link, question counter, progress, score. */
export function GameShell({ mode, index, total, score, exitHref, children }: Props) {
  const { t, num } = useI18n();
  // Keep the player at the top when a new question appears.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [index]);
  return (
    <section aria-label={t(`mode.${mode}.name`)} className="pt-2">
      <div className="flex items-center justify-between gap-4 py-2">
        <Link href={exitHref} className="inline-flex min-h-11 items-center gap-2 pr-3 text-sm text-muted transition-colors hover:text-ink">
          <ArrowLeft size={16} aria-hidden /> {t("game.leave")}
        </Link>
        <p className="eyebrow hidden sm:block">{t(`mode.${mode}.name`)}</p>
        <p className="text-sm tabular-nums" aria-live="polite">
          <span className="text-muted">{t("game.score")} </span>
          {num(score)}
        </p>
      </div>
      {total > 1 ? (
        <div className="mb-6" role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={index + 1} aria-label={t("game.questionAria", { n: index + 1, total })}>
          <p className="eyebrow mb-2">{t("game.questionOf", { n: index + 1, total })}</p>
          <div className="flex gap-1" aria-hidden>
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
