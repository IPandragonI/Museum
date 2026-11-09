"use client";

import { useCallback, useEffect, useState } from "react";
import { utcDateString } from "@/lib/game/daily";
import { getArtwork } from "@/lib/data";
import { MODES } from "@/lib/game/config";
import { computeMastery, computeStats, missedArtworks, type MasteryRow, type Stats } from "@/lib/stats";
import { getDaily, listCollection, listDailyRecords, listSessions } from "./repo";
import type { CollectionEntry, DailyRecord, GameMode } from "@/lib/types";

export interface AppData {
  today: string;
  stats: Stats;
  daily: DailyRecord;
  collection: CollectionEntry[];
  /** Per-movement and per-artist success rates, weakest first. */
  mastery: { movements: MasteryRow[]; artists: MasteryRow[] };
  /** Artworks still wrong at the last attempt, per mode (the "review" pool). */
  missed: Record<GameMode, string[]>;
}

/** Loads everything the home / daily / stats screens need from IndexedDB. */
export function useAppData(): { data: AppData | null; error: boolean; reload: () => void } {
  const [data, setData] = useState<AppData | null>(null);
  const [error, setError] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const today = utcDateString();
        const [sessions, records, daily, collection] = await Promise.all([listSessions(), listDailyRecords(), getDaily(today), listCollection()]);
        if (cancelled) return;
        const missed = Object.fromEntries(MODES.map((m) => [m, missedArtworks(sessions, m).filter((id) => !!getArtwork(id))])) as Record<GameMode, string[]>;
        setData({ today, stats: computeStats(sessions, records, today), daily, collection, mastery: computeMastery(sessions, (id) => getArtwork(id)), missed });
      } catch {
        if (!cancelled) setError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { data, error, reload };
}
