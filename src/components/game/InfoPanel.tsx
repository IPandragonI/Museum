"use client";

import { ExternalLink } from "lucide-react";
import { useI18n } from "@/lib/i18n/useI18n";
import type { Artwork } from "@/lib/types";

interface Props {
  artwork: Artwork;
  /** Show the artist biography (used by "Who Is the Artist?"). */
  showBio?: boolean;
  /** Longer layout for the collection dialog. */
  full?: boolean;
}

/** The educational card shown after every answer and in the collection. All text follows the selected language. */
export function InfoPanel({ artwork: a, showBio, full }: Props) {
  const i = useI18n();
  const { t } = i;
  const c = i.content(a);
  const movement = i.movement(a.movement);
  const medium = i.medium(a.medium);

  // Facts: the museum's own "did you know", then data-derived lines rendered in the active language.
  const facts: string[] = [...c.didYouKnow];
  if (full) {
    if (medium) facts.push(t("info.mediumFact", { m: medium }));
    if (a.measurements) facts.push(t("info.measures", { m: a.measurements }));
    if (a.artist && a.artistBirthYear && a.yearSpan <= 2 && !/c\.|ca\.|about|probably|possibly/i.test(a.dateDisplay)) {
      const age = a.creationYear - a.artistBirthYear;
      if (age >= 12 && age <= 90) facts.push(t("info.age", { artist: a.artist, n: age }));
    }
  }
  const shownFacts = facts.slice(0, full ? 4 : 1);

  return (
    <div className="fade-up space-y-5">
      <div>
        <h3 className="display text-3xl sm:text-4xl">{a.title}</h3>
        <p className="mt-2 text-base">
          {i.artist(a)}
          {a.artistBirthYear && a.artistDeathYear ? (
            <span className="text-muted">
              {" "}
              · {a.artistBirthYear}–{a.artistDeathYear}
            </span>
          ) : null}
        </p>
      </div>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 border-y border-line py-4 text-sm sm:grid-cols-3">
        <Meta label={t("info.date")} value={i.artworkDate(a)} />
        {movement ? <Meta label={t("info.movement")} value={movement} /> : <Meta label={t("info.period")} value={i.period(a.period)} />}
        <Meta label={t("info.category")} value={i.category(a.category)} />
        {medium ? <Meta label={t("info.medium")} value={medium} /> : null}
        <Meta label={t("info.collection")} value={a.museum.replace(/^The /, "")} />
      </dl>
      <p className="max-w-prose text-[0.95rem] leading-relaxed">{c.description}</p>
      {shownFacts.length ? (
        <div className="border-l-2 border-accent pl-4">
          <p className="eyebrow mb-1 !text-accent">{t("info.didYouKnow")}</p>
          <ul className="space-y-1 text-[0.92rem] text-muted">
            {shownFacts.map((f, k) => (
              <li key={k}>{f}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {showBio && c.artistBio ? (
        <div>
          <p className="eyebrow mb-1">{t("info.aboutArtist")}</p>
          <p className="max-w-prose text-[0.92rem] leading-relaxed text-muted">{c.artistBio}</p>
        </div>
      ) : null}
      {full ? (
        <div className="space-y-1 text-xs leading-relaxed text-muted">
          <p>
            {t("info.credit", { museum: a.museum, license: a.license })}{" "}
            <a className="link inline-flex items-center gap-1" href={a.sourceUrl} target="_blank" rel="noreferrer">
              {t("info.sourceRecord")} <ExternalLink size={12} aria-hidden />
            </a>
          </p>
          {a.descriptionSource && !/CC0/i.test(a.descriptionSource.license) ? (
            <p>
              {t("info.textCredit", { name: a.descriptionSource.name, license: a.descriptionSource.license })}{" "}
              {a.descriptionSource.url ? (
                <a className="link" href={a.descriptionSource.url} target="_blank" rel="noreferrer">
                  {t("info.sourceRecord")}
                </a>
              ) : null}
            </p>
          ) : null}
          {c.translated && /Cleveland/i.test(a.museum) ? <p>{t("info.translated")}</p> : null}
        </div>
      ) : null}
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="eyebrow">{label}</dt>
      <dd className="mt-0.5">{value}</dd>
    </div>
  );
}
