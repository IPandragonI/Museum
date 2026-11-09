"use client";

import { Check, GalleryVertical, Home, RotateCcw, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArtImage } from "@/components/ui/ArtImage";
import { artistLine, getArtwork } from "@/lib/data";
import { DIFFICULTY_INFO, MODE_INFO } from "@/lib/game/config";
import { percent, sumMax, sumPoints } from "@/lib/game/scoring";
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
  const points = sumPoints(results);
  const max = sumMax(results);
  const pct = percent(points, max);
  const info = MODE_INFO[mode];
  const [open, setOpen] = useState<string | null>(null);
  const correctCount = results.filter((r) => r.correct).length;

  useEffect(() => {
    playSound("complete");
  }, []);

  const rows = useMemo(
    () =>
      mode === "timeline"
        ? results[0].artworkIds.map((id, i) => ({ id, ok: results[0].correctArtworkIds.includes(id), note: `Position ${i + 1}`, points: null as number | null }))
        : results.map((r, i) => ({ id: r.artworkIds[0], ok: r.correct, note: mode === "guess" && r.stage ? `Revealed at stage ${r.stage}` : `Question ${i + 1}`, points: r.points })),
    [mode, results],
  );

  const headline = pct === 100 ? "A flawless visit." : pct >= 70 ? "A fine eye." : pct >= 40 ? "A good start." : "Plenty left to discover.";

  return (
    <section aria-label="Results" className="pt-6">
      <p className="eyebrow">
        {info.name} · {daily ? "Daily challenge" : DIFFICULTY_INFO[difficulty].name}
      </p>
      <div className="mt-4 grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
        <div className="fade-up">
          <h1 className="display text-5xl sm:text-6xl">{headline}</h1>
          <p className="mt-8 flex items-baseline gap-3">
            <span className="display text-7xl tabular-nums sm:text-8xl">{points}</span>
            <span className="text-xl text-muted tabular-nums">/ {max}</span>
          </p>
          <dl className="mt-6 grid grid-cols-2 gap-6 border-t border-line pt-5">
            <div>
              <dt className="eyebrow">{mode === "timeline" ? "In the right place" : "Correct answers"}</dt>
              <dd className="display mt-1 text-3xl">{mode === "timeline" ? `${results[0].correctArtworkIds.length} / ${results[0].artworkIds.length}` : `${correctCount} / ${results.length}`}</dd>
            </div>
            <div>
              <dt className="eyebrow">Success</dt>
              <dd className="display mt-1 text-3xl">{pct}%</dd>
            </div>
          </dl>
          <p className="mt-6 text-sm text-muted">{newIds.size ? `${newIds.size} artwork${newIds.size > 1 ? "s" : ""} added to your collection.` : "No new artworks this time — every one you’ve identified stays in your collection."}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            {!daily && onReplay ? (
              <button type="button" onClick={onReplay} className="btn btn-primary">
                <RotateCcw size={16} aria-hidden /> Play again
              </button>
            ) : null}
            {daily ? (
              <Link href={backHref} className="btn btn-primary">
                Back to the daily challenge
              </Link>
            ) : null}
            <Link href="/" className="btn btn-ghost">
              <Home size={16} aria-hidden /> Home
            </Link>
            {newIds.size ? (
              <Link href="/collection/" className="btn btn-ghost">
                <GalleryVertical size={16} aria-hidden /> Collection
              </Link>
            ) : null}
          </div>
        </div>

        <div>
          <h2 className="eyebrow mb-3">{mode === "timeline" ? "Chronological order" : "Question by question"}</h2>
          <ol className="divide-y divide-line border-y border-line">
            {rows.map((row, i) => {
              const a = getArtwork(row.id);
              if (!a) return null;
              const isNew = newIds.has(a.id);
              const owned = row.ok && collectionIds.has(a.id);
              return (
                <li key={a.id} className="fade-up" style={{ animationDelay: `${i * 70}ms` }}>
                  <button type="button" onClick={() => setOpen(a.id)} className="flex w-full items-center gap-4 py-3 text-left transition-colors hover:bg-surface">
                    <ArtImage src={a.imageUrl} alt="" className="h-16 w-20 shrink-0 object-cover sm:h-20 sm:w-24" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{a.title}</span>
                      <span className="block truncate text-sm text-muted">
                        {artistLine(a)} · {a.dateDisplay}
                      </span>
                      <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                        {row.note}
                        {isNew ? <span className="chip !border-accent !text-accent">New in your collection</span> : owned ? <span className="chip">In your collection</span> : null}
                      </span>
                    </span>
                    <span className="flex flex-col items-end gap-1 pr-1">
                      <span className={`grid size-7 place-items-center rounded-full ${row.ok ? "bg-good text-bg" : "bg-bad text-bg"}`}>
                        {row.ok ? <Check size={14} strokeWidth={3} aria-label="Correct" /> : <X size={14} strokeWidth={3} aria-label="Incorrect" />}
                      </span>
                      {row.points !== null ? <span className="text-xs tabular-nums text-muted">{row.points} pts</span> : null}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
          <p className="mt-3 text-xs text-muted">Select a row to read about the artwork.</p>
        </div>
      </div>
      <ArtworkDialog artwork={open ? (getArtwork(open) ?? null) : null} onClose={() => setOpen(null)} />
    </section>
  );
}
