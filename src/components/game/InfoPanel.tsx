import { ExternalLink } from "lucide-react";
import { CATEGORY_LABEL, artistLine, formatYear } from "@/lib/data";
import type { Artwork } from "@/lib/types";

interface Props {
  artwork: Artwork;
  /** Show the artist biography (used by "Who Is the Artist?"). */
  showBio?: boolean;
  /** Longer layout for the collection dialog. */
  full?: boolean;
}

/** The educational card shown after every answer and in the collection. */
export function InfoPanel({ artwork: a, showBio, full }: Props) {
  const facts = a.interestingFacts.slice(0, full ? 3 : 1);
  return (
    <div className="fade-up space-y-5">
      <div>
        <h3 className="display text-3xl sm:text-4xl">{a.title}</h3>
        <p className="mt-2 text-base">
          {artistLine(a)}
          {a.artistBirthYear && a.artistDeathYear ? <span className="text-muted"> · {a.artistBirthYear}–{a.artistDeathYear}</span> : null}
        </p>
      </div>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 border-y border-line py-4 text-sm sm:grid-cols-3">
        <Meta label="Date" value={formatYear(a)} />
        <Meta label="Movement" value={a.movement} />
        <Meta label="Category" value={CATEGORY_LABEL[a.category]} />
        {a.medium ? <Meta label="Medium" value={a.medium} /> : null}
        <Meta label="Collection" value={a.museum.replace(/^The /, "")} />
      </dl>
      <p className="max-w-prose text-[0.95rem] leading-relaxed">{a.description}</p>
      {facts.length ? (
        <div className="border-l-2 border-accent pl-4">
          <p className="eyebrow mb-1 !text-accent">Did you know</p>
          <ul className="space-y-1 text-[0.92rem] text-muted">
            {facts.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {showBio && a.artistBio ? (
        <div>
          <p className="eyebrow mb-1">About the artist</p>
          <p className="max-w-prose text-[0.92rem] leading-relaxed text-muted">{a.artistBio}</p>
        </div>
      ) : null}
      {full ? (
        <p className="text-xs leading-relaxed text-muted">
          Image &amp; data: {a.museum} — {a.license}.{" "}
          <a className="link inline-flex items-center gap-1" href={a.sourceUrl} target="_blank" rel="noreferrer">
            Source record <ExternalLink size={12} aria-hidden />
          </a>
        </p>
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
