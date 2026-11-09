"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/useI18n";

/** Site footer, shown on every page: link to the credits & licences page. Sits above the mobile bottom nav. */
export function Footer() {
  const { t } = useI18n();
  return (
    <footer className="mx-auto w-full max-w-6xl border-t border-line px-4 pb-28 pt-6 text-sm text-muted sm:px-8 md:pb-10">
      <p>
        <Link href="/credits/" className="underline decoration-line underline-offset-4 hover:text-ink hover:decoration-ink">
          {t("footer.credits")}
        </Link>
      </p>
      <p className="mt-1 text-xs">{t("footer.note")}</p>
    </footer>
  );
}
