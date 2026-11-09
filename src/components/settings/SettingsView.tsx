"use client";

import { Maximize, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { TIMER_SECONDS } from "@/lib/game/config";
import { LANGS } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n/useI18n";
import { updateSettings, useSettings } from "@/lib/settings";
import { playSound } from "@/lib/sound";
import { clearAllData } from "@/lib/storage/db";
import { InstallApp } from "./InstallApp";
import { OfflineManager } from "./OfflineManager";

function Row({ title, hint, children, stacked }: { title: string; hint?: string; children: React.ReactNode; stacked?: boolean }) {
  return (
    <div className={`border-b border-line py-6 ${stacked ? "space-y-4" : "flex flex-wrap items-center justify-between gap-4"}`}>
      <div className="max-w-md">
        <h2 className="font-medium">{title}</h2>
        {hint ? <p className="mt-1 text-sm text-muted">{hint}</p> : null}
      </div>
      {children}
    </div>
  );
}

function Segmented<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { id: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-[3px] border border-strong p-0.5">
      {options.map((o) => (
        <button key={o.id} type="button" role="radio" aria-checked={value === o.id} tabIndex={value === o.id ? 0 : -1} onClick={() => onChange(o.id)} className={`min-h-11 rounded-[2px] px-5 text-sm ${value === o.id ? "bg-ink text-bg" : "text-muted hover:text-ink"}`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function SettingsView() {
  const { t } = useI18n();
  const { theme, sound, lang, timer } = useSettings();
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

  const confirmClear = async () => {
    await clearAllData();
    dialog.current?.close();
    setCleared(true);
  };

  return (
    <div className="max-w-3xl pt-8 sm:pt-14">
      <p className="eyebrow">{t("set.eyebrow")}</p>
      <h1 className="display mt-3 text-5xl sm:text-7xl">{t("set.title")}</h1>

      <div className="mt-10 border-t border-line">
        <Row title={t("set.language")} hint={t("set.language.hint")}>
          <Segmented label={t("set.language")} value={lang} options={LANGS} onChange={(l) => updateSettings({ lang: l })} />
        </Row>

        <Row title={t("set.theme")} hint={t("set.theme.hint")}>
          <Segmented
            label={t("set.theme")}
            value={theme}
            options={[
              { id: "light", label: t("theme.light") },
              { id: "dark", label: t("theme.dark") },
            ]}
            onChange={(v) => updateSettings({ theme: v })}
          />
        </Row>

        <Row title={t("set.sound")} hint={t("set.sound.hint")}>
          <button
            type="button"
            role="switch"
            aria-checked={sound}
            aria-label={t("set.sound")}
            onClick={() => {
              updateSettings({ sound: !sound });
              if (!sound) setTimeout(() => playSound("correct"), 30);
            }}
            className={`relative h-8 w-14 rounded-full border transition-colors ${sound ? "border-accent bg-accent" : "border-strong bg-surface"}`}
          >
            <span className={`absolute top-1 size-6 rounded-full shadow transition-all ${sound ? "left-[1.7rem] bg-bg" : "left-1 bg-muted"}`} />
          </button>
        </Row>

        <Row title={t("set.timer")} hint={t("set.timer.hint", { s: TIMER_SECONDS })}>
          <button
            type="button"
            role="switch"
            aria-checked={timer}
            aria-label={t("set.timer")}
            onClick={() => updateSettings({ timer: !timer })}
            className={`relative h-8 w-14 rounded-full border transition-colors ${timer ? "border-accent bg-accent" : "border-strong bg-surface"}`}
          >
            <span className={`absolute top-1 size-6 rounded-full shadow transition-all ${timer ? "left-[1.7rem] bg-bg" : "left-1 bg-muted"}`} />
          </button>
        </Row>

        <Row title={t("set.fullscreen")} hint={t("set.fullscreen.hint")}>
          <button type="button" onClick={toggleFullscreen} className="btn btn-ghost">
            <Maximize size={16} aria-hidden /> {t("set.fullscreen.button")}
          </button>
        </Row>

        <Row title={t("set.install")} hint={t("set.install.hint")}>
          <InstallApp />
        </Row>

        <Row title={t("off.title")} hint={t("off.hint")} stacked>
          <OfflineManager />
        </Row>

        <Row title={t("set.clear")} hint={t("set.clear.hint")}>
          <button type="button" onClick={() => dialog.current?.showModal()} className="btn border-bad text-bad hover:bg-bad/10">
            <Trash2 size={16} aria-hidden /> {t("set.clear.button")}
          </button>
        </Row>
      </div>
      <p className="mt-4 min-h-6 text-sm text-good" role="status">
        {cleared ? t("set.clear.done") : ""}
      </p>

      <dialog ref={dialog} aria-labelledby="clear-title" className="m-auto w-[min(440px,92vw)] rounded-[4px] border border-line bg-bg p-7 backdrop:bg-black/60">
        <h2 id="clear-title" className="display text-3xl">
          {t("set.clear.dialogTitle")}
        </h2>
        <p className="mt-3 text-sm text-muted">{t("set.clear.dialogBody")}</p>
        <div className="mt-7 flex flex-wrap justify-end gap-3">
          <button type="button" className="btn btn-ghost" onClick={() => dialog.current?.close()} autoFocus>
            {t("set.clear.keep")}
          </button>
          <button type="button" className="btn bg-bad text-bg" onClick={confirmClear}>
            {t("set.clear.delete")}
          </button>
        </div>
      </dialog>
    </div>
  );
}
