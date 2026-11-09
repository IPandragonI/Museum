"use client";

import { useEffect } from "react";
import { useI18n } from "@/lib/i18n/useI18n";
import type { MessageKey } from "@/lib/i18n";

/** Keeps the browser tab title and meta description in the active language (static metadata is French). */
export function PageTitle({ k }: { k?: MessageKey }) {
  const { t } = useI18n();
  useEffect(() => {
    const apply = () => {
      document.title = k ? `${t(k)} · MUSEUM` : t("app.metaTitle");
      document.querySelector('meta[name="description"]')?.setAttribute("content", t("app.metaDescription"));
    };
    apply();
    // Next's metadata manager can re-apply the static French title right after hydration; assert ours once more.
    const id = window.setTimeout(apply, 400);
    return () => window.clearTimeout(id);
  }, [k, t]);
  return null;
}
