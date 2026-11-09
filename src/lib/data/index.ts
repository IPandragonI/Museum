import raw from "@/data/artworks.json";
import { createDataset } from "@/lib/game/questions";
import type { Artwork, GameMode } from "@/lib/types";

/** The curated dataset, bundled with the app (no runtime API calls). */
export const artworks = raw as unknown as Artwork[];
export const dataset = createDataset(artworks);

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
  const pool = dataset.artworks.filter((a) => a.difficulty[mode] === "easy" && a.quiz[mode] && (mode !== "detail" || a.detail?.imageUrl) && (mode === "artist" || mode === "timeline" ? true : a.category === "painting"));
  if (!pool.length) return dataset.artworks[0];
  const offset = { guess: 0, detail: 1, artist: 2, timeline: 3 }[mode];
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
