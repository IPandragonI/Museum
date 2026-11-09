"use client";

import { artworks } from "@/lib/data";
import type { Artwork } from "@/lib/types";

/** Cache that holds downloaded artwork images (shared with the service worker, which serves from it). */
export const ART_CACHE = "museum-art-v2";

/**
 * The offline package per artwork: the 480px thumbnail, the 960px gameplay image and (if the artwork has an
 * approved crop) the detail image. Larger 1280px files are only fetched online on big, sharp screens; offline the
 * service worker serves the nearest cached size instead.
 */
export function packageUrls(a: Artwork): { url: string; bytes: number }[] {
  const v = a.images.variants;
  const list = [v[0], v[Math.min(1, v.length - 1)]].map((x) => ({ url: x.url, bytes: x.bytes }));
  if (a.detail?.imageUrl) list.push({ url: a.detail.imageUrl, bytes: a.detail.bytes ?? 0 });
  return list;
}

export const totalPackageBytes = (): number => artworks.reduce((s, a) => s + packageUrls(a).reduce((t, f) => t + f.bytes, 0), 0);

export const offlineSupported = (): boolean => typeof window !== "undefined" && "caches" in window;

export interface OfflineStatus {
  /** Artwork ids whose whole package is cached. */
  available: Set<string>;
  /** Bytes of the downloaded package files (from the known file sizes — exact, unlike a browser estimate). */
  packageBytes: number;
}

export async function readStatus(): Promise<OfflineStatus> {
  const available = new Set<string>();
  let packageBytes = 0;
  if (!offlineSupported()) return { available, packageBytes };
  const cache = await caches.open(ART_CACHE);
  const keys = new Set((await cache.keys()).map((r) => new URL(r.url).pathname));
  for (const a of artworks) {
    const files = packageUrls(a);
    const have = files.filter((f) => keys.has(f.url));
    packageBytes += have.reduce((s, f) => s + f.bytes, 0);
    if (have.length === files.length) available.add(a.id);
  }
  return { available, packageBytes };
}

export interface DownloadResult {
  state: "done" | "paused" | "interrupted";
  done: number;
}

/**
 * Downloads every missing file of the package. Files already in the cache are skipped (nothing is fetched twice),
 * so an interrupted or paused download simply resumes where it stopped. Concurrency is small to stay gentle.
 */
export async function downloadPackage(onProgress: (doneArtworks: number) => void, signal: AbortSignal): Promise<DownloadResult> {
  const cache = await caches.open(ART_CACHE);
  const have = new Set((await cache.keys()).map((r) => new URL(r.url).pathname));
  let done = artworks.filter((a) => packageUrls(a).every((f) => have.has(f.url))).length;
  onProgress(done);
  const todo = artworks.filter((a) => !packageUrls(a).every((f) => have.has(f.url)));
  let index = 0;
  let failed = false;

  async function worker() {
    while (index < todo.length && !signal.aborted && !failed) {
      const a = todo[index++];
      try {
        for (const f of packageUrls(a)) {
          if (have.has(f.url)) continue;
          const res = await fetch(f.url, { signal });
          if (!res.ok) throw new Error(String(res.status));
          await cache.put(f.url, res);
          have.add(f.url);
        }
        done++;
        onProgress(done);
      } catch {
        if (!signal.aborted) failed = true; // network lost, quota hit…: stop cleanly, the rest can resume later
        return;
      }
    }
  }
  await Promise.all([worker(), worker(), worker(), worker()]);
  if (signal.aborted) return { state: "paused", done };
  return { state: failed ? "interrupted" : "done", done };
}

export async function removePackage(): Promise<void> {
  if (offlineSupported()) await caches.delete(ART_CACHE);
}

export interface StorageInfo {
  usage: number;
  quota: number;
  persisted: boolean;
}

export async function readStorage(): Promise<StorageInfo | null> {
  try {
    const est = await navigator.storage?.estimate?.();
    if (!est || est.usage === undefined || est.quota === undefined) return null;
    return { usage: est.usage, quota: est.quota, persisted: (await navigator.storage.persisted?.()) ?? false };
  } catch {
    return null;
  }
}

/** Ask the browser to keep the downloaded artworks (protects them from automatic eviction). */
export async function requestPersistence(): Promise<boolean> {
  try {
    return (await navigator.storage?.persist?.()) ?? false;
  } catch {
    return false;
  }
}
