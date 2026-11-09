"use client";

import { Check, X } from "lucide-react";
import { useI18n } from "@/lib/i18n/useI18n";
import type { Choice } from "@/lib/types";

interface Props {
  options: Choice[];
  /** Accessible group label (also shown as the legend when `legend` is true). */
  label: string;
  /** After answering: what was picked and what was right. */
  result?: { selectedId: string; correctId: string } | null;
  disabled?: boolean;
  /**
   * "instant": a click answers immediately (Detail, Artist).
   * "select":  native radio group — choose, then press a separate validate button (Guess).
   */
  variant?: "instant" | "select";
  /** instant: called with the chosen id. */
  onSelect?: (id: string) => void;
  /** select: controlled value. */
  value?: string | null;
  onValueChange?: (id: string) => void;
  name?: string;
}

const base = "group flex min-h-14 w-full items-center gap-4 rounded-[3px] border px-4 py-3 text-left text-[0.98rem] transition-colors duration-200";

/** Four-option answer list. Correct/incorrect are conveyed by icon + hidden text + colour, never colour alone. */
export function ChoiceList({ options, label, result, disabled, variant = "instant", onSelect, value, onValueChange, name = "choice" }: Props) {
  const { t } = useI18n();

  const marker = (i: number, isCorrect: boolean, isWrongPick: boolean, selected: boolean) => (
    <span
      className={`grid size-7 shrink-0 place-items-center rounded-full border text-[0.72rem] tabular-nums ${isCorrect ? "border-good bg-good text-bg" : isWrongPick ? "border-bad bg-bad text-bg" : selected ? "border-ink bg-ink text-bg" : "border-strong text-muted"}`}
      aria-hidden
    >
      {isCorrect ? <Check size={14} strokeWidth={3} /> : isWrongPick ? <X size={14} strokeWidth={3} /> : String.fromCharCode(65 + i)}
    </span>
  );

  const stateClass = (isCorrect: boolean, isWrongPick: boolean, selected: boolean) =>
    isCorrect ? "border-good bg-good/10" : isWrongPick ? "shake border-bad bg-bad/10" : result ? "border-strong text-muted" : selected ? "border-ink bg-surface" : "border-strong hover:border-ink hover:bg-surface";

  if (variant === "select") {
    return (
      <fieldset className="grid gap-2.5" disabled={disabled || !!result}>
        <legend className="sr-only">{label}</legend>
        {options.map((o, i) => {
          const isCorrect = !!result && o.id === result.correctId;
          const isWrongPick = !!result && o.id === result.selectedId && !isCorrect;
          const selected = value === o.id;
          return (
            <label key={o.id} className={`${base} relative cursor-pointer has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--accent)] ${stateClass(isCorrect, isWrongPick, selected)} ${result ? "cursor-default" : ""}`}>
              <input type="radio" name={name} value={o.id} checked={selected} onChange={() => onValueChange?.(o.id)} className="sr-only" />
              {marker(i, isCorrect, isWrongPick, selected)}
              <span className="flex-1">{o.label}</span>
              {isCorrect ? <span className="sr-only">{t("game.srCorrect")}</span> : null}
              {isWrongPick ? <span className="sr-only">{t("game.srWrong")}</span> : null}
            </label>
          );
        })}
      </fieldset>
    );
  }

  return (
    <ul className="grid gap-2.5" aria-label={label}>
      {options.map((o, i) => {
        const isCorrect = !!result && o.id === result.correctId;
        const isWrongPick = !!result && o.id === result.selectedId && !isCorrect;
        return (
          <li key={o.id}>
            <button type="button" disabled={disabled || !!result} onClick={() => onSelect?.(o.id)} aria-pressed={result ? o.id === result.selectedId : undefined} className={`${base} ${stateClass(isCorrect, isWrongPick, false)}`}>
              {marker(i, isCorrect, isWrongPick, false)}
              <span className="flex-1">{o.label}</span>
              {isCorrect ? <span className="sr-only">{t("game.srCorrect")}</span> : null}
              {isWrongPick ? <span className="sr-only">{t("game.srWrong")}</span> : null}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
