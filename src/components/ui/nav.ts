import { BarChart3, Calendar, GalleryVertical, Home, Settings } from "lucide-react";
import type { MessageKey } from "@/lib/i18n";

export const NAV: readonly { href: string; label: MessageKey; icon: typeof Home }[] = [
  { href: "/", label: "nav.play", icon: Home },
  { href: "/daily/", label: "nav.daily", icon: Calendar },
  { href: "/collection/", label: "nav.collection", icon: GalleryVertical },
  { href: "/stats/", label: "nav.stats", icon: BarChart3 },
  { href: "/settings/", label: "nav.settings", icon: Settings },
];

export function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/" || pathname.startsWith("/play");
  return pathname.startsWith(href.replace(/\/$/, ""));
}
