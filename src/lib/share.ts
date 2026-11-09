import { MODES } from "@/lib/game/config";
import { t, type Lang } from "@/lib/i18n";
import { sumMax, sumPoints } from "@/lib/game/scoring";
import type { DailyRecord, QuestionResult } from "@/lib/types";

/** Squares for one mode: one per question. No titles, no answers. */
function squares(answers: QuestionResult[]): string {
  return answers.map((a) => (a.correct ? "■" : "□")).join("");
}

export function dailyTotals(rec: DailyRecord): { points: number; max: number } {
  const all = MODES.flatMap((m) => rec.modes[m].answers);
  return { points: sumPoints(all), max: sumMax(all) };
}

/** Share text in the player's language. It never contains titles or answers: only squares per game. */
export function buildShareText(rec: DailyRecord, url: string, lang: Lang): string {
  const { points, max } = dailyTotals(rec);
  const lines = MODES.map((m) => `${t(lang, `mode.${m}.name`).padEnd(22, " ")} ${squares(rec.modes[m].answers)}`);
  return [t(lang, "share.header", { date: rec.date }), t(lang, "share.complete", { points, max }), "", ...lines, "", url].join("\n");
}

export type ShareOutcome = "shared" | "copied" | "failed";

export async function shareText(text: string, url: string, title: string): Promise<ShareOutcome> {
  try {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      await navigator.share({ title, text: text.replace(url, "").trim(), url });
      return "shared";
    }
  } catch (e) {
    if ((e as DOMException)?.name === "AbortError") return "failed"; // user dismissed the sheet
  }
  try {
    await navigator.clipboard.writeText(text);
    return "copied";
  } catch {
    return "failed";
  }
}
