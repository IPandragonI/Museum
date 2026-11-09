"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ArtImage } from "@/components/ui/ArtImage";
import { featuredArtwork } from "@/lib/data";
import { MODES, MODE_INFO } from "@/lib/game/config";
import type { Difficulty, GameMode } from "@/lib/types";
import { DifficultyPicker } from "./DifficultyPicker";

const ACCENT: Record<GameMode, string> = {
  guess: "01",
  detail: "02",
  artist: "03",
  timeline: "04",
};

function ModeCard({ mode }: { mode: GameMode }) {
  const info = MODE_INFO[mode];
  const art = featuredArtwork(mode);
  const [d, setD] = useState<Difficulty>("easy");
  const src = mode === "detail" && art?.detail ? art.detail.imageUrl : art?.imageUrl;

  return (
    <article className="group flex flex-col">
      <div className="relative aspect-[4/3] overflow-hidden bg-surface">
        {src ? (
          <ArtImage src={src} alt="" className={`size-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.035] ${mode === "guess" ? "" : ""}`} />
        ) : null}
        {mode === "guess" ? (
          // a taste of the mechanic: part of the grid stays covered
          <div className="pointer-events-none absolute inset-0 grid grid-cols-5 grid-rows-5" aria-hidden>
            {Array.from({ length: 25 }, (_, i) => (
              <span key={i} className={`bg-[var(--veil)] transition-opacity duration-700 ${[0, 3, 6, 9, 12, 14, 16, 20, 23].includes(i) ? "opacity-0" : "opacity-95 group-hover:opacity-80"}`} />
            ))}
          </div>
        ) : null}
        {mode === "timeline" ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex h-1.5" aria-hidden>
            {[0, 1, 2, 3, 4].map((i) => (
              <span key={i} className="flex-1 border-r border-bg/60 bg-ink/70" />
            ))}
          </div>
        ) : null}
        <span className="display absolute left-3 top-2 text-3xl text-white mix-blend-difference" aria-hidden>
          {ACCENT[mode]}
        </span>
      </div>
      <div className="flex flex-1 flex-col pt-5">
        <h3 className="display text-3xl">{info.name}</h3>
        <p className="mt-2 flex-1 text-[0.93rem] text-muted">{info.short}</p>
        <p className="eyebrow mt-4">
          {info.freeCount} {info.unit}
        </p>
        <div className="mt-3">
          <DifficultyPicker value={d} onChange={setD} label={`Difficulty for ${info.name}`} compact />
        </div>
        <div className="mt-4 flex items-center gap-4">
          <Link href={`/play/${mode}/?d=${d}&start=1`} className="btn btn-primary flex-1 sm:flex-none">
            Start <ArrowRight size={16} aria-hidden />
          </Link>
          <Link href={`/play/${mode}/?d=${d}`} className="link text-sm text-muted">
            How it works
          </Link>
        </div>
      </div>
    </article>
  );
}

export function FreePlay() {
  return (
    <section aria-labelledby="free-title" className="py-12 sm:py-16">
      <p className="eyebrow">Free play · unlimited</p>
      <h2 id="free-title" className="display mt-3 max-w-xl text-4xl sm:text-5xl">
        Choose a room
      </h2>
      <div className="mt-10 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
        {MODES.map((m) => (
          <ModeCard key={m} mode={m} />
        ))}
      </div>
    </section>
  );
}
