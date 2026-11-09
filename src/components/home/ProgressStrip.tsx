"use client";

import Link from "next/link";
import { artworks } from "@/lib/data";
import { useAppData } from "@/lib/storage/useAppData";

/** Four quiet numbers — deliberately not a dashboard. */
export function ProgressStrip() {
  const { data } = useAppData();
  const items = [
    { label: "Artworks discovered", value: data ? `${data.collection.length}` : "–", sub: `of ${artworks.length}`, href: "/collection/" },
    { label: "Games played", value: data ? `${data.stats.gamesPlayed}` : "–" },
    { label: "Overall accuracy", value: data ? (data.stats.questionsAnswered ? `${data.stats.accuracy}%` : "–") : "–" },
    { label: "Daily streak", value: data ? `${data.stats.streak.current}` : "–", sub: data && data.stats.streak.best ? `best ${data.stats.streak.best}` : undefined },
  ];
  return (
    <section aria-label="Your progress" className="border-t border-line py-12">
      <div className="flex items-end justify-between">
        <p className="eyebrow">Your progress</p>
        <Link href="/stats/" className="link text-sm text-muted">
          All statistics
        </Link>
      </div>
      <dl className="mt-6 grid grid-cols-2 gap-8 lg:grid-cols-4">
        {items.map((it) => (
          <div key={it.label}>
            <dt className="text-sm text-muted">{it.label}</dt>
            <dd className="mt-1 flex items-baseline gap-2">
              {it.href ? (
                <Link href={it.href} className="display text-5xl tabular-nums hover:text-accent">
                  {it.value}
                </Link>
              ) : (
                <span className="display text-5xl tabular-nums">{it.value}</span>
              )}
              {it.sub ? <span className="text-sm text-muted">{it.sub}</span> : null}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
