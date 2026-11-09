"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV, isActive } from "./nav";
import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  const pathname = usePathname();
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-8">
      <Link href="/" className="display text-[1.65rem] tracking-[0.28em] sm:text-[1.85rem]" aria-label="MUSEUM — home">
        MUSEUM
      </Link>
      <nav aria-label="Primary" className="hidden items-center gap-8 md:flex">
        {NAV.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            aria-current={isActive(pathname, n.href) ? "page" : undefined}
            className={`text-sm tracking-wide transition-colors hover:text-ink ${isActive(pathname, n.href) ? "text-ink underline decoration-accent decoration-2 underline-offset-[10px]" : "text-muted"}`}
          >
            {n.label}
          </Link>
        ))}
      </nav>
      <ThemeToggle />
    </header>
  );
}
