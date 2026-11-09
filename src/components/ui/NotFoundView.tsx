"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/useI18n";

export function NotFoundView() {
  const { t } = useI18n();
  return (
    <div className="py-28 text-center">
      <h1 className="display text-5xl">{t("nf.title")}</h1>
      <p className="mx-auto mt-4 max-w-md text-muted">{t("nf.body")}</p>
      <Link href="/" className="btn btn-primary mt-8">
        {t("nf.home")}
      </Link>
    </div>
  );
}
