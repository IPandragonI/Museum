"use client";

import { Moon, Sun } from "lucide-react";
import { updateSettings, useSettings } from "@/lib/settings";

export function ThemeToggle() {
  const { theme } = useSettings();
  const next = theme === "dark" ? "light" : "dark";
  return (
    <button type="button" onClick={() => updateSettings({ theme: next })} className="grid size-11 place-items-center rounded-full text-muted transition-colors hover:text-ink" aria-label={`Switch to ${next} theme`}>
      {theme === "dark" ? <Sun size={19} strokeWidth={1.5} aria-hidden /> : <Moon size={19} strokeWidth={1.5} aria-hidden />}
    </button>
  );
}
