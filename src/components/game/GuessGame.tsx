"use client";

import { Lightbulb, Search } from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { ArtImage, preloadArtwork } from "@/components/ui/ArtImage";
import { dataset, getArtwork, mustArtwork } from "@/lib/data";
import { HINT_COST, TIMER_SECONDS } from "@/lib/game/config";
import { hasUsableTitle, hintEliminated, norm } from "@/lib/game/questions";
import { guessPoints } from "@/lib/game/scoring";
import { useI18n } from "@/lib/i18n/useI18n";
import { playSound } from "@/lib/sound";
import type { Artwork, ChoiceQuestion, QuestionResult } from "@/lib/types";
import { AnswerFeedback } from "./AnswerFeedback";
import { ChoiceList } from "./ChoiceList";
import { GameShell } from "./GameShell";
import { InfoPanel } from "./InfoPanel";
import { useGameFlow } from "./useGameFlow";

interface Props {
  questions: ChoiceQuestion[];
  initialAnswers: QuestionResult[];
  /** The hint had already been opened on the current question (restored from a saved daily game). */
  initialHint?: boolean;
  exitHref: string;
  /** Persist progress (answers so far + whether the hint is open on the current question). */
  onProgress?: (answers: QuestionResult[], hint?: boolean) => void;
  onComplete: (answers: QuestionResult[]) => void;
  /** Expert Free Play: no options are shown, the player types the title and picks it from the suggestions. */
  typeahead?: boolean;
  /** Free Play countdown enabled in Settings. */
  timed?: boolean;
}

/**
 * Guess the Artwork: the complete artwork is on screen from the start (nothing hidden).
 *  - Easy / Intermediate / Daily: tap one of four titles. The optional hint removes two wrong titles (100 → 75 points).
 *  - Expert (Free Play): no options at all; type the title and pick it. The hint names the artist (100 → 75 points).
 * Every answer validates immediately, as in every other mode.
 */
export function GuessGame({ questions, initialAnswers, initialHint, exitHref, onProgress, onComplete, typeahead, timed }: Props) {
  const i = useI18n();
  const { t } = i;
  const [hint, setHint] = useState(!!initialHint);
  const [selected, setSelected] = useState<string | null>(null);

  const progress = useCallback((a: QuestionResult[]) => onProgress?.(a, false), [onProgress]);
  const flow = useGameFlow({ total: questions.length, initial: initialAnswers, onProgress: progress, onComplete });

  const q = questions[flow.index];
  const art = mustArtwork(q.artworkId);
  const answered = flow.answered;
  const picked = answered ? (selected ?? String(flow.current?.answer)) : null;
  const eliminated = useMemo(() => (hint && !typeahead ? hintEliminated(q) : undefined), [hint, typeahead, q]);

  // Warm the cache for the next artwork while the player studies this one.
  useEffect(() => {
    const next = questions[flow.index + 1];
    if (next) preloadArtwork(getArtwork(next.artworkId));
  }, [flow.index, questions]);

  const openHint = () => {
    if (hint || answered) return;
    setHint(true);
    onProgress?.(flow.answers, true);
    playSound("reveal");
  };

  // Like every other mode: choosing an answer validates it immediately.
  const choose = (id: string) => {
    if (answered) return;
    const correct = id === q.correctId;
    const points = correct ? guessPoints(hint) : 0;
    setSelected(id);
    playSound(correct ? "correct" : "wrong");
    flow.submit({ artworkIds: [art.id], correctArtworkIds: correct ? [art.id] : [], correct, points, maxPoints: 100, answer: id, hint });
  };

  const expire = () => {
    playSound("wrong");
    flow.timeout(art.id, hint);
  };

  const goNext = () => {
    flow.next();
    if (flow.isLast) return;
    setSelected(null);
    setHint(false);
    onProgress?.(flow.answers, false);
    playSound("next");
  };

  const worth = guessPoints(hint);
  const hintText = typeahead && art.artist ? t("guess.hint.artist", { artist: art.artist }) : typeahead ? t("guess.hint.text", { category: i.category(art.category), period: i.period(art.period) }) : t("guess.hint.eliminate");

  return (
    <GameShell
      mode="guess"
      index={flow.index}
      total={questions.length}
      score={flow.score}
      streak={flow.streak}
      timer={timed ? { seconds: TIMER_SECONDS, active: !answered, onExpire: expire } : undefined}
      exitHref={exitHref}
    >
      <div className="grid gap-8 lg:grid-cols-[1.25fr_1fr] lg:gap-12">
        <figure>
          <div className="flex justify-center bg-surface p-3 sm:p-6">
            <ArtImage
              key={art.id}
              artwork={art}
              alt={answered ? i.t("guess.altRevealed", { title: art.title, artist: i.artist(art) }) : i.t("guess.alt", { category: i.category(art.category), period: i.period(art.period) })}
              sizes="(min-width:1024px) 52vw, 94vw"
              priority
              className="art-reveal h-auto max-h-[62dvh] w-auto max-w-full object-contain"
            />
          </div>
        </figure>

        <div className="space-y-6">
          <div className="space-y-5">
            <div>
              <p className="eyebrow mb-3" id="guess-prompt">
                {typeahead ? t("guess.promptType") : t("guess.prompt")}
              </p>
              {typeahead ? (
                <TitleSearch key={art.id} disabled={answered} onPick={choose} onGiveUp={() => choose("giveup")} />
              ) : (
                <ChoiceList label={t("guess.optionsLabel")} options={q.options} onSelect={choose} eliminated={eliminated} result={picked ? { selectedId: picked, correctId: q.correctId } : null} />
              )}
            </div>

            {!answered ? (
              <>
                <div className="flex flex-wrap items-center gap-3">
                  <button type="button" onClick={openHint} disabled={hint} className="btn btn-ghost">
                    <Lightbulb size={16} aria-hidden /> {t("guess.hint.open", { cost: HINT_COST })}
                  </button>
                  <p className="text-sm text-muted" aria-live="polite">
                    {t("guess.value", { points: worth })}
                  </p>
                </div>
                {hint ? (
                  <div className="fade-up border-l-2 border-accent pl-4" role="status">
                    <p className="eyebrow !text-accent">{t("guess.hint.title")}</p>
                    <p className="mt-1">{hintText}</p>
                    <p className="mt-1 text-sm text-muted">{t("guess.hint.used", { points: worth })}</p>
                  </div>
                ) : null}
              </>
            ) : null}
          </div>

          {flow.current ? (
            <>
              <AnswerFeedback correct={flow.current.correct} points={flow.current.points} correctLabel={art.title} isLast={flow.isLast} onNext={goNext} note={flow.current.hint ? t("game.addedHint") : undefined} />
              <InfoPanel artwork={art} />
            </>
          ) : null}
        </div>
      </div>
    </GameShell>
  );
}

const MAX_SUGGESTIONS = 6;

/** Title search for Expert mode: an accessible combobox over every title that can be a Guess answer. */
function TitleSearch({ disabled, onPick, onGiveUp }: { disabled: boolean; onPick: (id: string) => void; onGiveUp: () => void }) {
  const { t, num } = useI18n();
  const uid = useId();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const candidates = useMemo(() => dataset.artworks.filter((a) => a.quiz.guess && hasUsableTitle(dataset, a)).map((a) => ({ a, n: norm(a.title) })), []);
  const suggestions: Artwork[] = useMemo(() => {
    const words = norm(query).split(" ").filter(Boolean);
    if (!words.length || norm(query).length < 2) return [];
    return candidates
      .filter(({ n }) => words.every((w) => n.includes(w)))
      .sort((x, y) => Number(y.n.startsWith(words[0])) - Number(x.n.startsWith(words[0])) || x.n.localeCompare(y.n))
      .slice(0, MAX_SUGGESTIONS)
      .map(({ a }) => a);
  }, [candidates, query]);
  const open = !disabled && suggestions.length > 0;
  const current = Math.min(active, Math.max(0, suggestions.length - 1));

  const onKey = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((current + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((current - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      onPick(suggestions[current].id);
    }
  };

  return (
    <div>
      <label htmlFor={`${uid}-in`} className="sr-only">
        {t("guess.search.label")}
      </label>
      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
        <input
          id={`${uid}-in`}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={`${uid}-list`}
          aria-autocomplete="list"
          aria-activedescendant={open ? `${uid}-o${current}` : undefined}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          enterKeyHint="go"
          disabled={disabled}
          value={query}
          placeholder={t("guess.search.placeholder")}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={onKey}
          className="min-h-14 w-full rounded-[3px] border border-strong bg-bg py-3 pl-11 pr-4 text-[0.98rem] focus:border-ink"
        />
      </div>
      <ul id={`${uid}-list`} role="listbox" aria-label={t("guess.search.label")} hidden={!open} className="mt-2 grid gap-1.5">
        {suggestions.map((a, k) => (
          <li key={a.id} id={`${uid}-o${k}`} role="option" aria-selected={k === current}>
            <button
              type="button"
              tabIndex={-1}
              onClick={() => onPick(a.id)}
              onMouseEnter={() => setActive(k)}
              className={`flex min-h-12 w-full flex-col items-start rounded-[3px] border px-4 py-2 text-left ${k === current ? "border-ink bg-surface" : "border-strong"}`}
            >
              <span>{a.title}</span>
              <span className="text-xs text-muted">{[a.artist, a.dateDisplay].filter(Boolean).join(" · ")}</span>
            </button>
          </li>
        ))}
      </ul>
      <p className="sr-only" role="status" aria-live="polite">
        {query.trim().length >= 2 && !suggestions.length ? t("guess.search.none") : open ? t("guess.search.count", { n: num(suggestions.length) }) : ""}
      </p>
      {query.trim().length >= 2 && !suggestions.length && !disabled ? <p className="mt-2 text-sm text-muted">{t("guess.search.none")}</p> : null}
      {!disabled ? (
        <button type="button" onClick={onGiveUp} className="btn btn-ghost mt-3">
          {t("guess.giveUp")}
        </button>
      ) : null}
    </div>
  );
}
