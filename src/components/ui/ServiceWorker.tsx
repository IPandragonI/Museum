"use client";

import { useEffect } from "react";
import { applyTheme, getSettings } from "@/lib/settings";

/** Registers the offline service worker (production only) and syncs the theme meta tag. */
export function ServiceWorker() {
  useEffect(() => {
    applyTheme(getSettings().theme);
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    const register = () => navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);
  return null;
}
