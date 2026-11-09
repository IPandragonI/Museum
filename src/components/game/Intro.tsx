"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { DifficultyPicker } from "@/components/home/DifficultyPicker";
import { DIFFICULTY_INFO, MODE_INFO } from "@/lib/game/config";
import type { Difficulty, GameMode } from "@/lib/types";

interface Props {
  mode: GameMode;
  difficulty: Difficulty;
  count: number;
  onStart: (d: Difficulty) => void;
}

/** "How it works" screen shown before a game (and the first time a mode is played). */
export function Intro({ mode, difficulty, count, onStart }: Props) {
  const info = MODE_INFO[mode];
  const [d, setD] = useState<Difficulty>(difficulty);
  return (
    <section className="mx-auto max-w-2xl pt-6" aria-label={`${info.name}: how to play`}>
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted hover:text-ink">
        <ArrowLeft size={16} aria-hidden /> Back
      </Link>
      <p className="eyebrow mt-8">How it works</p>
      <h1 className="display mt-2 text-5xl sm:text-6xl">{info.name}</h1>
      <p className="mt-4 text-lg text-muted">{info.short}</p>
      <ol className="mt-8 space-y-4 border-t border-line pt-6">
        {info.rules.map((r, i) => (
          <li key={i} className="flex gap-4">
            <span className="display text-2xl text-accent">{i + 1}</span>
            <span className="pt-1">{r}</span>
          </li>
        ))}
      </ol>
      <div className="mt-10 border-t border-line pt-6">
        <p className="eyebrow mb-3">
          Difficulty · {count} {info.unit}
        </p>
        <DifficultyPicker value={d} onChange={setD} label={`Difficulty for ${info.name}`} />
        <p className="mt-3 text-sm text-muted">
          {DIFFICULTY_INFO[d].name}: {DIFFICULTY_INFO[d].blurb}
        </p>
      </div>
      <button type="button" onClick={() => onStart(d)} className="btn btn-primary mt-8 w-full sm:w-auto" autoFocus>
        Start the game
      </button>
    </section>
  );
}
