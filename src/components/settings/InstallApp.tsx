"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/useI18n";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/** PWA installation: native prompt where the browser offers one, plain instructions elsewhere (e.g. iOS Safari). */
export function InstallApp() {
  const { t } = useI18n();
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setInstalled(window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true);
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
    /* eslint-enable react-hooks/set-state-in-effect */
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvent(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) return <p className="text-sm text-good">{t("set.install.done")}</p>;
  if (event)
    return (
      <button
        type="button"
        className="btn btn-ghost"
        onClick={async () => {
          await event.prompt();
          setEvent(null);
        }}
      >
        {t("set.install.button")}
      </button>
    );
  return <p className="max-w-xs text-sm text-muted">{ios ? t("set.install.ios") : t("set.install.other")}</p>;
}
