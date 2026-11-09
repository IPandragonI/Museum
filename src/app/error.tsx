"use client";

import { useI18n } from "@/lib/i18n/useI18n";

/** Route-level error boundary: a clear, translated message and a way to retry. */
export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  const { t } = useI18n();
  return (
    <div className="py-28 text-center" role="alert">
      <h1 className="display text-5xl">{t("game.errorTitle")}</h1>
      <p className="mx-auto mt-4 max-w-md text-muted">{t("game.errorBody")}</p>
      <button type="button" onClick={reset} className="btn btn-primary mt-8">
        {t("game.retry")}
      </button>
    </div>
  );
}
