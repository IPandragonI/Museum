"use client";

import { ArrowRight, Check, ChevronDown, ChevronUp, GripVertical, X } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { ArtImage } from "@/components/ui/ArtImage";
import { dataset, mustArtwork } from "@/lib/data";
import { correctTimelineOrder } from "@/lib/game/questions";
import { timelineCorrectPositions, timelinePoints } from "@/lib/game/scoring";
import { useI18n } from "@/lib/i18n/useI18n";
import { playSound } from "@/lib/sound";
import type { QuestionResult, TimelineQuestion } from "@/lib/types";
import { ArtworkDialog } from "./ArtworkDialog";
import { GameShell } from "./GameShell";

interface Props {
  question: TimelineQuestion;
  exitHref: string;
  onProgress?: (answers: QuestionResult[]) => void;
  onComplete: (answers: QuestionResult[]) => void;
}

interface DragState {
  id: string;
  from: number;
  to: number;
  dy: number;
  pitch: number;
}

function move<T>(list: T[], from: number, to: number): T[] {
  const copy = list.slice();
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

export function TimelineGame({ question, exitHref, onComplete }: Props) {
  const i = useI18n();
  const { t } = i;
  const [order, setOrder] = useState<string[]>(question.artworkIds);
  const [result, setResult] = useState<QuestionResult | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [live, setLive] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const startY = useRef(0);

  const n = order.length;

  const announce = useCallback((id: string, pos: number) => setLive(t("tl.moved", { title: mustArtwork(id).title, pos: pos + 1, n })), [n, t]);

  const shift = (index: number, delta: number) => {
    const to = index + delta;
    if (to < 0 || to >= n || result) return;
    const id = order[index];
    setOrder(move(order, index, to));
    announce(id, to);
    playSound("reveal");
  };

  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>, id: string, index: number) => {
    if (result || e.button > 0) return;
    const items = listRef.current?.children;
    const pitch = items && items.length > 1 ? items[1].getBoundingClientRect().top - items[0].getBoundingClientRect().top : 96;
    startY.current = e.clientY;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDrag({ id, from: index, to: index, dy: 0, pitch });
  };

  const onPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!drag) return;
    const dy = e.clientY - startY.current;
    const to = Math.min(n - 1, Math.max(0, Math.round(drag.from + dy / drag.pitch)));
    setDrag({ ...drag, dy, to });
  };

  const endDrag = () => {
    if (!drag) return;
    if (drag.to !== drag.from) {
      setOrder(move(order, drag.from, drag.to));
      announce(drag.id, drag.to);
      playSound("reveal");
    }
    setDrag(null);
  };

  const validate = () => {
    const correctOrder = correctTimelineOrder(dataset, order);
    const correctCount = timelineCorrectPositions(order, correctOrder);
    const res: QuestionResult = {
      artworkIds: correctOrder,
      correctArtworkIds: order.filter((id, k) => id === correctOrder[k]),
      correct: correctCount === n,
      points: timelinePoints(correctCount, n),
      maxPoints: 100,
      answer: order,
    };
    setResult(res);
    playSound(correctCount === n ? "correct" : correctCount > 0 ? "reveal" : "wrong");
  };

  const rowTransform = (id: string, k: number): React.CSSProperties => {
    if (!drag) return {};
    if (id === drag.id) return { transform: `translateY(${drag.dy}px) scale(1.01)`, zIndex: 20, transition: "none", boxShadow: "0 8px 24px rgba(0,0,0,0.18)" };
    if (drag.from < drag.to && k > drag.from && k <= drag.to) return { transform: `translateY(${-drag.pitch}px)` };
    if (drag.from > drag.to && k < drag.from && k >= drag.to) return { transform: `translateY(${drag.pitch}px)` };
    return {};
  };

  // ---------------------------------------------------------------- validated
  if (result) {
    const correctOrder = result.artworkIds;
    const correctCount = result.correctArtworkIds.length;
    const first = mustArtwork(correctOrder[0]);
    const last = mustArtwork(correctOrder[correctOrder.length - 1]);
    return (
      <GameShell mode="timeline" index={0} total={1} score={result.points} exitHref={exitHref}>
        <div className="mx-auto max-w-3xl">
          <div className="fade-up mb-6 flex flex-wrap items-center justify-between gap-4 border-y border-line py-4" role="status">
            <div className="flex items-center gap-3">
              <span className={`grid size-10 place-items-center rounded-full ${result.correct ? "bg-good text-bg" : correctCount ? "bg-accent text-accent-ink" : "bg-bad text-bg"}`} aria-hidden>
                {result.correct ? <Check size={20} strokeWidth={2.5} /> : <span className="text-sm font-semibold">{correctCount}</span>}
              </span>
              <div>
                <p className="font-medium">
                  {result.correct ? t("tl.perfect") : t("tl.partial", { c: correctCount, n })} · {t("tl.pointsPlus", { points: result.points })}
                </p>
                <p className="text-sm text-muted">{t("tl.span", { a: i.artworkDate(first), pa: i.period(first.period), b: i.artworkDate(last), pb: i.period(last.period) })}</p>
              </div>
            </div>
            <button type="button" onClick={() => onComplete([result])} className="btn btn-primary" autoFocus>
              {t("game.seeResults")} <ArrowRight size={16} aria-hidden />
            </button>
          </div>
          <p className="eyebrow mb-3">{t("tl.correctOrder")}</p>
          <ol className="space-y-2">
            {correctOrder.map((id, k) => {
              const a = mustArtwork(id);
              const ok = order[k] === id;
              const placed = order.indexOf(id) + 1;
              const movement = i.movement(a.movement);
              return (
                <li key={id} className="fade-up" style={{ animationDelay: `${k * 90}ms` }}>
                  <button type="button" onClick={() => setOpen(id)} className={`flex min-h-16 w-full items-center gap-4 rounded-[3px] border p-2 pr-4 text-left transition-colors hover:bg-surface ${ok ? "border-good" : "border-line"}`}>
                    <span className="w-6 text-center text-sm tabular-nums text-muted">{k + 1}</span>
                    <ArtImage artwork={a} alt="" sizes="80px" className="h-16 w-20 shrink-0 object-cover" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{a.title}</span>
                      <span className="block truncate text-sm text-muted">
                        {i.artist(a)}
                        {movement ? ` · ${movement}` : ""}
                      </span>
                    </span>
                    <span className="text-right">
                      <span className="display block text-xl">{i.artworkDate(a)}</span>
                      <span className={`flex items-center justify-end gap-1 text-xs ${ok ? "text-good" : "text-bad"}`}>
                        {ok ? <Check size={12} aria-hidden /> : <X size={12} aria-hidden />}
                        {ok ? t("tl.correctPlace") : t("tl.youPut", { n: placed })}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
          <p className="mt-4 text-sm text-muted">{t("tl.select")}</p>
        </div>
        <ArtworkDialog artwork={open ? mustArtwork(open) : null} onClose={() => setOpen(null)} />
      </GameShell>
    );
  }

  // ---------------------------------------------------------------- arranging
  return (
    <GameShell mode="timeline" index={0} total={1} score={0} exitHref={exitHref}>
      <div className="mx-auto max-w-3xl">
        <h1 className="eyebrow mb-1">{t("tl.arrange")}</h1>
        <p className="mb-5 text-sm text-muted">{t("tl.help")}</p>
        <p className="mb-2 text-xs text-muted">{t("tl.oldest")}</p>
        <ol ref={listRef} className="space-y-2" aria-label={t("tl.listLabel")}>
          {order.map((id, k) => {
            const a = mustArtwork(id);
            const dragging = drag?.id === id;
            return (
              <li key={id} style={rowTransform(id, k)} className={`relative flex items-center gap-1 rounded-[3px] border bg-bg p-2 transition-transform duration-200 ${dragging ? "border-ink" : "border-strong"}`}>
                <button
                  type="button"
                  aria-label={t("tl.move", { title: a.title, pos: k + 1, n })}
                  onPointerDown={(e) => onPointerDown(e, id, k)}
                  onPointerMove={onPointerMove}
                  onPointerUp={endDrag}
                  onPointerCancel={endDrag}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowUp") {
                      e.preventDefault();
                      shift(k, -1);
                    } else if (e.key === "ArrowDown") {
                      e.preventDefault();
                      shift(k, 1);
                    }
                  }}
                  className="grid h-16 w-11 shrink-0 cursor-grab touch-none place-items-center text-muted hover:text-ink active:cursor-grabbing"
                >
                  <GripVertical size={20} aria-hidden />
                </button>
                <ArtImage artwork={a} alt="" sizes="80px" className="h-16 w-20 shrink-0 object-cover" />
                <div className="min-w-0 flex-1 px-2">
                  <p className="truncate font-medium leading-snug">{a.title}</p>
                  <p className="truncate text-sm text-muted">
                    {i.artist(a)} · {i.category(a.category)}
                  </p>
                </div>
                <div className="flex flex-col">
                  <button type="button" onClick={() => shift(k, -1)} disabled={k === 0} className="grid size-11 place-items-center text-muted hover:text-ink disabled:opacity-25" aria-label={t("tl.up", { title: a.title })}>
                    <ChevronUp size={20} aria-hidden />
                  </button>
                  <button type="button" onClick={() => shift(k, 1)} disabled={k === n - 1} className="grid size-11 place-items-center text-muted hover:text-ink disabled:opacity-25" aria-label={t("tl.down", { title: a.title })}>
                    <ChevronDown size={20} aria-hidden />
                  </button>
                </div>
              </li>
            );
          })}
        </ol>
        <p className="mt-2 text-xs text-muted">{t("tl.newest")}</p>
        <p className="sr-only" aria-live="polite">
          {live}
        </p>
        <div className="mt-8 flex justify-end">
          <button type="button" onClick={validate} className="btn btn-primary">
            {t("tl.validate")} <ArrowRight size={16} aria-hidden />
          </button>
        </div>
      </div>
    </GameShell>
  );
}
