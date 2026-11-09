"use client";

import { artworks } from "@/lib/data";
import { DIFFICULTIES, DIFFICULTY_INFO, MODES, MODE_INFO } from "@/lib/game/config";
import { formatDateLong } from "@/lib/game/daily";
import { useAppData } from "@/lib/storage/useAppData";

function Bar({ value }: { value: number | null }) {
  return (
    <div className="h-[3px] w-full bg-line" aria-hidden>
      <div className="h-full bg-accent transition-[width] duration-700" style={{ width: `${value ?? 0}%` }} />
    </div>
  );
}

export function StatsView() {
  const { data, error } = useAppData();
  if (error) return <p className="py-24 text-center text-muted">Statistics need local storage, which isn’t available in this browser session.</p>;
  if (!data) return <p className="py-24 text-center text-sm text-muted" role="status">Counting…</p>;
  const s = data.stats;
  const empty = s.gamesPlayed === 0;

  const headline = [
    { label: "Games played", value: s.gamesPlayed },
    { label: "Questions answered", value: s.questionsAnswered },
    { label: "Overall accuracy", value: empty ? "–" : `${s.accuracy}%` },
    { label: "Artworks discovered", value: `${data.collection.length}/${artworks.length}` },
  ];

  return (
    <div className="pt-8 sm:pt-14">
      <p className="eyebrow">Your record</p>
      <h1 className="display mt-3 text-5xl sm:text-7xl">Statistics</h1>
      <p className="mt-4 max-w-xl text-muted">Everything here is calculated from the games stored on this device. Accuracy is the share of available points you earned.</p>

      <dl className="mt-12 grid grid-cols-2 gap-8 border-y border-line py-8 lg:grid-cols-4">
        {headline.map((h) => (
          <div key={h.label}>
            <dt className="text-sm text-muted">{h.label}</dt>
            <dd className="display mt-1 text-5xl tabular-nums">{h.value}</dd>
          </div>
        ))}
      </dl>

      <section className="mt-12 grid gap-12 lg:grid-cols-2" aria-label="Daily streak">
        <div>
          <h2 className="eyebrow mb-4">Daily streak</h2>
          <dl className="grid grid-cols-3 gap-6">
            <div>
              <dt className="text-sm text-muted">Current</dt>
              <dd className="display mt-1 text-4xl tabular-nums">{s.streak.current}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted">Best</dt>
              <dd className="display mt-1 text-4xl tabular-nums">{s.streak.best}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted">Last completed</dt>
              <dd className="mt-2 text-sm" suppressHydrationWarning>
                {s.streak.lastCompleted ? formatDateLong(s.streak.lastCompleted) : "—"}
              </dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-muted">A day counts once all four daily games are finished.</p>
        </div>

        <div>
          <h2 className="eyebrow mb-4">Accuracy by difficulty</h2>
          <ul className="space-y-4">
            {DIFFICULTIES.map((d) => (
              <li key={d}>
                <div className="mb-1.5 flex justify-between text-sm">
                  <span>{DIFFICULTY_INFO[d].name}</span>
                  <span className="tabular-nums text-muted">{s.accuracyByDifficulty[d] === null ? "no games yet" : `${s.accuracyByDifficulty[d]}%`}</span>
                </div>
                <Bar value={s.accuracyByDifficulty[d]} />
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-14" aria-label="By game mode">
        <h2 className="eyebrow mb-4">By game mode</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-left">
            <thead>
              <tr className="border-b border-line text-xs text-muted">
                <th className="py-3 pr-4 font-medium uppercase tracking-widest">Mode</th>
                <th className="py-3 pr-4 font-medium uppercase tracking-widest">Best score</th>
                <th className="py-3 font-medium uppercase tracking-widest">Accuracy</th>
              </tr>
            </thead>
            <tbody>
              {MODES.map((m) => {
                const best = s.bestScore[m];
                const acc = s.accuracyByMode[m];
                return (
                  <tr key={m} className="border-b border-line">
                    <th scope="row" className="py-4 pr-4 text-base font-normal">
                      {MODE_INFO[m].name}
                    </th>
                    <td className="py-4 pr-4 tabular-nums">{best ? `${best.points} / ${best.max}` : "—"}</td>
                    <td className="w-1/3 py-4">
                      <div className="mb-1.5 text-sm tabular-nums text-muted">{acc === null ? "—" : `${acc}%`}</div>
                      <Bar value={acc} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
      {empty ? <p className="mt-10 text-sm text-muted">Play a game and your numbers will appear here.</p> : null}
    </div>
  );
}
