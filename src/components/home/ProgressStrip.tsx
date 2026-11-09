"use client";

import Link from "next/link";
import { artworks } from "@/lib/data";
import { useI18n } from "@/lib/i18n/useI18n";
import { useAppData } from "@/lib/storage/useAppData";

/** Four quiet numbers — deliberately not a dashboard. */
export function ProgressStrip() {
  const { t, num } = useI18n();
  const { data } = useAppData();
  const items = [
    { label: t("progress.discovered"), value: data ? num(data.collection.length) : "–", sub: t("progress.of", { n: num(artworks.length) }), href: "/collection/" },
    { label: t("progress.games"), value: data ? num(data.stats.gamesPlayed) : "–" },
    { label: t("progress.accuracy"), value: data && data.stats.questionsAnswered ? `${data.stats.accuracy} %` : "–" },
    { label: t("progress.streak"), value: data ? num(data.stats.streak.current) : "–", sub: data && data.stats.streak.best ? t("progress.best", { n: data.stats.streak.best }) : undefined },
  ];
  return (
    <section aria-label={t("progress.title")} className="border-t border-line py-12">
      <div className="flex items-end justify-between">
        <p className="eyebrow">{t("progress.title")}</p>
        <Link href="/stats/" className="link inline-flex min-h-11 items-center text-sm text-muted">
          {t("progress.all")}
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
