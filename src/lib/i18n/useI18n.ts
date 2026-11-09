"use client";

import { useMemo } from "react";
import translations from "@/data/translations.fr.json";
import { useSettings } from "@/lib/settings";
import type { Artwork, Category } from "@/lib/types";
import { dateLabel, formatBytes, formatDateLong, formatNumber, mediumLabel, movementLabel, periodLabel, t, tn, type Lang, type MessageKey } from "./index";

interface FrArtwork {
  description?: string;
  didYouKnow?: string[];
  /** French biography for works whose creator bio comes from Wikipedia (keyed per artwork). */
  artistBio?: string;
}
interface FrData {
  artworks: Record<string, FrArtwork>;
  artists: Record<string, string>;
}
const FR = translations as unknown as FrData;

export interface LocalizedArtwork {
  description: string;
  didYouKnow: string[];
  artistBio: string | null;
  /** True when at least one displayed text is a French translation (so the UI can say so). */
  translated: boolean;
}

/** All language-dependent behaviour behind one hook, so components contain no `lang ===` conditionals. */
export function useI18n() {
  const { lang } = useSettings();
  return useMemo(() => {
    const L: Lang = lang;
    return {
      lang: L,
      t: (key: MessageKey, params?: Record<string, string | number>) => t(L, key, params),
      tn: (key: string, n: number, params?: Record<string, string | number>) => tn(L, key, n, params),
      num: (n: number) => formatNumber(L, n),
      bytes: (n: number) => formatBytes(L, n),
      dateLong: (iso: string) => formatDateLong(L, iso),
      category: (c: Category) => t(L, `cat.${c}` as MessageKey),
      movement: (m: string | null) => movementLabel(L, m),
      period: (p: string) => periodLabel(L, p),
      medium: (m: string | null) => mediumLabel(L, m),
      artworkDate: (a: Pick<Artwork, "dateDisplay" | "creationYear">) => dateLabel(L, a.dateDisplay || String(a.creationYear)),
      /** Artist line: real name, or "Anonymous artist" (names are never translated). */
      artist: (a: Pick<Artwork, "artist">) => a.artist ?? t(L, "artist.anonymous"),
      /** Museum text for the active language, falling back to the English original where no translation exists. */
      content: (a: Artwork): LocalizedArtwork => {
        if (L !== "fr") return { description: a.description, didYouKnow: a.interestingFacts, artistBio: a.artistBio, translated: false };
        const tr = FR.artworks[a.id];
        const bio = tr?.artistBio ?? (a.artist ? FR.artists[a.artist] : undefined);
        return {
          description: tr?.description ?? a.description,
          didYouKnow: tr?.didYouKnow && tr.didYouKnow.length === a.interestingFacts.length ? tr.didYouKnow : a.interestingFacts,
          artistBio: bio ?? a.artistBio,
          translated: !!(tr?.description || bio),
        };
      },
    };
  }, [lang]);
}

export type I18n = ReturnType<typeof useI18n>;
