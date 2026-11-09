"use client";

import Link from "next/link";
import { artworks } from "@/lib/data";
import { DIFFICULTIES, MODES } from "@/lib/game/config";
import { useI18n } from "@/lib/i18n/useI18n";
import type { MasteryRow } from "@/lib/stats";
import { useAppData } from "@/lib/storage/useAppData";

function Bar({ value }: { value: number | null }) {
  return (
    <div className="h-[3px] w-full bg-line" aria-hidden>
      <div className="h-full bg-accent transition-[width] duration-700" style={{ width: `${value ?? 0}%` }} />
    </div>
  );
}

const MIN_ANSWERS = 3; // fewer answers than this say nothing reliable about a movement or an artist

function MasteryList({ title, rows, empty }: { title: string; rows: MasteryRow[]; empty: string }) {
  const { t, num } = useI18n();
  return (
    <div>
      <h3 className="mb-3 text-sm font-medium">{title}</h3>
      {rows.length ? (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li key={r.label}>
              <div className="mb-1.5 flex justify-between gap-3 text-sm">
                <span className="truncate">{r.label}</span>
                <span className="shrink-0 tabular-nums text-muted">{t("st.masteryRow", { pct: num(r.pct), correct: num(r.correct), answered: num(r.answered) })}</span>
              </div>
              <Bar value={r.pct} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">{empty}</p>
      )}
    </div>
  );
}

/** Weakest and strongest movements / artists (at least 3 answers each), with names in the active language. */
function MasterySection({ movements, artists }: { movements: MasteryRow[]; artists: MasteryRow[] }) {
  const i = useI18n();
  const { t } = i;
  const reliable = (rows: MasteryRow[]) => rows.filter((r) => r.answered >= MIN_ANSWERS);
  const weakest = (rows: MasteryRow[]) => reliable(rows).filter((r) => r.pct < 100).slice(0, 5);
  const strongest = (rows: MasteryRow[]) => [...reliable(rows)].reverse().filter((r) => r.pct >= 60).slice(0, 5);
  const localized = (rows: MasteryRow[]) => rows.map((r) => ({ ...r, label: i.movement(r.label) ?? r.label }));
  return (
    <section className="mt-14" aria-label={t("st.mastery")}>
      <h2 className="eyebrow mb-2">{t("st.mastery")}</h2>
      <p className="mb-6 max-w-xl text-sm text-muted">{t("st.masteryIntro", { n: MIN_ANSWERS })}</p>
      <div className="grid gap-10 lg:grid-cols-2">
        <MasteryList title={t("st.weakMovements")} rows={localized(weakest(movements))} empty={t("st.masteryNone")} />
        <MasteryList title={t("st.strongMovements")} rows={localized(strongest(movements))} empty={t("st.masteryNone")} />
        <MasteryList title={t("st.weakArtists")} rows={weakest(artists)} empty={t("st.masteryNone")} />
        <MasteryList title={t("st.strongArtists")} rows={strongest(artists)} empty={t("st.masteryNone")} />
      </div>
    </section>
  );
}

export function StatsView() {
  const i = useI18n();
  const { t, num } = i;
  const { data, error } = useAppData();
  if (error) return <p className="py-24 text-center text-muted">{t("st.error")}</p>;
  if (!data)
    return (
      <p className="py-24 text-center text-sm text-muted" role="status">
        {t("st.loading")}
      </p>
    );
  const s = data.stats;
  const empty = s.gamesPlayed === 0;

  const headline = [
    { label: t("st.games"), value: num(s.gamesPlayed) },
    { label: t("st.questions"), value: num(s.questionsAnswered) },
    { label: t("st.accuracy"), value: empty ? "–" : `${s.accuracy} %` },
    { label: t("st.discovered"), value: `${num(data.collection.length)}/${num(artworks.length)}` },
  ];

  return (
    <div className="pt-8 sm:pt-14">
      <p className="eyebrow">{t("st.eyebrow")}</p>
      <h1 className="display mt-3 text-5xl sm:text-7xl">{t("st.title")}</h1>
      <p className="mt-4 max-w-xl text-muted">{t("st.intro")}</p>

      <dl className="mt-12 grid grid-cols-2 gap-8 border-y border-line py-8 lg:grid-cols-4">
        {headline.map((h) => (
          <div key={h.label}>
            <dt className="text-sm text-muted">{h.label}</dt>
            <dd className="display mt-1 text-5xl tabular-nums">{h.value}</dd>
          </div>
        ))}
      </dl>

      <section className="mt-12 grid gap-12 lg:grid-cols-2" aria-label={t("st.streak")}>
        <div>
          <h2 className="eyebrow mb-4">{t("st.streak")}</h2>
          <dl className="grid grid-cols-3 gap-6">
            <div>
              <dt className="text-sm text-muted">{t("st.current")}</dt>
              <dd className="display mt-1 text-4xl tabular-nums">{num(s.streak.current)}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted">{t("st.best")}</dt>
              <dd className="display mt-1 text-4xl tabular-nums">{num(s.streak.best)}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted">{t("st.last")}</dt>
              <dd className="mt-2 text-sm" suppressHydrationWarning>
                {s.streak.lastCompleted ? i.dateLong(s.streak.lastCompleted) : "—"}
              </dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-muted">{t("st.streakNote")}</p>
        </div>

        <div>
          <h2 className="eyebrow mb-4">{t("st.byDifficulty")}</h2>
          <ul className="space-y-4">
            {DIFFICULTIES.map((d) => (
              <li key={d}>
                <div className="mb-1.5 flex justify-between text-sm">
                  <span>{t(`diff.${d}.name`)}</span>
                  <span className="tabular-nums text-muted">{s.accuracyByDifficulty[d] === null ? t("st.noGames") : `${s.accuracyByDifficulty[d]} %`}</span>
                </div>
                <Bar value={s.accuracyByDifficulty[d]} />
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-14" aria-label={t("st.byMode")}>
        <h2 className="eyebrow mb-4">{t("st.byMode")}</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-left">
            <thead>
              <tr className="border-b border-line text-xs text-muted">
                <th scope="col" className="py-3 pr-4 font-medium uppercase tracking-widest">
                  {t("st.mode")}
                </th>
                <th scope="col" className="py-3 pr-4 font-medium uppercase tracking-widest">
                  {t("st.bestScore")}
                </th>
                <th scope="col" className="py-3 font-medium uppercase tracking-widest">
                  {t("st.accuracyCol")}
                </th>
              </tr>
            </thead>
            <tbody>
              {MODES.map((m) => {
                const best = s.bestScore[m];
                const acc = s.accuracyByMode[m];
                return (
                  <tr key={m} className="border-b border-line">
                    <th scope="row" className="py-4 pr-4 text-base font-normal">
                      {t(`mode.${m}.name`)}
                    </th>
                    <td className="py-4 pr-4 tabular-nums">{best ? `${num(best.points)} / ${num(best.max)}` : "—"}</td>
                    <td className="w-1/3 py-4">
                      <div className="mb-1.5 text-sm tabular-nums text-muted">{acc === null ? "—" : `${acc} %`}</div>
                      <Bar value={acc} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
      {!empty ? <MasterySection movements={data.mastery.movements} artists={data.mastery.artists} /> : null}
      {MODES.some((m) => data.missed[m].length) ? (
        <section className="mt-14" aria-label={t("st.review")}>
          <h2 className="eyebrow mb-2">{t("st.review")}</h2>
          <p className="mb-4 max-w-xl text-sm text-muted">{t("st.reviewIntro")}</p>
          <ul className="divide-y divide-line border-y border-line">
            {MODES.filter((m) => data.missed[m].length).map((m) => (
              <li key={m}>
                <Link href={`/play/${m}/?review=1&start=1&d=intermediate`} className="flex min-h-14 items-center justify-between gap-4 py-3 transition-colors hover:bg-surface sm:px-3">
                  <span>{t(`mode.${m}.name`)}</span>
                  <span className="text-sm text-muted">{i.tn("st.reviewCount", data.missed[m].length)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {empty ? <p className="mt-10 text-sm text-muted">{t("st.empty")}</p> : null}
    </div>
  );
}
