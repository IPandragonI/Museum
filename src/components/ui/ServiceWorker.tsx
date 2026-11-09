"use client";

import { RefreshCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/useI18n";
import { applyTheme, getSettings, useSettings } from "@/lib/settings";

/**
 * Registers the offline service worker (production only), syncs the theme meta tag and <html lang>, and offers
 * "new version available": a freshly installed worker waits until the player chooses to reload, so a game in
 * progress is never swapped under their feet. Progress lives in IndexedDB and survives the reload.
 */
export function ServiceWorker() {
  const { lang } = useSettings();
  const { t } = useI18n();
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const reloading = useRef(false);

  // Keep <html lang> in step with the selected language (screen readers pick the right voice).
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    applyTheme(getSettings().theme);
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    const sw = navigator.serviceWorker;

    const watch = (reg: ServiceWorkerRegistration) => {
      // only an *update* needs a prompt: on the very first install there is no controller yet
      if (reg.waiting && sw.controller) setWaiting(reg.waiting);
      reg.addEventListener("updatefound", () => {
        const next = reg.installing;
        next?.addEventListener("statechange", () => {
          if (next.state === "installed" && sw.controller) setWaiting(next);
        });
      });
      // look for a new deploy whenever the app comes back to the foreground
      const check = () => {
        if (document.visibilityState === "visible") reg.update().catch(() => undefined);
      };
      document.addEventListener("visibilitychange", check);
    };

    const register = () => sw.register("/sw.js").then(watch, () => undefined);
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });

    const onChange = () => {
      if (reloading.current) location.reload();
    };
    sw.addEventListener("controllerchange", onChange);
    return () => sw.removeEventListener("controllerchange", onChange);
  }, []);

  const update = () => {
    reloading.current = true;
    waiting?.postMessage({ type: "SKIP_WAITING" });
  };

  if (!waiting || dismissed) return null;
  return (
    <div role="status" className="fixed inset-x-3 bottom-20 z-50 mx-auto max-w-md border border-strong bg-bg p-4 shadow-lg md:bottom-6 md:left-auto md:right-6">
      <p className="font-medium">{t("update.title")}</p>
      <p className="mt-1 text-sm text-muted">{t("update.text")}</p>
      <div className="mt-3 flex flex-wrap gap-3">
        <button type="button" onClick={update} className="btn btn-primary">
          <RefreshCw size={16} aria-hidden /> {t("update.reload")}
        </button>
        <button type="button" onClick={() => setDismissed(true)} className="btn btn-ghost">
          {t("update.later")}
        </button>
      </div>
    </div>
  );
}
