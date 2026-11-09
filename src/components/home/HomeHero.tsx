"use client";

import { useI18n } from "@/lib/i18n/useI18n";

export function HomeHero() {
  const { t } = useI18n();
  return (
    <section className="pb-14 pt-10 sm:pb-20 sm:pt-20">
      <p className="eyebrow">{t("home.eyebrow")}</p>
      <h1 className="display mt-5 max-w-4xl text-[clamp(2.75rem,9vw,7.25rem)]">
        {t("home.title.lead")} <em className="text-accent">{t("home.title.em")}</em>
      </h1>
      <p className="mt-8 max-w-xl text-lg leading-relaxed text-muted">{t("home.intro")}</p>
    </section>
  );
}
