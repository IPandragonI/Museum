import { createDataset } from "@/lib/game/questions";
import type { Artwork, GameMode } from "@/lib/types";

/** French museum-text translations, keyed by artwork id / artist name (see `src/data/translations.fr.json`). */
export interface FrArtwork {
  description?: string;
  didYouKnow?: string[];
  /** French biography for works whose creator bio comes from Wikipedia (keyed per artwork). */
  artistBio?: string;
}
export interface FrData {
  artworks: Record<string, FrArtwork>;
  artists: Record<string, string>;
}

/**
 * The curated dataset. It is NOT bundled into the JavaScript of every page: the two JSON files are fetched once
 * (`/data/*.json`, pre-cached by the service worker so they also work offline) and installed with `setData`.
 * These are live bindings: components rendered below <DataGate/> can read them synchronously.
 */
export let artworks: Artwork[] = [];
export let dataset = createDataset([]);
export let frTranslations: FrData = { artworks: {}, artists: {} };

let loaded = false;
let pending: Promise<void> | null = null;

export function isDataLoaded(): boolean {
  return loaded;
}

/** Install the data (used by `loadData` in the browser and directly by the tests). */
export function setData(rawArtworks: unknown, rawTranslations: unknown): void {
  artworks = rawArtworks as Artwork[];
  dataset = createDataset(artworks);
  frTranslations = rawTranslations as FrData;
  loaded = true;
}

/** Fetch the dataset once; concurrent callers share one request, a failure can be retried. */
export function loadData(): Promise<void> {
  if (loaded) return Promise.resolve();
  pending ??= (async () => {
    try {
      const [a, tr] = await Promise.all([fetch("/data/artworks.json"), fetch("/data/translations.fr.json")]);
      if (!a.ok || !tr.ok) throw new Error(`data ${a.status}/${tr.status}`);
      setData(await a.json(), await tr.json());
    } finally {
      pending = null;
    }
  })();
  return pending;
}

export function getArtwork(id: string): Artwork | undefined {
  return dataset.byId.get(id);
}

export function mustArtwork(id: string): Artwork {
  const a = dataset.byId.get(id);
  if (!a) throw new Error("Unknown artwork " + id);
  return a;
}

/** A stable, representative artwork per game mode for illustration on the home page. */
export function featuredArtwork(mode: GameMode): Artwork | undefined {
  const pool = dataset.artworks.filter((a) => a.difficulty[mode] === "easy" && a.quiz[mode] && (mode !== "detail" || a.detail?.imageUrl) && (mode === "artist" || mode === "movement" ? true : a.category === "painting"));
  if (!pool.length) return dataset.artworks[0];
  const offset = { guess: 0, detail: 1, artist: 2, movement: 3 }[mode];
  // spread picks apart so the four modes show four different works
  return pool[(offset * Math.max(1, Math.floor(pool.length / 4)) + 1) % pool.length];
}

/** `srcSet`/`sizes` for a responsive artwork <img>; smallest variant first. */
export function artworkSrcSet(a: Artwork): string {
  return a.images.variants.map((v) => `${v.url} ${v.w}w`).join(", ");
}

/** The variant that is small enough for thumbnails (≈ 480px long edge). */
export function thumbUrl(a: Artwork): string {
  return a.images.variants[0].url;
}
