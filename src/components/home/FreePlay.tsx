"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ArtImage, PlainImage } from "@/components/ui/ArtImage";
import { featuredArtwork } from "@/lib/data";
import { MODES, MODE_INFO } from "@/lib/game/config";
import { useI18n } from "@/lib/i18n/useI18n";
import type { Difficulty, GameMode } from "@/lib/types";
import { DifficultyPicker } from "./DifficultyPicker";

const NUMBER: Record<GameMode, string> = { guess: "01", detail: "02", artist: "03", movement: "04" };

function ModeCard({ mode }: { mode: GameMode }) {
  const { t, tn } = useI18n();
  const info = MODE_INFO[mode];
  const art = featuredArtwork(mode);
  const [d, setD] = useState<Difficulty>("easy");
  const name = t(`mode.${mode}.name`);

  return (
    <article className="group flex flex-col">
      <div className="relative aspect-[4/3] overflow-hidden bg-surface">
        {art && mode === "detail" && art.detail?.imageUrl ? (
          <PlainImage src={art.detail.imageUrl} alt="" width={art.detail.width} height={art.detail.height} className="size-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.035]" />
        ) : art ? (
          <ArtImage artwork={art} alt="" sizes="(min-width:1024px) 22vw, (min-width:640px) 44vw, 94vw" className="size-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.035]" />
        ) : null}
        <span className="display absolute left-3 top-2 text-3xl text-white mix-blend-difference" aria-hidden>
          {NUMBER[mode]}
        </span>
      </div>
      <div className="flex flex-1 flex-col pt-5">
        <h3 className="display text-3xl">{name}</h3>
        <p className="mt-2 flex-1 text-[0.93rem] text-muted">{t(`mode.${mode}.short`)}</p>
        <p className="eyebrow mt-4">
          {info.freeCount} {tn(info.unit, info.freeCount)}
        </p>
        <div className="mt-3">
          <DifficultyPicker value={d} onChange={setD} label={t("diff.for", { mode: name })} compact />
        </div>
        <div className="mt-4 flex items-center gap-4">
          <Link href={`/play/${mode}/?d=${d}&start=1`} className="btn btn-primary flex-1 sm:flex-none">
            {t("free.start")} <ArrowRight size={16} aria-hidden />
          </Link>
          <Link href={`/play/${mode}/?d=${d}`} className="link inline-flex min-h-11 items-center text-sm text-muted">
            {t("free.how")}
          </Link>
        </div>
      </div>
    </article>
  );
}

/** All four games in a row (3 questions each). */
function MixCard() {
  const { t } = useI18n();
  const [d, setD] = useState<Difficulty>("easy");
  const name = t("mode.mix.name");
  return (
    <article className="mt-14 grid gap-6 border-t border-line pt-8 sm:grid-cols-[1fr_auto] sm:items-end">
      <div>
        <h3 className="display text-3xl">{name}</h3>
        <p className="mt-2 max-w-xl text-[0.93rem] text-muted">{t("mix.short")}</p>
        <p className="eyebrow mt-3">{t("mix.count")}</p>
        <div className="mt-3 max-w-md">
          <DifficultyPicker value={d} onChange={setD} label={t("diff.for", { mode: name })} compact />
        </div>
      </div>
      <Link href={`/play/mix/?d=${d}`} className="btn btn-primary w-full sm:w-auto">
        {t("free.start")} <ArrowRight size={16} aria-hidden />
      </Link>
    </article>
  );
}

export function FreePlay() {
  const { t } = useI18n();
  return (
    <section aria-labelledby="free-title" className="py-12 sm:py-16">
      <p className="eyebrow">{t("free.eyebrow")}</p>
      <h2 id="free-title" className="display mt-3 max-w-xl text-4xl sm:text-5xl">
        {t("free.title")}
      </h2>
      <div className="mt-10 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
        {MODES.map((m) => (
          <ModeCard key={m} mode={m} />
        ))}
      </div>
      <MixCard />
    </section>
  );
}
