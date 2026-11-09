"use client";

import { useI18n } from "@/lib/i18n/useI18n";

export function SkipLink() {
  const { t } = useI18n();
  return (
    <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-bg focus:p-3">
      {t("nav.skip")}
    </a>
  );
}
