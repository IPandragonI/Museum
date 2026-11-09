"use client";

import { artworks } from "@/lib/data";
import { useI18n } from "@/lib/i18n/useI18n";

const LINKS = {
  cleveland: "https://www.clevelandart.org/open-access",
  cc0: "https://creativecommons.org/publicdomain/zero/1.0/",
  wikipedia: "https://www.wikipedia.org/",
  commons: "https://commons.wikimedia.org/",
  ccbysa: "https://creativecommons.org/licenses/by-sa/4.0/",
} as const;

function ExtLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="underline decoration-line underline-offset-4 hover:decoration-ink">
      {children}
    </a>
  );
}

/** Where every image and text comes from, and under which licence (required by CC BY-SA and good practice for CC0). */
export function CreditsView() {
  const { t, num } = useI18n();
  const famous = artworks.filter((a) => a.id.startsWith("wd-")).length;
  const cleveland = artworks.length - famous;

  return (
    <article className="max-w-3xl pt-8">
      <h1 className="display text-5xl sm:text-6xl">{t("credits.title")}</h1>
      <p className="mt-6 text-lg text-muted">{t("credits.intro")}</p>
      <p className="mt-3 text-sm text-muted">{t("credits.counts", { cleveland: num(cleveland), famous: num(famous), total: num(artworks.length) })}</p>

      <section className="mt-12 border-t border-line pt-6" aria-labelledby="cr-cleveland">
        <h2 id="cr-cleveland" className="display text-3xl">
          {t("credits.cleveland.title")}
        </h2>
        <p className="mt-3">{t("credits.cleveland.text")}</p>
        <p className="mt-3 text-sm">
          <ExtLink href={LINKS.cleveland}>{t("credits.cleveland.link")}</ExtLink> · <ExtLink href={LINKS.cc0}>CC0 1.0</ExtLink>
        </p>
      </section>

      <section className="mt-10 border-t border-line pt-6" aria-labelledby="cr-wiki">
        <h2 id="cr-wiki" className="display text-3xl">
          {t("credits.wiki.title")}
        </h2>
        <p className="mt-3">{t("credits.wiki.text")}</p>
        <p className="mt-3 text-sm">
          <ExtLink href={LINKS.wikipedia}>Wikipedia</ExtLink> · <ExtLink href={LINKS.commons}>Wikimedia Commons</ExtLink> · <ExtLink href={LINKS.ccbysa}>CC BY-SA 4.0</ExtLink>
        </p>
      </section>

      <section className="mt-10 border-t border-line pt-6" aria-labelledby="cr-fr">
        <h2 id="cr-fr" className="display text-3xl">
          {t("credits.fr.title")}
        </h2>
        <p className="mt-3">{t("credits.fr.text")}</p>
      </section>

      <section className="mt-10 border-t border-line pt-6" aria-labelledby="cr-soft">
        <h2 id="cr-soft" className="display text-3xl">
          {t("credits.software.title")}
        </h2>
        <p className="mt-3">{t("credits.software.text")}</p>
      </section>

      <section className="mt-10 border-t border-line pt-6" aria-labelledby="cr-note">
        <h2 id="cr-note" className="display text-3xl">
          {t("credits.disclaimer.title")}
        </h2>
        <p className="mt-3 text-muted">{t("credits.disclaimer.text")}</p>
      </section>
    </article>
  );
}
