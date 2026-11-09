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
  /** Options ruled out by the hint: still listed (so nothing moves) but greyed out and not selectable. */
  eliminated?: ReadonlySet<string>;
  /** Called with the chosen id: a tap answers immediately, in every mode. */
  onSelect?: (id: string) => void;
}

const base = "group flex min-h-14 w-full items-center gap-4 rounded-[3px] border px-4 py-3 text-left text-[0.98rem] transition-colors duration-200";

/** Four-option answer list. Correct/incorrect are conveyed by icon + hidden text + colour, never colour alone. */
export function ChoiceList({ options, label, result, disabled, eliminated, onSelect }: Props) {
  const { t } = useI18n();

  const marker = (i: number, isCorrect: boolean, isWrongPick: boolean) => (
    <span
      className={`grid size-7 shrink-0 place-items-center rounded-full border text-[0.72rem] tabular-nums ${isCorrect ? "border-good bg-good text-bg" : isWrongPick ? "border-bad bg-bad text-bg" : "border-strong text-muted"}`}
      aria-hidden
    >
      {isCorrect ? <Check size={14} strokeWidth={3} /> : isWrongPick ? <X size={14} strokeWidth={3} /> : String.fromCharCode(65 + i)}
    </span>
  );

  const stateClass = (isCorrect: boolean, isWrongPick: boolean) =>
    isCorrect ? "border-good bg-good/10" : isWrongPick ? "shake border-bad bg-bad/10" : result ? "border-strong text-muted" : "border-strong hover:border-ink hover:bg-surface";

  return (
    <ul className="grid gap-2.5" aria-label={label}>
      {options.map((o, i) => {
        const isCorrect = !!result && o.id === result.correctId;
        const isWrongPick = !!result && o.id === result.selectedId && !isCorrect;
        const ruledOut = !result && !!eliminated?.has(o.id);
        return (
          <li key={o.id}>
            <button
              type="button"
              disabled={disabled || !!result || ruledOut}
              onClick={() => onSelect?.(o.id)}
              aria-pressed={result ? o.id === result.selectedId : undefined}
              className={`${base} ${ruledOut ? "border-line text-muted line-through opacity-60" : stateClass(isCorrect, isWrongPick)}`}
            >
              {marker(i, isCorrect, isWrongPick)}
              <span className="flex-1">{o.label}</span>
              {ruledOut ? <span className="sr-only">{t("game.srRuledOut")}</span> : null}
              {isCorrect ? <span className="sr-only">{t("game.srCorrect")}</span> : null}
              {isWrongPick ? <span className="sr-only">{t("game.srWrong")}</span> : null}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
