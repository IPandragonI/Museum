"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { DifficultyPicker } from "@/components/home/DifficultyPicker";
import { useI18n } from "@/lib/i18n/useI18n";
import { MODE_INFO } from "@/lib/game/config";
import type { Difficulty, GameMode } from "@/lib/types";

interface Props {
  mode: GameMode;
  difficulty: Difficulty;
  count: number;
  onStart: (d: Difficulty) => void;
}

/** "How it works" screen shown before a game (and the first time a mode is played). */
export function Intro({ mode, difficulty, count, onStart }: Props) {
  const { t, tn } = useI18n();
  const [d, setD] = useState<Difficulty>(difficulty);
  const name = t(`mode.${mode}.name`);
  return (
    <section className="mx-auto max-w-2xl pt-6" aria-label={t("intro.aria", { mode: name })}>
      <Link href="/" className="inline-flex min-h-11 items-center gap-2 pr-3 text-sm text-muted hover:text-ink">
        <ArrowLeft size={16} aria-hidden /> {t("intro.back")}
      </Link>
      <p className="eyebrow mt-8">{t("intro.eyebrow")}</p>
      <h1 className="display mt-2 text-5xl sm:text-6xl">{name}</h1>
      <p className="mt-4 text-lg text-muted">{t(`mode.${mode}.short`)}</p>
      <ol className="mt-8 space-y-4 border-t border-line pt-6">
        {([1, 2, 3] as const).map((n) => (
          <li key={n} className="flex gap-4">
            <span className="display text-2xl text-accent" aria-hidden>
              {n}
            </span>
            <span className="pt-1">{t(`mode.${mode}.rule${n}`)}</span>
          </li>
        ))}
      </ol>
      <div className="mt-10 border-t border-line pt-6">
        <p className="eyebrow mb-3">{t("diff.label", { count: `${count} ${tn(MODE_INFO[mode].unit, count)}` })}</p>
        <DifficultyPicker value={d} onChange={setD} label={t("diff.for", { mode: name })} />
        <p className="mt-3 text-sm text-muted">
          {t(`diff.${d}.name`)} : {t(`diff.${d}.blurb`)}
        </p>
      </div>
      <button type="button" onClick={() => onStart(d)} className="btn btn-primary mt-8 w-full sm:w-auto" autoFocus>
        {t("intro.start")}
      </button>
    </section>
  );
}
