"use client";

import { useCallback, useEffect, useState } from "react";
import { utcDateString } from "@/lib/game/daily";
import { computeStats, type Stats } from "@/lib/stats";
import { getDaily, listCollection, listDailyRecords, listSessions } from "./repo";
import type { CollectionEntry, DailyRecord } from "@/lib/types";

export interface AppData {
  today: string;
  stats: Stats;
  daily: DailyRecord;
  collection: CollectionEntry[];
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
        setData({ today, stats: computeStats(sessions, records, today), daily, collection });
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
