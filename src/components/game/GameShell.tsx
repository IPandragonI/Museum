"use client";

import { ArrowLeft, Flame } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/useI18n";
import type { GameMode } from "@/lib/types";

export interface TimerProps {
  seconds: number;
  /** True while a question is waiting for an answer; the countdown freezes once it is answered. */
  active: boolean;
  onExpire: () => void;
}

interface Props {
  mode: GameMode;
  /** 0-based index of the current question. */
  index: number;
  total: number;
  /** Points scored so far. */
  score: number;
  /** Consecutive correct answers so far (shown from 2). Display only: points never depend on it. */
  streak?: number;
  /** Optional Free Play countdown (Settings). */
  timer?: TimerProps;
  exitHref: string;
  children: React.ReactNode;
}

/** One countdown per question (the parent re-mounts it with `key`). Expiry counts as a wrong answer. */
function Countdown({ seconds, active, onExpire }: TimerProps) {
  const { t } = useI18n();
  const [left, setLeft] = useState(seconds);
  const expire = useRef(onExpire);
  useEffect(() => {
    expire.current = onExpire;
  });
  useEffect(() => {
    if (!active) return;
    const end = Date.now() + seconds * 1000;
    const id = window.setInterval(() => {
      const l = Math.max(0, Math.ceil((end - Date.now()) / 1000));
      setLeft(l);
      if (l === 0) {
        window.clearInterval(id);
        expire.current();
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [active, seconds]);
  const low = left <= 5;
  return (
    <div className="mb-5 flex items-center gap-3" role="timer" aria-label={t("game.timer", { s: seconds })}>
      <div className="h-[3px] flex-1 bg-line" aria-hidden>
        <div className={`h-full transition-[width] duration-300 ease-linear ${low ? "bg-bad" : "bg-ink"}`} style={{ width: `${(left / seconds) * 100}%` }} />
      </div>
      <p className={`w-10 text-right text-sm tabular-nums ${low ? "font-medium text-bad" : "text-muted"}`}>{left} s</p>
    </div>
  );
}

/** Shared frame for every game screen: back link, question counter, progress, score, optional streak and countdown. */
export function GameShell({ mode, index, total, score, streak = 0, timer, exitHref, children }: Props) {
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
        <p className="flex items-center gap-3 text-sm tabular-nums" aria-live="polite">
          {streak >= 2 ? (
            <span className="inline-flex items-center gap-1 text-accent">
              <Flame size={14} aria-hidden /> <span className="sr-only">{t("game.streakSr", { n: streak })}</span>
              <span aria-hidden>{streak}</span>
            </span>
          ) : null}
          <span>
            <span className="text-muted">{t("game.score")} </span>
            {num(score)}
          </span>
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
      {timer ? <Countdown key={index} {...timer} /> : null}
      {children}
    </section>
  );
}
