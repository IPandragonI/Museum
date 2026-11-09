"use client";

import { artworks } from "@/lib/data";
import { DIFFICULTIES, MODES } from "@/lib/game/config";
import { useI18n } from "@/lib/i18n/useI18n";
import { useAppData } from "@/lib/storage/useAppData";

function Bar({ value }: { value: number | null }) {
  return (
    <div className="h-[3px] w-full bg-line" aria-hidden>
      <div className="h-full bg-accent transition-[width] duration-700" style={{ width: `${value ?? 0}%` }} />
    </div>
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
      {empty ? <p className="mt-10 text-sm text-muted">{t("st.empty")}</p> : null}
    </div>
  );
}
