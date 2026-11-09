"use client";

import { ArrowRight, Check, Flame, Share2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { MODES, MODE_INFO } from "@/lib/game/config";
import { dailyProgress, isDailyComplete } from "@/lib/game/daily";
import { sumMax, sumPoints } from "@/lib/game/scoring";
import { useI18n } from "@/lib/i18n/useI18n";
import { buildShareText, dailyTotals, shareText } from "@/lib/share";
import { useAppData } from "@/lib/storage/useAppData";
import type { DailyRecord, GameMode } from "@/lib/types";

function statusOf(rec: DailyRecord, m: GameMode) {
  const p = rec.modes[m];
  return { status: p.status, points: sumPoints(p.answers), max: p.status === "completed" ? sumMax(p.answers) : 0, answered: p.answers.length };
}

export function DailyPanel({ variant = "home" }: { variant?: "home" | "page" }) {
  const i = useI18n();
  const { t, tn, num } = i;
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
    const outcome = await shareText(buildShareText(rec, url, i.lang), url, t("share.title"));
    setShareMsg(outcome === "copied" ? t("daily.copied") : outcome === "shared" ? t("daily.shared") : t("daily.shareFailed"));
  };

  return (
    <section aria-labelledby="daily-title" className="border-y border-line py-10 sm:py-14">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.35fr] lg:gap-16">
        <div>
          <p className="eyebrow">{t("daily.eyebrow")}</p>
          <h2 id="daily-title" className="display mt-3 text-4xl sm:text-5xl">
            {t("daily.title")}
          </h2>
          <p className="mt-3 text-muted" suppressHydrationWarning>
            {date ? i.dateLong(date) : " "}
          </p>
          <p className="mt-6 max-w-sm text-[0.95rem] text-muted">{t("daily.intro")}</p>

          <div className="mt-8" role="img" aria-label={t("daily.progress", { done, total })}>
            <div className="flex gap-1.5" aria-hidden>
              {MODES.map((m) => (
                <span key={m} className={`h-1 flex-1 transition-colors duration-500 ${rec?.modes[m].status === "completed" ? "bg-accent" : rec?.modes[m].status === "in_progress" ? "bg-accent/40" : "bg-line"}`} />
              ))}
            </div>
            <p className="mt-2 text-xs text-muted">{t("daily.progressShort", { done, total })}</p>
          </div>

          {complete && rec ? (
            <div className="mt-8 space-y-4">
              <p className="flex items-baseline gap-3">
                <span className="display text-6xl tabular-nums">{num(dailyTotals(rec).points)}</span>
                <span className="text-muted">{t("daily.pointsToday", { max: num(dailyTotals(rec).max) })}</span>
              </p>
              <button type="button" onClick={share} className="btn btn-primary">
                <Share2 size={16} aria-hidden /> {t("daily.share")}
              </button>
              <p className="text-sm text-muted" role="status">
                {shareMsg}
              </p>
            </div>
          ) : next ? (
            <Link href={`/play/${next}/?daily=1`} className="btn btn-primary mt-8">
              {started ? t("daily.resume") : t("daily.start")} <ArrowRight size={16} aria-hidden />
            </Link>
          ) : null}

          {data ? (
            <p className="mt-6 flex items-center gap-2 text-sm text-muted">
              <Flame size={15} className={data.stats.streak.current ? "text-accent" : ""} aria-hidden />
              {data.stats.streak.current ? tn("daily.streak", data.stats.streak.current) : t("daily.noStreak")}
              {data.stats.streak.best > 1 ? ` · ${t("daily.best", { n: data.stats.streak.best })}` : ""}
            </p>
          ) : null}
        </div>

        <ol className="divide-y divide-line self-start border-y border-line">
          {MODES.map((m, k) => {
            const s = rec ? statusOf(rec, m) : { status: "pending" as const, points: 0, max: 0, answered: 0 };
            const info = MODE_INFO[m];
            const label = s.status === "completed" ? t("daily.view", { points: s.points, max: s.max }) : s.status === "in_progress" ? t("daily.continue") : t("daily.play");
            return (
              <li key={m}>
                <Link href={`/play/${m}/?daily=1`} className="group flex min-h-20 items-center gap-4 py-5 transition-colors hover:bg-surface sm:gap-6 sm:px-3">
                  <span className="display w-8 text-3xl text-muted" aria-hidden>
                    {k + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-lg font-medium leading-tight">{t(`mode.${m}.name`)}</span>
                    <span className="block text-sm text-muted">
                      {info.dailyCount} {tn(info.unit, info.dailyCount)}
                      {s.status === "in_progress" && m !== "timeline" ? ` · ${t("daily.answered", { n: s.answered, total: info.dailyCount })}` : ""}
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
        <pre className="mt-10 overflow-x-auto border border-line bg-surface p-4 font-mono text-xs leading-relaxed" aria-label={t("daily.shareable")}>
          {buildShareText(rec, typeof location !== "undefined" ? location.origin : "", i.lang)}
        </pre>
      ) : null}
    </section>
  );
}
