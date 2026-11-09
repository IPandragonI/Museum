"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV, isActive } from "./nav";

/** Mobile navigation: thumb-reachable tab bar. */
export function BottomNav() {
  const pathname = usePathname();
  // Hide while playing so the artwork has the full screen.
  if (pathname.startsWith("/play")) return null;
  return (
    <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-none md:hidden">
      <ul className="mx-auto flex max-w-md items-stretch justify-between px-2">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href} className="flex-1">
              <Link href={href} aria-current={active ? "page" : undefined} className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-[0.68rem] tracking-wide ${active ? "text-ink" : "text-muted"}`}>
                <Icon size={20} strokeWidth={active ? 2 : 1.5} aria-hidden />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
