"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArtworkDialog } from "@/components/game/ArtworkDialog";
import { ArtImage } from "@/components/ui/ArtImage";
import { CATEGORY_LABEL, artistLine, artworks, formatYear, getArtwork } from "@/lib/data";
import { listCollection } from "@/lib/storage/repo";
import type { Artwork, CollectionEntry } from "@/lib/types";

const ALL = "all";

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <label className="flex flex-col gap-1 text-xs text-muted">
      <span className="eyebrow">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="min-h-11 rounded-[3px] border border-line bg-bg px-3 text-sm text-ink">
        <option value={ALL}>All</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

const unique = (xs: (string | null)[]) => [...new Set(xs.filter((x): x is string => !!x))].sort((a, b) => a.localeCompare(b));

export function CollectionView() {
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

  const options = useMemo(
    () => ({
      category: unique(owned.map((o) => CATEGORY_LABEL[o.art.category])),
      artist: unique(owned.map((o) => o.art.artist)),
      movement: unique(owned.map((o) => o.art.movement)),
      period: unique(owned.map((o) => o.art.period)),
    }),
    [owned],
  );

  const shown = owned.filter(
    ({ art }) =>
      (category === ALL || CATEGORY_LABEL[art.category] === category) && (artist === ALL || art.artist === artist) && (movement === ALL || art.movement === movement) && (period === ALL || art.period === period),
  );
  const filtering = category !== ALL || artist !== ALL || movement !== ALL || period !== ALL;

  return (
    <div className="pt-8 sm:pt-14">
      <p className="eyebrow">Your personal museum</p>
      <h1 className="display mt-3 text-5xl sm:text-7xl">Collection</h1>
      <p className="mt-4 max-w-xl text-muted">
        Every artwork you have correctly identified lives here.{" "}
        {entries ? (
          <span className="text-ink">
            {owned.length} of {artworks.length} discovered.
          </span>
        ) : null}
      </p>

      {entries === null ? (
        <p className="py-24 text-center text-sm text-muted" role="status">
          Opening the galleries…
        </p>
      ) : owned.length === 0 ? (
        <div className="mt-14 border-y border-line py-20 text-center">
          <p className="display text-3xl">The walls are bare — for now.</p>
          <p className="mx-auto mt-3 max-w-md text-muted">Answer a question correctly in any game and the artwork is hung here for good.</p>
          <Link href="/" className="btn btn-primary mt-8">
            Start playing
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-10 grid grid-cols-2 gap-4 border-y border-line py-5 md:grid-cols-4" role="group" aria-label="Filter the collection">
            <Select label="Category" value={category} onChange={setCategory} options={options.category} />
            <Select label="Artist" value={artist} onChange={setArtist} options={options.artist} />
            <Select label="Movement" value={movement} onChange={setMovement} options={options.movement} />
            <Select label="Period" value={period} onChange={setPeriod} options={options.period} />
          </div>
          <div className="mt-3 flex items-center justify-between text-sm text-muted" aria-live="polite">
            <span>
              {shown.length} {shown.length === 1 ? "artwork" : "artworks"}
              {filtering ? " match" : ""}
            </span>
            {filtering ? (
              <button
                type="button"
                className="link"
                onClick={() => {
                  setCategory(ALL);
                  setArtist(ALL);
                  setMovement(ALL);
                  setPeriod(ALL);
                }}
              >
                Clear filters
              </button>
            ) : null}
          </div>
          <ul className="mt-8 grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
            {shown.map(({ art }, i) => (
              <li key={art.id} className="fade-up" style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}>
                <button type="button" onClick={() => setOpen(art)} className="group block w-full text-left">
                  <div className="flex aspect-[4/5] items-center justify-center overflow-hidden bg-surface p-3 sm:p-4">
                    <ArtImage src={art.imageUrl} alt={`${art.title}${art.artist ? `, ${art.artist}` : ""}`} width={art.imageWidth} height={art.imageHeight} className="max-h-full max-w-full object-contain transition-transform duration-700 ease-out group-hover:scale-[1.03]" />
                  </div>
                  <p className="mt-3 line-clamp-2 font-medium leading-snug">{art.title}</p>
                  <p className="truncate text-sm text-muted">{artistLine(art)}</p>
                  <p className="truncate text-xs text-muted">
                    {formatYear(art)} · {art.movement} · {CATEGORY_LABEL[art.category]}
                  </p>
                </button>
              </li>
            ))}
          </ul>
          {shown.length === 0 ? <p className="py-16 text-center text-muted">Nothing matches these filters.</p> : null}
        </>
      )}
      <ArtworkDialog artwork={open} onClose={() => setOpen(null)} />
    </div>
  );
}
