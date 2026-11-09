"use client";

import { Download, Pause, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { artworks } from "@/lib/data";
import { useI18n } from "@/lib/i18n/useI18n";
import { downloadPackage, offlineSupported, readStatus, readStorage, removePackage, requestPersistence, totalPackageBytes, type OfflineStatus, type StorageInfo } from "@/lib/offline";

type Phase = "idle" | "working" | "paused" | "interrupted" | "done" | "removed";

/** Understandable offline downloads: progress, sizes, which artworks are saved, pause/resume, removal. */
export function OfflineManager() {
  const { t, bytes, num } = useI18n();
  const [status, setStatus] = useState<OfflineStatus | null>(null);
  const [storage, setStorage] = useState<StorageInfo | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [done, setDone] = useState(0);
  const abort = useRef<AbortController | null>(null);

  const refresh = useCallback(async () => {
    if (!offlineSupported()) return;
    const s = await readStatus();
    setStatus(s);
    setDone(s.available.size);
    setStorage(await readStorage());
    if (s.available.size === artworks.length) setPhase((p) => (p === "removed" ? p : "done"));
  }, []);

  useEffect(() => {
    // Initial read of what is already saved on this device.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);

  if (!offlineSupported()) return <p className="text-sm text-muted">{t("off.unsupported")}</p>;

  const start = async () => {
    abort.current = new AbortController();
    setPhase("working");
    void requestPersistence();
    const res = await downloadPackage(setDone, abort.current.signal);
    setPhase(res.state === "done" ? "done" : res.state === "paused" ? "paused" : "interrupted");
    await refresh();
  };
  const pause = () => abort.current?.abort();
  const remove = async () => {
    await removePackage();
    setPhase("removed");
    await refresh();
  };

  const total = artworks.length;
  const pct = Math.round((done / total) * 100);
  const working = phase === "working";
  const complete = done === total;
  const unsaved = artworks.filter((a) => !status?.available.has(a.id));

  return (
    <div className="w-full space-y-4">
      <div role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done} aria-label={t("off.status", { n: done, total })}>
        <div className="h-1.5 w-full bg-line" aria-hidden>
          <div className="h-full bg-accent transition-[width] duration-300" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <p className="text-sm" role="status" aria-live="polite">
        {working ? t("off.progress", { done, total }) : t("off.status", { n: done, total })}
      </p>
      <p className="text-xs text-muted">
        {t("off.size", { size: bytes(totalPackageBytes()) })}
        {status ? ` · ${t("off.used", { used: bytes(status.packageBytes) })}` : ""}
        {storage ? ` ${t("off.quota", { quota: bytes(storage.quota) })}` : ""}
      </p>
      {storage?.persisted ? <p className="text-xs text-muted">{t("off.persist")}</p> : null}

      <div className="flex flex-wrap gap-3">
        {working ? (
          <button type="button" onClick={pause} className="btn btn-ghost">
            <Pause size={16} aria-hidden /> {t("off.cancel")}
          </button>
        ) : (
          <button type="button" onClick={start} disabled={complete} className="btn btn-ghost">
            <Download size={16} aria-hidden /> {done > 0 && !complete ? t("off.resume") : t("off.download")}
          </button>
        )}
        {done > 0 && !working ? (
          <button type="button" onClick={remove} className="btn btn-ghost">
            <Trash2 size={16} aria-hidden /> {t("off.remove")}
          </button>
        ) : null}
      </div>

      <p className="min-h-5 text-sm text-muted" role="status">
        {phase === "done" && complete ? t("off.done") : phase === "interrupted" || phase === "paused" ? t("off.interrupted", { done, total }) : phase === "removed" ? t("off.removed") : ""}
      </p>

      {status ? (
        <details className="text-sm">
          <summary className="inline-flex min-h-11 cursor-pointer items-center text-muted hover:text-ink">{t("off.list")}</summary>
          <div className="mt-2 grid gap-6 sm:grid-cols-2">
            <div>
              <p className="eyebrow mb-1">
                {t("off.listAvailable")} · {num(status.available.size)}
              </p>
              <ul className="max-h-48 overflow-y-auto text-xs text-muted">
                {artworks
                  .filter((a) => status.available.has(a.id))
                  .map((a) => (
                    <li key={a.id}>{a.title}</li>
                  ))}
              </ul>
            </div>
            <div>
              <p className="eyebrow mb-1">
                {t("off.listMissing")} · {num(unsaved.length)}
              </p>
              <ul className="max-h-48 overflow-y-auto text-xs text-muted">
                {unsaved.map((a) => (
                  <li key={a.id}>{a.title}</li>
                ))}
              </ul>
            </div>
          </div>
        </details>
      ) : null}
    </div>
  );
}
