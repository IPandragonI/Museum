"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArtworkDialog } from "@/components/game/ArtworkDialog";
import { ArtImage } from "@/components/ui/ArtImage";
import { artworks, getArtwork } from "@/lib/data";
import { localeOf } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n/useI18n";
import { listCollection } from "@/lib/storage/repo";
import type { Artwork, CollectionEntry } from "@/lib/types";

const ALL = "all";

interface Option {
  value: string;
  label: string;
}

function Select({ label, value, onChange, options, allLabel }: { label: string; value: string; onChange: (v: string) => void; options: Option[]; allLabel: string }) {
  return (
    <label className="flex flex-col gap-1 text-xs text-muted">
      <span className="eyebrow">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="min-h-11 rounded-[3px] border border-strong bg-bg px-3 text-sm text-ink">
        <option value={ALL}>{allLabel}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function CollectionView() {
  const i = useI18n();
  const { t, tn, num } = i;
  const [entries, setEntries] = useState<CollectionEntry[] | null>(null);
  const [category, setCategory] = useState(ALL);
  const [artist, setArtist] = useState(ALL);
  const [movement, setMovement] = useState(ALL);
  const [period, setPeriod] = useState(ALL);
  const [open, setOpen] = useState<Artwork | null>(null);

  useEffect(() => {
    listCollection()
      .then(setEntries)
      .catch(() => setEntries([]));
  }, []);

  const owned = useMemo(
    () =>
      (entries ?? [])
        .map((e) => ({ entry: e, art: getArtwork(e.artworkId) }))
        .filter((x): x is { entry: CollectionEntry; art: Artwork } => !!x.art)
        .sort((a, b) => b.entry.discoveredAt.localeCompare(a.entry.discoveredAt)),
    [entries],
  );

  // Filter option values are stable keys (English data values); labels are localised and sorted by locale.
  const options = useMemo(() => {
    const collator = new Intl.Collator(localeOf(i.lang));
    const build = (pairs: [string, string][]): Option[] =>
      [...new Map(pairs).entries()].map(([value, label]) => ({ value, label })).sort((a, b) => collator.compare(a.label, b.label));
    return {
      category: build(owned.map((o) => [o.art.category, i.category(o.art.category)])),
      artist: build(owned.filter((o) => o.art.artist).map((o) => [o.art.artist!, o.art.artist!])),
      movement: build(owned.filter((o) => o.art.movement).map((o) => [o.art.movement!, i.movement(o.art.movement)!])),
      period: build(owned.map((o) => [o.art.period, i.period(o.art.period)])),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [owned, i.lang]);

  const shown = owned.filter(({ art }) => (category === ALL || art.category === category) && (artist === ALL || art.artist === artist) && (movement === ALL || art.movement === movement) && (period === ALL || art.period === period));
  const filtering = category !== ALL || artist !== ALL || movement !== ALL || period !== ALL;

  return (
    <div className="pt-8 sm:pt-14">
      <p className="eyebrow">{t("col.eyebrow")}</p>
      <h1 className="display mt-3 text-5xl sm:text-7xl">{t("col.title")}</h1>
      <p className="mt-4 max-w-xl text-muted">
        {t("col.intro")} {entries ? <span className="text-ink">{t("col.count", { n: num(owned.length), total: num(artworks.length) })}</span> : null}
      </p>

      {entries === null ? (
        <p className="py-24 text-center text-sm text-muted" role="status">
          {t("col.loading")}
        </p>
      ) : owned.length === 0 ? (
        <div className="mt-14 border-y border-line py-20 text-center">
          <p className="display text-3xl">{t("col.emptyTitle")}</p>
          <p className="mx-auto mt-3 max-w-md text-muted">{t("col.emptyBody")}</p>
          <Link href="/" className="btn btn-primary mt-8">
            {t("col.start")}
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-10 grid grid-cols-2 gap-4 border-y border-line py-5 md:grid-cols-4" role="group" aria-label={t("col.filter")}>
            <Select label={t("col.category")} value={category} onChange={setCategory} options={options.category} allLabel={t("col.all")} />
            <Select label={t("col.artist")} value={artist} onChange={setArtist} options={options.artist} allLabel={t("col.all")} />
            <Select label={t("col.movement")} value={movement} onChange={setMovement} options={options.movement} allLabel={t("col.all")} />
            <Select label={t("col.period")} value={period} onChange={setPeriod} options={options.period} allLabel={t("col.all")} />
          </div>
          <div className="mt-3 flex items-center justify-between text-sm text-muted" aria-live="polite">
            <span>{filtering ? tn("col.matches", shown.length) : tn("col.total", shown.length)}</span>
            {filtering ? (
              <button
                type="button"
                className="link min-h-11"
                onClick={() => {
                  setCategory(ALL);
                  setArtist(ALL);
                  setMovement(ALL);
                  setPeriod(ALL);
                }}
              >
                {t("col.clear")}
              </button>
            ) : null}
          </div>
          <ul className="mt-8 grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
            {shown.map(({ art }, k) => {
              const mv = i.movement(art.movement);
              return (
                <li key={art.id} className="fade-up" style={{ animationDelay: `${Math.min(k, 12) * 40}ms` }}>
                  <button type="button" onClick={() => setOpen(art)} className="group block w-full text-left">
                    <div className="flex aspect-[4/5] items-center justify-center overflow-hidden bg-surface p-3 sm:p-4">
                      <ArtImage artwork={art} alt={t("col.thumbAlt", { title: art.title, artist: i.artist(art) })} sizes="(min-width:1024px) 22vw, (min-width:768px) 30vw, 46vw" className="max-h-full max-w-full object-contain transition-transform duration-700 ease-out group-hover:scale-[1.03]" />
                    </div>
                    <p className="mt-3 line-clamp-2 font-medium leading-snug">{art.title}</p>
                    <p className="truncate text-sm text-muted">{i.artist(art)}</p>
                    <p className="truncate text-xs text-muted">
                      {i.artworkDate(art)}
                      {mv ? ` · ${mv}` : ""} · {i.category(art.category)}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
          {shown.length === 0 ? <p className="py-16 text-center text-muted">{t("col.nothing")}</p> : null}
        </>
      )}
      <ArtworkDialog artwork={open} onClose={() => setOpen(null)} />
    </div>
  );
}
