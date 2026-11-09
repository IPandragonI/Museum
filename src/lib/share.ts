import { MODES, MODE_INFO } from "@/lib/game/config";
import { sumMax, sumPoints } from "@/lib/game/scoring";
import type { DailyRecord, GameMode, QuestionResult } from "@/lib/types";

/** Squares for one mode: one per question (or per artwork in the timeline). No titles, no answers. */
function squares(mode: GameMode, answers: QuestionResult[]): string {
  if (mode === "timeline") {
    const r = answers[0];
    if (!r) return "";
    const total = r.artworkIds.length;
    return "■".repeat(r.correctArtworkIds.length) + "□".repeat(total - r.correctArtworkIds.length);
  }
  return answers.map((a) => (a.correct ? "■" : "□")).join("");
}

export function dailyTotals(rec: DailyRecord): { points: number; max: number } {
  const all = MODES.flatMap((m) => rec.modes[m].answers);
  return { points: sumPoints(all), max: sumMax(all) };
}

export function buildShareText(rec: DailyRecord, url: string): string {
  const { points, max } = dailyTotals(rec);
  const lines = MODES.map((m) => `${MODE_INFO[m].name.padEnd(19, " ")} ${squares(m, rec.modes[m].answers)}`);
  return [`MUSEUM · ${rec.date}`, `Daily challenge complete · ${points}/${max}`, "", ...lines, "", url].join("\n");
}

export type ShareOutcome = "shared" | "copied" | "failed";

export async function shareText(text: string, url: string): Promise<ShareOutcome> {
  try {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      await navigator.share({ title: "MUSEUM — Daily challenge", text: text.replace(url, "").trim(), url });
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
