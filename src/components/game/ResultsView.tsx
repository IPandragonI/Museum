"use client";

import { Check, GalleryVertical, Home, RotateCcw, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArtImage } from "@/components/ui/ArtImage";
import { getArtwork } from "@/lib/data";
import { percent, sumMax, sumPoints } from "@/lib/game/scoring";
import { useI18n } from "@/lib/i18n/useI18n";
import { playSound } from "@/lib/sound";
import type { Difficulty, GameMode, QuestionResult } from "@/lib/types";
import { ArtworkDialog } from "./ArtworkDialog";

interface Props {
  mode: GameMode;
  difficulty: Difficulty;
  results: QuestionResult[];
  /** Artworks newly added to the collection by this game. */
  newIds: Set<string>;
  /** Artworks already in the collection (to label "In your collection"). */
  collectionIds: Set<string>;
  daily?: boolean;
  onReplay?: () => void;
  /** Where "Back" goes (daily page for daily games). */
  backHref: string;
}

export function ResultsView({ mode, difficulty, results, newIds, collectionIds, daily, onReplay, backHref }: Props) {
  const i = useI18n();
  const { t, num } = i;
  const points = sumPoints(results);
  const max = sumMax(results);
  const pct = percent(points, max);
  const [open, setOpen] = useState<string | null>(null);
  const correctCount = results.filter((r) => r.correct).length;

  useEffect(() => {
    playSound("complete");
  }, []);

  const rows = useMemo(
    () => results.map((r, k) => ({ id: r.artworkIds[0], ok: r.correct, note: mode === "guess" && r.hint ? t("res.hintUsed") : t("res.question", { n: k + 1 }), points: r.points })),
    [mode, results, t],
  );

  const headline = pct === 100 ? t("res.headline.perfect") : pct >= 70 ? t("res.headline.great") : pct >= 40 ? t("res.headline.good") : t("res.headline.low");
  const kind = daily ? t("res.kind.daily") : t(`diff.${difficulty}.name`);

  return (
    <section aria-label={t("res.aria")} className="pt-6">
      <p className="eyebrow">{t("res.eyebrow", { mode: t(`mode.${mode}.name`), kind })}</p>
      <div className="mt-4 grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
        <div className="fade-up">
          <h1 className="display text-5xl sm:text-6xl">{headline}</h1>
          <p className="mt-8 flex items-baseline gap-3">
            <span className="display text-7xl tabular-nums sm:text-8xl">{num(points)}</span>
            <span className="text-xl text-muted tabular-nums">/ {num(max)}</span>
          </p>
          <dl className="mt-6 grid grid-cols-2 gap-6 border-t border-line pt-5">
            <div>
              <dt className="eyebrow">{t("res.correctAnswers")}</dt>
              <dd className="display mt-1 text-3xl">{`${correctCount} / ${results.length}`}</dd>
            </div>
            <div>
              <dt className="eyebrow">{t("res.success")}</dt>
              <dd className="display mt-1 text-3xl">{pct} %</dd>
            </div>
          </dl>
          <p className="mt-6 text-sm text-muted" role="status">
            {newIds.size ? i.tn("res.added", newIds.size) : t("res.none")}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {!daily && onReplay ? (
              <button type="button" onClick={onReplay} className="btn btn-primary">
                <RotateCcw size={16} aria-hidden /> {t("res.again")}
              </button>
            ) : null}
            {daily ? (
              <Link href={backHref} className="btn btn-primary">
                {t("res.backDaily")}
              </Link>
            ) : null}
            <Link href="/" className="btn btn-ghost">
              <Home size={16} aria-hidden /> {t("res.home")}
            </Link>
            {newIds.size ? (
              <Link href="/collection/" className="btn btn-ghost">
                <GalleryVertical size={16} aria-hidden /> {t("res.collection")}
              </Link>
            ) : null}
          </div>
        </div>

        <div>
          <h2 className="eyebrow mb-3">{t("res.byQuestion")}</h2>
          <ol className="divide-y divide-line border-y border-line">
            {rows.map((row, k) => {
              const a = getArtwork(row.id);
              if (!a) return null;
              const isNew = newIds.has(a.id);
              const owned = row.ok && collectionIds.has(a.id);
              return (
                <li key={a.id} className="fade-up" style={{ animationDelay: `${k * 70}ms` }}>
                  <button type="button" onClick={() => setOpen(a.id)} className="flex min-h-20 w-full items-center gap-4 py-3 text-left transition-colors hover:bg-surface">
                    <ArtImage artwork={a} alt="" sizes="96px" className="h-16 w-20 shrink-0 object-cover sm:h-20 sm:w-24" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{a.title}</span>
                      <span className="block truncate text-sm text-muted">
                        {i.artist(a)} · {i.artworkDate(a)}
                      </span>
                      <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                        {row.note}
                        {isNew ? <span className="chip !border-accent !text-accent">{t("res.new")}</span> : owned ? <span className="chip">{t("res.owned")}</span> : null}
                      </span>
                    </span>
                    <span className="flex flex-col items-end gap-1 pr-1">
                      <span className={`grid size-8 place-items-center rounded-full ${row.ok ? "bg-good text-bg" : "bg-bad text-bg"}`}>
                        {row.ok ? <Check size={15} strokeWidth={3} aria-label={t("res.srCorrect")} /> : <X size={15} strokeWidth={3} aria-label={t("res.srWrong")} />}
                      </span>
                      {row.points !== null ? <span className="text-xs tabular-nums text-muted">{t("res.pts", { n: row.points })}</span> : null}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
          <p className="mt-3 text-xs text-muted">{t("res.select")}</p>
        </div>
      </div>
      <ArtworkDialog artwork={open ? (getArtwork(open) ?? null) : null} onClose={() => setOpen(null)} />
    </section>
  );
}
