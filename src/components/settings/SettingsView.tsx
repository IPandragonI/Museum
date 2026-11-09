"use client";

import { Download, Maximize, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { artworks } from "@/lib/data";
import { updateSettings, useSettings } from "@/lib/settings";
import { playSound } from "@/lib/sound";
import { clearAllData } from "@/lib/storage/db";

function Row({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line py-6">
      <div className="max-w-md">
        <h2 className="font-medium">{title}</h2>
        {hint ? <p className="mt-1 text-sm text-muted">{hint}</p> : null}
      </div>
      {children}
    </div>
  );
}

export function SettingsView() {
  const { theme, sound } = useSettings();
  const [offline, setOffline] = useState<{ state: "idle" | "working" | "done" | "error"; done: number }>({ state: "idle", done: 0 });
  const [cleared, setCleared] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      /* not allowed in this context */
    }
  };

  const downloadForOffline = async () => {
    if (!("caches" in window)) return setOffline({ state: "error", done: 0 });
    setOffline({ state: "working", done: 0 });
    try {
      const cache = await caches.open("museum-art-v1");
      const urls = artworks.flatMap((a) => [a.imageUrl, ...(a.detail ? [a.detail.imageUrl] : [])]);
      let done = 0;
      for (let i = 0; i < urls.length; i += 6) {
        await Promise.all(
          urls.slice(i, i + 6).map(async (u) => {
            if (!(await cache.match(u))) await cache.add(u);
            done++;
          }),
        );
        setOffline({ state: "working", done });
      }
      setOffline({ state: "done", done });
    } catch {
      setOffline({ state: "error", done: 0 });
    }
  };

  const confirmClear = async () => {
    await clearAllData();
    dialog.current?.close();
    setCleared(true);
  };

  return (
    <div className="max-w-3xl pt-8 sm:pt-14">
      <p className="eyebrow">Preferences</p>
      <h1 className="display mt-3 text-5xl sm:text-7xl">Settings</h1>

      <div className="mt-10 border-t border-line">
        <Row title="Theme" hint="Light gallery wall or dark viewing room.">
          <div role="radiogroup" aria-label="Theme" className="inline-flex rounded-[3px] border border-line p-0.5">
            {(["light", "dark"] as const).map((t) => (
              <button key={t} type="button" role="radio" aria-checked={theme === t} onClick={() => updateSettings({ theme: t })} className={`min-h-10 rounded-[2px] px-5 text-sm capitalize ${theme === t ? "bg-ink text-bg" : "text-muted hover:text-ink"}`}>
                {t}
              </button>
            ))}
          </div>
        </Row>

        <Row title="Sound effects" hint="Soft chimes for answers and reveals. Never plays on its own.">
          <button
            type="button"
            role="switch"
            aria-checked={sound}
            aria-label="Sound effects"
            onClick={() => {
              updateSettings({ sound: !sound });
              if (!sound) setTimeout(() => playSound("correct"), 30);
            }}
            className={`relative h-7 w-12 rounded-full border transition-colors ${sound ? "border-accent bg-accent" : "border-line bg-surface"}`}
          >
            <span className={`absolute top-0.5 size-5 rounded-full bg-bg shadow transition-all ${sound ? "left-[1.6rem]" : "left-0.5 bg-muted"}`} />
          </button>
        </Row>

        <Row title="Fullscreen" hint="Give the artwork the whole screen (where your browser supports it).">
            <button type="button" onClick={toggleFullscreen} className="btn btn-ghost">
              <Maximize size={16} aria-hidden /> Toggle fullscreen
            </button>
          </Row>

        <Row title="Language" hint="MUSEUM is currently available in English only.">
          <span className="chip">English</span>
        </Row>

        <Row title="Use offline" hint={`Save all ${artworks.length} artworks (about 50 MB) on this device so the game works without a connection. The app itself is cached automatically.`}>
          <div className="text-right">
            <button type="button" onClick={downloadForOffline} disabled={offline.state === "working"} className="btn btn-ghost">
              <Download size={16} aria-hidden /> {offline.state === "working" ? `Saving… ${offline.done}` : "Download artworks"}
            </button>
            <p className="mt-2 text-xs text-muted" role="status">
              {offline.state === "done" ? "All artworks are available offline." : offline.state === "error" ? "Couldn’t save for offline use in this browser." : ""}
            </p>
          </div>
        </Row>

        <Row title="Clear local game data" hint="Deletes your collection, statistics, game history and daily progress from this device. This cannot be undone.">
          <button type="button" onClick={() => dialog.current?.showModal()} className="btn border-bad text-bad hover:bg-bad/10">
            <Trash2 size={16} aria-hidden /> Clear data…
          </button>
        </Row>
      </div>
      <p className="mt-4 text-sm text-good" role="status">
        {cleared ? "All local game data was cleared." : ""}
      </p>

      <dialog ref={dialog} aria-labelledby="clear-title" className="m-auto w-[min(440px,92vw)] rounded-[4px] border border-line bg-bg p-7 backdrop:bg-black/60">
        <h2 id="clear-title" className="display text-3xl">
          Clear everything?
        </h2>
        <p className="mt-3 text-sm text-muted">Your collection, statistics, history and today’s progress will be permanently deleted from this device.</p>
        <div className="mt-7 flex justify-end gap-3">
          <button type="button" className="btn btn-ghost" onClick={() => dialog.current?.close()} autoFocus>
            Keep my data
          </button>
          <button type="button" className="btn bg-bad text-bg" onClick={confirmClear}>
            Delete everything
          </button>
        </div>
      </dialog>
    </div>
  );
}
