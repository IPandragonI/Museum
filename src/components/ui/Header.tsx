"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n/useI18n";
import { NAV, isActive } from "./nav";
import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  const pathname = usePathname();
  const { t } = useI18n();
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-8 sm:py-5">
      <Link href="/" className="display inline-flex min-h-11 items-center text-[1.65rem] tracking-[0.28em] sm:text-[1.85rem]" aria-label={t("nav.home")}>
        MUSEUM
      </Link>
      <nav aria-label={t("nav.primary")} className="hidden items-center gap-8 md:flex">
        {NAV.map((n) => {
          const active = isActive(pathname, n.href);
          return (
            <Link key={n.href} href={n.href} aria-current={active ? "page" : undefined} className={`inline-flex min-h-11 items-center text-sm tracking-wide transition-colors hover:text-ink ${active ? "text-ink underline decoration-accent decoration-2 underline-offset-[10px]" : "text-muted"}`}>
              {t(n.label)}
            </Link>
          );
        })}
      </nav>
      <ThemeToggle />
    </header>
  );
}
