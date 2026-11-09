"use client";

import { DIFFICULTIES } from "@/lib/game/config";
import { useI18n } from "@/lib/i18n/useI18n";
import type { Difficulty } from "@/lib/types";

interface Props {
  value: Difficulty;
  onChange: (d: Difficulty) => void;
  label: string;
  compact?: boolean;
}

/** Segmented control with radio-group semantics; arrow keys move the selection (roving tabindex). */
export function DifficultyPicker({ value, onChange, label, compact }: Props) {
  const { t } = useI18n();
  const onKey = (e: React.KeyboardEvent, index: number) => {
    const d = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const next = DIFFICULTIES[(index + d + DIFFICULTIES.length) % DIFFICULTIES.length];
    onChange(next);
    (e.currentTarget.parentElement?.querySelector(`[data-level="${next}"]`) as HTMLElement | null)?.focus();
  };
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex w-full rounded-[3px] border border-strong p-0.5 sm:w-auto">
      {DIFFICULTIES.map((d, index) => {
        const on = d === value;
        return (
          <button
            key={d}
            data-level={d}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={on ? 0 : -1}
            onKeyDown={(e) => onKey(e, index)}
            onClick={() => onChange(d)}
            className={`min-h-11 flex-1 rounded-[2px] px-3 text-sm transition-colors duration-200 sm:flex-none sm:px-4 ${on ? "bg-ink text-bg" : "text-muted hover:text-ink"}`}
          >
            {compact ? t(`diff.${d}.short`) : t(`diff.${d}.name`)}
          </button>
        );
      })}
    </div>
  );
}
