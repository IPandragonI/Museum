"use client";

import { DIFFICULTIES, DIFFICULTY_INFO } from "@/lib/game/config";
import type { Difficulty } from "@/lib/types";

interface Props {
  value: Difficulty;
  onChange: (d: Difficulty) => void;
  label: string;
  compact?: boolean;
}

/** Segmented control (radio group semantics) for the three difficulty levels. */
export function DifficultyPicker({ value, onChange, label, compact }: Props) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex w-full rounded-[3px] border border-line p-0.5 sm:w-auto">
      {DIFFICULTIES.map((d) => {
        const on = d === value;
        return (
          <button
            key={d}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(d)}
            className={`min-h-10 flex-1 rounded-[2px] px-3 text-sm transition-colors duration-200 sm:flex-none sm:px-4 ${on ? "bg-ink text-bg" : "text-muted hover:text-ink"}`}
          >
            {compact ? DIFFICULTY_INFO[d].short : DIFFICULTY_INFO[d].name}
          </button>
        );
      })}
    </div>
  );
}
