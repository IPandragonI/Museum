"use client";

import { Check, X } from "lucide-react";
import type { Choice } from "@/lib/types";

interface Props {
  options: Choice[];
  /** Called with the chosen option id. */
  onSelect: (id: string) => void;
  /** After answering: what was picked and what was right. */
  result?: { selectedId: string; correctId: string } | null;
  disabled?: boolean;
  label: string;
}

/** Four-option answer list with accessible state feedback (icons + text, not colour alone). */
export function ChoiceList({ options, onSelect, result, disabled, label }: Props) {
  return (
    <ul className="grid gap-2.5" aria-label={label}>
      {options.map((o, i) => {
        const isCorrect = !!result && o.id === result.correctId;
        const isWrongPick = !!result && o.id === result.selectedId && !isCorrect;
        return (
          <li key={o.id}>
            <button
              type="button"
              disabled={disabled || !!result}
              onClick={() => onSelect(o.id)}
              aria-pressed={result ? o.id === result.selectedId : undefined}
              className={`group flex min-h-14 w-full items-center gap-4 rounded-[3px] border px-4 py-3 text-left text-[0.98rem] transition-colors duration-200 ${
                isCorrect
                  ? "border-good bg-good/10"
                  : isWrongPick
                    ? "shake border-bad bg-bad/10"
                    : result
                      ? "border-line text-muted"
                      : "border-line hover:border-ink hover:bg-surface"
              }`}
            >
              <span className={`grid size-6 shrink-0 place-items-center rounded-full border text-[0.7rem] tabular-nums ${isCorrect ? "border-good bg-good text-bg" : isWrongPick ? "border-bad bg-bad text-bg" : "border-line text-muted"}`} aria-hidden>
                {isCorrect ? <Check size={13} strokeWidth={3} /> : isWrongPick ? <X size={13} strokeWidth={3} /> : String.fromCharCode(65 + i)}
              </span>
              <span className="flex-1">{o.label}</span>
              {isCorrect ? <span className="sr-only">Correct answer</span> : null}
              {isWrongPick ? <span className="sr-only">Your answer, incorrect</span> : null}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
