"use client";

import { ArrowRight, Check, Flame, Share2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { MODES, MODE_INFO } from "@/lib/game/config";
import { dailyProgress, formatDateLong, isDailyComplete } from "@/lib/game/daily";
import { sumMax, sumPoints } from "@/lib/game/scoring";
import { buildShareText, dailyTotals, shareText } from "@/lib/share";
import { useAppData } from "@/lib/storage/useAppData";
import type { DailyRecord, GameMode } from "@/lib/types";

function statusOf(rec: DailyRecord, m: GameMode) {
  const p = rec.modes[m];
  const points = sumPoints(p.answers);
  const max = p.status === "completed" ? sumMax(p.answers) : 0;
  return { status: p.status, points, max, answered: p.answers.length };
}

export function DailyPanel({ variant = "home" }: { variant?: "home" | "page" }) {
  const { data } = useAppData();
  const [shareMsg, setShareMsg] = useState("");

  const date = data?.today;
  const rec = data?.daily;
  const { done, total } = dailyProgress(rec);
  const complete = isDailyComplete(rec);
  const next = rec ? (MODES.find((m) => rec.modes[m].status !== "completed") ?? null) : MODES[0];
  const started = !!rec && MODES.some((m) => rec.modes[m].status !== "pending");

  const share = async () => {
    if (!rec) return;
    const url = typeof location !== "undefined" ? location.origin : "";
    const outcome = await shareText(buildShareText(rec, url), url);
    setShareMsg(outcome === "copied" ? "Result copied to clipboard." : outcome === "shared" ? "Shared." : "Couldn’t share — copy it manually below.");
  };

  return (
    <section aria-labelledby="daily-title" className="border-y border-line py-10 sm:py-14">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.35fr] lg:gap-16">
        <div>
          <p className="eyebrow">Daily challenge · Connoisseur level</p>
          <h2 id="daily-title" className="display mt-3 text-4xl sm:text-5xl">
            Today’s exhibition
          </h2>
          <p className="mt-3 text-muted" suppressHydrationWarning>
            {date ? formatDateLong(date) : " "}
          </p>
          <p className="mt-6 max-w-sm text-[0.95rem] text-muted">Thirteen artworks, the same for everyone in the world today. Finish all four games to keep your streak alive.</p>

          <div className="mt-8" aria-label={`${done} of ${total} games completed`}>
            <div className="flex gap-1.5">
              {MODES.map((m) => (
                <span key={m} className={`h-1 flex-1 transition-colors duration-500 ${rec?.modes[m].status === "completed" ? "bg-accent" : rec?.modes[m].status === "in_progress" ? "bg-accent/40" : "bg-line"}`} />
              ))}
            </div>
            <p className="mt-2 text-xs text-muted">
              {done} of {total} complete
            </p>
          </div>

          {complete && rec ? (
            <div className="mt-8 space-y-4">
              <p className="flex items-baseline gap-3">
                <span className="display text-6xl tabular-nums">{dailyTotals(rec).points}</span>
                <span className="text-muted">/ {dailyTotals(rec).max} points today</span>
              </p>
              <button type="button" onClick={share} className="btn btn-primary">
                <Share2 size={16} aria-hidden /> Share your result
              </button>
              <p className="text-sm text-muted" role="status">
                {shareMsg}
              </p>
            </div>
          ) : next ? (
            <Link href={`/play/${next}/?daily=1`} className="btn btn-primary mt-8">
              {started ? "Resume the challenge" : "Start the daily challenge"} <ArrowRight size={16} aria-hidden />
            </Link>
          ) : null}

          {data ? (
            <p className="mt-6 flex items-center gap-2 text-sm text-muted">
              <Flame size={15} className={data.stats.streak.current ? "text-accent" : ""} aria-hidden />
              {data.stats.streak.current ? `${data.stats.streak.current}-day streak` : "No streak yet"}
              {data.stats.streak.best > 1 ? ` · best ${data.stats.streak.best}` : ""}
            </p>
          ) : null}
        </div>

        <ol className="divide-y divide-line border-y border-line self-start">
          {MODES.map((m, i) => {
            const s = rec ? statusOf(rec, m) : { status: "pending" as const, points: 0, max: 0, answered: 0 };
            const info = MODE_INFO[m];
            const label = s.status === "completed" ? `View · ${s.points}/${s.max}` : s.status === "in_progress" ? "Resume" : "Play";
            return (
              <li key={m}>
                <Link href={`/play/${m}/?daily=1`} className="group flex items-center gap-4 py-5 transition-colors hover:bg-surface sm:gap-6 sm:px-3">
                  <span className="display w-8 text-3xl text-muted">{i + 1}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-lg font-medium leading-tight">{info.name}</span>
                    <span className="block text-sm text-muted">
                      {info.dailyCount} {info.unit}
                      {s.status === "in_progress" && m !== "timeline" ? ` · ${s.answered}/${info.dailyCount} answered` : ""}
                    </span>
                  </span>
                  <span className={`flex items-center gap-2 text-sm ${s.status === "completed" ? "text-good" : "text-muted group-hover:text-ink"}`}>
                    {s.status === "completed" ? <Check size={16} aria-hidden /> : null}
                    {label}
                    {s.status !== "completed" ? <ArrowRight size={14} aria-hidden /> : null}
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </div>
      {variant === "page" && complete && rec ? (
        <pre className="mt-10 overflow-x-auto border border-line bg-surface p-4 font-mono text-xs leading-relaxed" aria-label="Shareable result">
          {buildShareText(rec, typeof location !== "undefined" ? location.origin : "")}
        </pre>
      ) : null}
    </section>
  );
}
