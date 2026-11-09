"use client";

import { useCallback, useEffect, useState } from "react";
import { isDataLoaded, loadData } from "@/lib/data";
import { useI18n } from "@/lib/i18n/useI18n";

/**
 * Loads the artwork dataset on demand (it is not part of the page JavaScript) and renders the page once it is
 * available. The first render is always the "loading" state, on the server and the client, so hydration matches.
 */
export function DataGate({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  const load = useCallback(() => {
    setState("loading");
    loadData().then(
      () => setState("ready"),
      () => setState("error"),
    );
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- starting the (one-time) data load on mount
    if (isDataLoaded()) setState("ready");
    else load();
  }, [load]);

  if (state === "ready") return <>{children}</>;
  if (state === "error") {
    return (
      <div className="py-24 text-center" role="alert">
        <p className="display text-3xl">{t("data.error.title")}</p>
        <p className="mx-auto mt-3 max-w-md text-muted">{t("data.error.text")}</p>
        <button type="button" onClick={load} className="btn btn-primary mt-8">
          {t("data.error.retry")}
        </button>
      </div>
    );
  }
  return (
    <div className="grid min-h-[50dvh] place-items-center" role="status" aria-live="polite">
      <p className="eyebrow">{t("data.loading")}</p>
    </div>
  );
}
