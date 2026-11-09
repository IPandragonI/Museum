"use client";

import { useSyncExternalStore } from "react";

export type ThemePref = "light" | "dark";

export interface Settings {
  theme: ThemePref;
  sound: boolean;
}

const KEY = "museum:settings";
const DEFAULTS: Settings = { theme: "light", sound: true };
const listeners = new Set<() => void>();
let cache: Settings | null = null;

function systemTheme(): ThemePref {
  try {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  } catch {
    return "light";
  }
}

function read(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    /* storage unavailable: fall through to defaults */
  }
  return { ...DEFAULTS, theme: systemTheme() };
}

export function getSettings(): Settings {
  if (!cache) cache = read();
  return cache;
}

export function applyTheme(theme: ThemePref, animate = false) {
  const root = document.documentElement;
  if (animate) {
    root.classList.add("theme-fade");
    window.setTimeout(() => root.classList.remove("theme-fade"), 420);
  }
  root.setAttribute("data-theme", theme);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", theme === "dark" ? "#121110" : "#f6f2ea");
}

export function updateSettings(patch: Partial<Settings>) {
  const prev = getSettings();
  cache = { ...prev, ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    /* ignore */
  }
  if (patch.theme && patch.theme !== prev.theme) applyTheme(patch.theme, true);
  listeners.forEach((l) => l());
}

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};
const SERVER: Settings = DEFAULTS;

export function useSettings(): Settings {
  return useSyncExternalStore(subscribe, getSettings, () => SERVER);
}

/** Inline script (runs before first paint) so there is no theme flash. */
export const THEME_INIT_SCRIPT = `(function(){try{var s=JSON.parse(localStorage.getItem("${KEY}")||"null");var t=s&&s.theme;if(!t){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.setAttribute("data-theme",t)}catch(e){document.documentElement.setAttribute("data-theme","light")}})();`;
